var should = require('should')
var uuid   = require('node-uuid')
var config = require('./config')
var OSS    = require('../index')
var oss    = new OSS.createClient(config)

describe('object', function () {
	var object = uuid.v4()

	it('put object', function (done) {
		oss.putObject({
			bucket: bucket,
			object: object,
			source: __filename,
			userMetas: { 'x-oss-meta-foo': 'bar' }
		}, function (error, result) {
			result.statusCode.should.equal(200)
			done()
		})
	})
	it('download object to write stream', function (done) {
		var ws = fs.createWriteStream('/tmp/oss-test-download-file')
		oss.getObject({
			bucket: bucket,
			object: object,
			dest: ws
		}, function (error, result) {
			should.not.exist(error)
			result.should.equal({statusCode: 200})
			fs.statSync('/tmp/oss-test-download-file').size.should.equal(fs.statSync(__filename).size)
			fs.readFileSync('/tmp/oss-test-download-file', 'utf8').should.equal(fs.readFileSync(__filename, 'utf8'))
			done()
		})
	})
	it('head object', function (done) {
		oss.headObject({
			bucket: bucket,
			object: object
		}, function (error, headers) {
			headers['x-oss-meta-foo'].should.equal('bar')
			done()
		})
	})
	it('list object', function (done) {
		oss.listObject({
			bucket: bucket
		}, function (error, result) {
			result.ListBucketResult.Contents.length.should.above(0)
			done()
		})
	})
	it('delete object', function (done) {
		oss.deleteObject({
			bucket: bucket,
			object: object
		}, function (error, result) {
			result.statusCode.should.equal(204)
			done()
		})
	})
})

var Buffer = require('buffer').Buffer

describe('put object by buffer', function () {
	var object = uuid.v4()

	it('put object', function (done) {
		oss.putObject({
			bucket: bucket,
			object: object,
			source: new Buffer('hello,wolrd', 'utf8')
		}, function (error, result) {
			result.statusCode.should.equal(200)
			done()
		})
	})
	it('delete object', function (done) {
		oss.deleteObject({
			bucket: bucket,
			object: object
		}, function (error, result) {
			result.statusCode.should.equal(204)
			done()
		})
	})
})

describe('put null buffer', function () {
	var object = uuid.v4()

	it('should get error', function (done) {
		oss.putObject({
			bucket: bucket,
			object: object,
			source: new Buffer('', 'utf8')
		}, function (error, result) {
			should.exist(error)
			error.message.should.equal('null buffer')
			done()
		})
	})
})

var fs = require('fs')

describe('put object by stream', function () {
	var object = uuid.v4()

	it('put object', function (done) {
		var input = fs.createReadStream(__filename)
		oss.putObject({
			bucket: bucket,
			object: object,
			source: input,
			contentLength: fs.statSync(__filename).size
		}, function (error, result) {
			result.statusCode.should.equal(200)
			done()
		})
	})
	it('delete object', function (done) {
		oss.deleteObject({
			bucket: bucket,
			object: object
		}, function (error, result) {
			result.statusCode.should.equal(204)
			done()
		})
	})
})
