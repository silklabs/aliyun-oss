'use strict';

var mime = require('mime-types'),
  assert = require('assert'),
  crypto = require('crypto'),
  Stream = require('stream'),
  xml2js = require('xml2js'),
  http = require('http'),
  fs = require('fs');

function OSS(options) {
  this.accessKeyId = options.accessKeyId;
  this.accessKeySecret = options.accessKeySecret;
  this.host = options.host || 'oss-cn-hangzhou.aliyuncs.com';
  this.port = options.port || 80;
  this.timeout = options.timeout || 300000; // 5 minutes

  if (options.hasOwnProperty('agent')) {
    this.agent = options.agent;
  } else {
    var agent = new http.Agent();
    agent.maxSockets = 20;
    this.agent = agent;
  }
}

/*
 * @params
 *
 * method
 * headers
 * resource
 */
OSS.prototype.generateSign = function(method, headers, resource) {
  var params = [];
  params.push(method);
  params.push(headers['Content-Md5'] || '');
  params.push(headers['Content-Type'] || '');
  params.push(headers.Date || '');

  var keys = Object.keys(headers).sort();
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase().indexOf('x-oss') !== -1) {
      params.push(keys[i].toLowerCase() + ':' + headers[keys[i]]);
    }
  }

  params.push(resource);

  var signature = crypto.createHmac('sha1', this.accessKeySecret).update(params.join('\n')).digest('base64');

  return 'OSS ' + this.accessKeyId + ':' + signature;
};

OSS.prototype.getHeaders = function(method, headers, options) {
  headers.Date = new Date().toGMTString();

  if (options.source) {
    var contentType = mime.lookup(options.source);

    if (contentType && !headers['Content-Type']) {
      headers['Content-Type'] = contentType;
    }
    // buffer
    if (Buffer.isBuffer(options.source)) {
      headers['Content-Length'] = options.source.length;
      headers['Content-Md5'] = crypto.createHash('md5').update(options.source).digest('base64');
    }
  }

  var resource = getResource(options);
  headers.Authorization = this.generateSign(method, headers, resource);

  return headers;
};

/*
 * @params
 */
OSS.prototype.request = function(method, options, callback) {
  var self = this;
  var path = getPath(options);
  var host = self.host;
  if (options.bucket) {
    host = options.bucket + '.' + host;
  }

  var headers = options.headers || {};
  headers = self.getHeaders(method, headers, options);

  var req = http.request({
    method: method,
    host: host,
    port: self.port,
    path: path,
    headers: headers,
    timeout: self.timeout,
    agent: self.agent
  }, function(res) {
    var response = {};
    response.status = res.statusCode;
    response.headers = res.headers;

    var chunks = [],
      size = 0;

    if (options.dest) {
      var wstream = (typeof options.dest === 'string') ? fs.createWriteStream(options.dest) : options.dest;
      res.pipe(wstream);

      wstream.on('finish', function() {
        callback(null, response);
      });

      wstream.on('error', function(error) {
        callback(error);
      });
    } else {
      res.on('data', function(chunk) {
        chunks.push(chunk);
        size += chunk.length;
      });
    }

    res.on('end', function() {
      if (options.dest) {
        // callback when wstream finish
        return;
      }

      response.body = Buffer.concat(chunks, size);

      if (!size || res.headers['content-type'] !== 'application/xml') {
        return callback(null, response);
      }

      var parser = new xml2js.Parser();
      parser.parseString(response.body, function(error, result) {
        if (error) {
          error.status = response.status;
          error.code = 'XML Parse Error';
          return callback(error);
        }

        if (res.statusCode >= 400) {
          error = new Error();

          try {
            error.status = response.status;
            error.code = result.Error.Code;
            error.message = result.Error.Message;
            error.requestId = result.Error.RequestId;
          } catch (e) {
            error = e;
          }

          return callback(error);
        }

        response.body = result;
        callback(null, response);
      });
    });
  });

  req.on('error', function(error) {
    callback(error);
  });

  // http req body
  if (options.source) {
    if (options.source instanceof Stream) {
      options.source.pipe(req);
    } else if (typeof options.source === 'string') {
      dealSourceWithFilePath(options.source);
    } else if (Buffer.isBuffer(options.source)) {
      req.end(options.source);
    } else {
      req.end();
    }
  } else {
    req.end();
  }

  function dealSourceWithFilePath(filepath) {
    fs.stat(filepath, function(error, stats) {
      if (error) {
        callback(error);
      } else {
        req.setHeader('Content-Length', stats.size);
        fs.createReadStream(filepath).pipe(req);
      }
    });
  }
};

/*
 * bucket
 */

OSS.prototype.listBucket = function(callback) {
  callback = callback || noop;
  var options = {
    bucket: ''
  };

  this.request('GET', options, callback);
};

/*
 * @params
 *
 * bucket
 * acl
 */
OSS.prototype.createBucket = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  if (options.acl) {
    options.headers = {
      'x-oss-acl': options.acl
    };
  }

  this.request('PUT', options, callback);
};

/*
 * @params
 *
 * bucket
 */
OSS.prototype.deleteBucket = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  this.request('DELETE', options, callback);
};

/*
 * @params
 *
 * bucket
 */
OSS.prototype.getBucketAcl = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  options.isAcl = true;

  this.request('GET', options, callback);
};

/*
 * @params
 *
 * bucket
 * acl
 */
OSS.prototype.setBucketAcl = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  options.headers = {
    'x-oss-acl': options.acl
  };

  this.request('PUT', options, callback);
};

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
OSS.prototype.putObject = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  var host = this.host;

  this.request('PUT', options, function(error, result) {
    if (error) {
      return callback(error);
    }
    result.objectUrl = 'http://' + options.bucket + '.' + host + '/' + options.object;
    callback(null, result);
  });
};

/*
 * @params
 *
 * bucket
 * object
 * sourceBucket
 * sourceObject
 */
OSS.prototype.copyObject = function(options, callback) {
  options = options || {};
  callback = callback || noop;
  options.headers = options.headers || {};
  options.headers['x-oss-copy-source'] = '/' + options.sourceBucket + '/' + options.sourceObject;

  var host = this.host;

  this.request('PUT', options, function(error, result) {
    if (error) {
      return callback(error);
    }
    result.objectUrl = 'http://' + options.bucket + '.' + host + '/' + options.object;
    callback(null, result);
  });
};

/*
 * @params
 *
 * bucket
 * object
 */
OSS.prototype.deleteObject = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  this.request('DELETE', options, callback);
};

/*
 * @params
 *
 * bucket
 * object
 * dest
 * headers
 */
OSS.prototype.getObject = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  this.request('GET', options, callback);
};

/*
 * @params
 *
 * bucket
 * object
 */
OSS.prototype.headObject = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  this.request('HEAD', options, callback);
};

/*
 * @params
 *
 * bucket
 * prefix
 * marker
 * delimiter
 * maxKeys
 */
OSS.prototype.getBucket = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  this.request('GET', options, callback);
};

OSS.prototype.listObject = function(options, callback) {
  options = options || {};
  callback = callback || noop;

  this.request('GET', options, callback);
};

/**
 * exports
 */
exports.createClient = function(options) {
  assert(typeof options === 'object', 'invalid options');

  var client = new OSS(options);

  var wrapper = options.wrapper;
  if (wrapper) {
    require('thunkify-or-promisify')(client, wrapper, ['request', 'getHeaders', 'generateSign']);
  }

  return client;
};

/**
 * utils
 */
function noop() {}

function getResource(options) {
  var resource = '';

  if (options.bucket) {
    resource += '/' + options.bucket;
  }
  if (options.object) {
    resource += '/' + options.object;
  } else {
    resource += '/';
  }
  if (options.isAcl) {
    resource += '?acl';
  }

  return resource;
}

function getPath(options) {
  var path = '';

  if (options.object) {
    path += '/' + options.object.split('/').map(function(item) {
      return encodeURIComponent(item);
    }).join('/');
  }

  var params = [];
  if (options.prefix) {
    params.push('prefix=' + encodeURIComponent(options.prefix));
  }
  if (options.marker) {
    params.push('marker=' + encodeURIComponent(options.marker));
  }
  if (options.maxKeys) {
    params.push('max-keys=' + options.maxKeys);
  }
  if (options.delimiter) {
    params.push('delimiter=' + encodeURIComponent(options.delimiter));
  }
  if (params.length) {
    path += '/?' + params.join('&');
  }

  if (options.isAcl) {
    path += '/?acl';
  }

  return path;
}
