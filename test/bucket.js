var should = require('should')
var uuid   = require('node-uuid')
var config = require('./config')
var OSS    = require('../index')
var oss    = OSS.createClient(config)

describe('bucket', function () {
  var bucketName01 = uuid.v4()
  var bucketName02 = uuid.v4()

  it('create bucket', function (done) {
    oss.createBucket({
      bucket: bucketName01
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(200)
      done()
    })
  })

  it('create bucket with acl', function (done) {
    oss.createBucket({
      bucket: bucketName02,
      acl: 'public-read'
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(200)
      done()
    })
  })

  it('get bucket (list object)', function (done) {
    oss.getBucket({
      bucket: bucketName01
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(200)
      done()
    })
  })

  it('get bucket acl', function (done) {
    oss.getBucketAcl({
      bucket: bucketName01
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(200)
      should.exist(res.body.AccessControlPolicy)
      done()
    })
  })

  it('set bucket acl', function (done) {
    oss.setBucketAcl({
      bucket: bucketName01,
      acl: 'private'
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(200)
      done()
    })
  })

  it('delete bucket', function (done) {
    oss.deleteBucket({
      bucket: bucketName01
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(204)
      done()
    })
  })

  it('delete bucket', function (done) {
    oss.deleteBucket({
      bucket: bucketName02
    }, function (error, res) {
      should.not.exist(error)
      res.status.should.equal(204)
      done()
    })
  })
})
