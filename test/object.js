'use strict';

var fs = require('fs'),
  should = require('should'),
  uuid = require('node-uuid'),
  config = require('./config'),
  OSS = require('../index'),
  oss = new OSS.createClient(config);

describe('# object', function() {
  var bucket = uuid.v4(),
    object = uuid.v4();

  it('create bucket', function(done) {
    oss.createBucket({
      bucket: bucket,
      acl: 'public-read'
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      done();
    });
  });

  it('put object by file path', function(done) {
    oss.putObject({
      bucket: bucket,
      object: object,
      source: __filename,
      headers: {
        'x-oss-meta-foo': 'bar'
      }
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      res.objectUrl.should.equal('http://' + bucket + '.oss-cn-hangzhou.aliyuncs.com/' + object);
      done();
    });
  });

  it('get object by write stream', function(done) {
    var path = __dirname + '/xxoo.download',
      ws = fs.createWriteStream(path);

    oss.getObject({
      bucket: bucket,
      object: object,
      dest: ws
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      fs.statSync(path).size.should.equal(fs.statSync(__filename).size);
      fs.readFileSync(path, 'utf8').should.equal(fs.readFileSync(__filename, 'utf8'));
      fs.unlinkSync(path);
      done();
    });
  });

  it('get object by file path', function(done) {
    var path = __dirname + '/ooxx.download';

    oss.getObject({
      bucket: bucket,
      object: object,
      dest: path
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      fs.statSync(path).size.should.equal(fs.statSync(__filename).size);
      fs.readFileSync(path, 'utf8').should.equal(fs.readFileSync(__filename, 'utf8'));
      fs.unlinkSync(path);
      done();
    });
  });

  it('head object', function(done) {
    oss.headObject({
      bucket: bucket,
      object: object
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      res.headers['x-oss-meta-foo'].should.equal('bar');
      done();
    });
  });

  it('list object (get bucket)', function(done) {
    oss.listObject({
      bucket: bucket
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      res.body.ListBucketResult.Contents.length.should.above(0);
      done();
    });
  });

  // it('list object (get bucket) - with optional params', function(done) {
  //   oss.listObject({
  //     bucket: bucket,
  //     prefix: 'test',
  //     marker: object,
  //     delimiter: '/',
  //     maxKeys: 30
  //   }, function(error, res) {
  //     should.not.exist(error);
  //     res.status.should.equal(200);
  //     res.body.ListBucketResult.Contents.length.should.above(0);
  //     done();
  //   });
  // });

  it('delete object', function(done) {
    oss.deleteObject({
      bucket: bucket,
      object: object
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });

  it('delete bucket', function(done) {
    oss.deleteBucket({
      bucket: bucket
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });
});

describe('# put object by buffer', function() {
  var bucket = uuid.v4(),
    object = uuid.v4();

  it('create bucket', function(done) {
    oss.createBucket({
      bucket: bucket
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      done();
    });
  });

  it('put object', function(done) {
    oss.putObject({
      bucket: bucket,
      object: object,
      source: new Buffer('hello,wolrd', 'utf8')
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      res.objectUrl.should.equal('http://' + bucket + '.oss-cn-hangzhou.aliyuncs.com/' + object);
      done();
    });
  });

  it('copy object', function(done) {
    oss.copyObject({
      sourceBucket: bucket,
      sourceObject: object,
      bucket: bucket,
      object: object + 'copy'
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      done();
    });
  });

  it('delete object', function(done) {
    oss.deleteObject({
      bucket: bucket,
      object: object
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });

  it('delete copy object', function(done) {
    oss.deleteObject({
      bucket: bucket,
      object: object + 'copy'
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });

  it('delete bucket', function(done) {
    oss.deleteBucket({
      bucket: bucket
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });
});

describe('# put object by stream', function() {
  var bucket = uuid.v4(),
    object = uuid.v4();

  it('create bucket', function(done) {
    oss.createBucket({
      bucket: bucket
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      done();
    });
  });

  it('put object', function(done) {
    var input = fs.createReadStream(__filename);

    oss.putObject({
      bucket: bucket,
      object: object,
      source: input,
      headers: {
        'Content-Length': fs.statSync(__filename).size
      }
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(200);
      res.objectUrl.should.equal('http://' + bucket + '.oss-cn-hangzhou.aliyuncs.com/' + object);
      done();
    });
  });

  it('delete object', function(done) {
    oss.deleteObject({
      bucket: bucket,
      object: object
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });

  it('delete bucket', function(done) {
    oss.deleteBucket({
      bucket: bucket
    }, function(error, res) {
      should.not.exist(error);
      res.status.should.equal(204);
      done();
    });
  });
});
