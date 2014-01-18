var fs     = require('fs')
var http   = require('http')
var path   = require('path')
var util   = require('util')
var crypto = require('crypto')
var Stream = require('stream')
var xml2js = require('xml2js')
var mime   = require('mime')

function noop() {}

function OSS(options) {
  this.accessKeyId     = options.accessKeyId
  this.accessKeySecret = options.accessKeySecret
  this.host            = options.host || 'oss-cn-hangzhou.aliyuncs.com'
  this.port            = options.port || 80
  this.timeout         = options.timeout || 300000  // 5 minutes
}

/*
* @params
*
* method
* headers
* resource
*/
OSS.prototype.generateSign = function (method, headers, resource) {
  headers = headers || {}

  var params = []
  params.push(method)
  params.push(headers['Content-Md5'] || '')
  params.push(headers['Content-Type'] || '')
  params.push(headers['Date'] || '')

  var keys = Object.keys(headers).sort()
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase().indexOf('x-oss') !== -1) {
      params.push(keys[i].toLowerCase() + ':' + headers[keys[i]])
    }
  }

  params.push(resource)

  var signature = crypto.createHmac('sha1', this.accessKeySecret).update(params.join('\n')).digest('base64')

  return 'OSS ' + this.accessKeyId + ':' + signature
}

function getResource(options){
  var resource = ''

  if (options.bucket) {
    resource += '/' + options.bucket
  }
  if (options.object) {
    resource += '/' + options.object
  } else {
    resource += '/'
  }
  if (options.isAcl) {
    resource += '?acl'
  }

  return resource
}

OSS.prototype.getPath = function (options) {
  var path = ''

  if (options.object) {
    path += '/' + options.object.split('/').map(function (item) {
      return encodeURIComponent(item)
    }).join('/')
  }

  var params = []
  if (options.prefix) {
    params.push('prefix=' + options.prefix)
  }
  if (options.marker) {
    params.push('marker=' + options.marker)
  }
  if (options.maxKeys) {
    params.push('max-keys=' + options.maxKeys)
  }
  if (options.delimiter) {
    params.push('delimiter='+ options.delimiter)
  }
  if (params.length) {
    path += '?' + params.join('&')
  }

  if (options.isAcl) {
    path += '?acl'
  }

  return path
}

OSS.prototype.getHeaders = function (method, headers, options) {
  headers = headers || {}

  headers['Date'] = new Date().toGMTString()

  if (options.source) {
    headers['Content-Type'] = headers['Content-Type'] || mime.lookup(path.extname(options.source))
    // buffer
    if(Buffer.isBuffer(options.source)) {
      headers['Content-Length'] = options.source.length
      // headers['Content-Md5']    = crypto.createHash('md5').update(options.source).digest('hex')
    }
  } else {
    headers['Content-Length'] = headers['Content-Length'] || 0
    // headers['Content-Type'] = ''
  }

  var resource = getResource(options)
  headers['Authorization'] = this.generateSign(method, headers, resource)

  return headers
}

/*
* @params
*/
OSS.prototype.request = function (method, headers, options, callback) {
  method   = method || 'GET'
  headers  = headers || {}
  options  = options || {}
  callback = callback || noop

  var self = this
  var path = self.getPath(options)
  var host = self.host
  if (options.bucket) {
    host = options.bucket + '.' + host
  }
  headers = self.getHeaders(method, headers, options)

  var req = http.request({
    method: method,
    host: host,
    port: self.port,
    path: path,
    timeout: self.timeout
  }, function (res) {
    res.setEncoding('utf8')

    var wstream
    var response = {}

    response.status  = res.statusCode
    response.headers = res.headers
    response.body    = ''

    if (options.dest) {
      wstream = (typeof options.dest === 'string') ? fs.createWriteStream(options.dest) : options.dest
      res.pipe(wstream)
      wstream.on('finish', function () {
        // bug - maybe run callback multiple times
        callback(null, response)
      })
      wstream.on('error', function () {
        callback(error, null)
      })
    } else {
      res.on('data', function (chunk) {
        response.body += chunk
      })
    }

    res.on('error', function (error) {
      callback(error, null)
    })
    res.on('end', function () {
      if (res.statusCode !== 200 && res.statusCode !== 204) {
        var error  = new Error(response.body)
        error.code = response.status
        return callback(error, null)
      }
      var parser = new xml2js.Parser()
      parser.parseString(response.body, function (error, result) {
        if (error) {
          callback(error, null)
        } else {
          response.body = result
          callback(null, response)
        }
      })
    })
  })

  // http req headers
  for (var header in headers) {
    req.setHeader(header, headers[header])
  }

  // http req body
  if (options.source) {
    if (options.source instanceof Stream) {
      options.source.pipe(req)
    } else if (typeof options.source === 'string') {
      dealSourceWithFilePath(options.source)
    } else if (Buffer.isBuffer(options.source)) {
      req.end(options.source)
    } else {
      req.end()
    }
  } else {
    req.end()
  }

  function dealSourceWithFilePath(filepath) {
    fs.stat(filepath, function (error, stats) {
      if (error) {
        callback(error)
      } else {
        req.setHeader('Content-Length', stats.size)
        fs.createReadStream(filepath).pipe(req)
      }
    })
  }
}

/*
* bucket
*/

/*
* @params
*
* bucket
* acl
*/
OSS.prototype.createBucket = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  var headers = {}
  if (options.acl) {
    headers['x-oss-acl'] = options.acl
  }

  this.request('PUT', headers, options, callback)
}

/*
* @params
*
* bucket
*/
OSS.prototype.deleteBucket = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  this.request('DELETE', null, options, callback)
}

/*
* @params
*
* bucket
*/
OSS.prototype.getBucketAcl = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  options.isAcl = true

  this.request('GET', null, options, callback)
}

/*
* @params
*
* bucket
*/
OSS.prototype.setBucketAcl = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  var headers = { 'x-oss-acl': options.acl }

  this.request('PUT', headers, options, callback)
}

/*
* object
*/

/*
* @params
*
* bucket
* object
* source
* headers: {
*   'Content-Type': 'text/plain'
*   'Content-Length': 1024
* }
*/
OSS.prototype.putObject = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  this.request('PUT', options.headers, options, callback)
}

/*
* @params
*
* bucket
* object
* sourceBucket
* sourceObject
*/
OSS.prototype.copyObject = function (options, callback) {
  options  = options || {}
  callback = callback || noop
  var headers = options.headers || {}
  headers['x-oss-copy-source'] = '/' + options.sourceBucket + '/' + options.sourceObject

  this.request('PUT', headers, options, callback)
}

/*
* @params
*
* bucket
* object
*/
OSS.prototype.deleteObject = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  this.request('DELETE', null, options, callback)
}

/*
* @params
*
* bucket
* object
* dest
* headers
*/
OSS.prototype.getObject = function (options, callback) {
  options = options || {}
  callback = callback || noop

  this.request('GET', options.headers, options, callback)
}

/*
* @params
*
* bucket
* object
*/
OSS.prototype.headObject = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  this.request('HEAD', null, options, callback)
}

/*
* @params
*
* bucket
* prefix
* marker
* delimiter
* maxKeys
*/
OSS.prototype.getBucket = OSS.prototype.listObject = function (options, callback) {
  options  = options || {}
  callback = callback || noop

  this.request('GET', null, options, callback)
}

exports.createClient = function (options) {
  return new OSS(options)
}
