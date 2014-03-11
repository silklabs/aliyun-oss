'use strict';

var should = require('should'),
  OSS = require('../index'),
  oss = OSS.createClient({
    accessKeyId: 'testAccessKeyId',
    accessKeySecret: 'testAccessKeySecret'
  });

describe('util functions', function() {
  it('generateSign', function() {
    var sign = oss.generateSign('POST', {
      'Date': 'Mon, 20 Jan 2014 06:38:31 GMT',
      'Content-Length': 0
    }, '/8e3c880e-1962-4792-925f-57c05efc0b0b/?acl');

    sign.should.equal('OSS testAccessKeyId:cCmKr/ItKHaVeZErJTMAW9DlGc0=');
  });
});