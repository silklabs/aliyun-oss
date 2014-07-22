[![NPM](https://nodei.co/npm/aliyun-oss.png?downloads=true)](https://nodei.co/npm/aliyun-oss/)

### node.js sdk for aliyun oss, a new version of [oss-client](https://github.com/coderhaoxin/oss-client)
```bash
npm install aliyun-oss
```

### aliyun oss
[aliyun oss document](http://imgs-storage.cdn.aliyuncs.com/help/oss/OSS_API_20131015.pdf?spm=5176.383663.5.23.OEtIjV&file=OSS_API_20131015.pdf)

### how to use
```js
var OSS = require('aliyun-oss');
var option = {
  accessKeyId: 'your access key id',
  accessKeySecret: 'your access key secret'
};

/*
 * 可选 option
 *
 * host:    default is: oss-cn-hangzhou.aliyuncs.com,
 * timeout: default is: 300000,
 * agent:   default is: agent.maxSockets = 20
 */

var oss = OSS.createClient(option);
```

### summary

params

* bucket  - bucket name
* object  - object name
* acl     - bucket 访问规则, 可选值: 'private', 'public-read', 'public-read-write'
* headers - header

callback params

* error - error
* res   - a wrapper of http response, contain `status`, `headers`, `body`


### object

创建object
```js
/*
 * source:  上传的文件, 可以是文件路径、 buffer、 stream
 * headers: 可选，用户自定义 header，如: x-oss-meta-location
 *          当上传方式为: buffer 或者 stream, 建议添加 'Content-Type'(此时无法根据扩展名判断)
 */

oss.putObject({
  bucket: '',
  object: '',
  source: '',
  headers: {
    // optional
    'Content-Length': 1024
  }
}, function (err, res) {});
```

复制object
```js
oss.copyObject({
  bucket: '',
  object: '',
  sourceBucket: '',
  sourceObject: ''
}, function (err, res) {});
```

删除object
```js
oss.deleteObject({
  bucket: '',
  object: ''
}, function (err, res) {});
```

获取object
```js
/*
 * dest: 保存object的文件路径 或者 writeStream
 * headers: 可选，object类型，用户自定义header，如: If-Unmodified-Since
 */

oss.getObject({
  bucket: '',
  object: '',
  dest: '',
  headers: {}
}, function (err, res) {});
```

获取object头信息
```js
oss.headObject({
  bucket: '',
  object: ''
}, function (err, res) {});
```

获取object列表
```js
/*
 * prefix:    可选，object 前缀
 * marker:    可选，列表起始object
 * delimiter: 可选，object分组字符，若'/'为则不列出路径深度大于等于二层的object。
 * maxKeys:   可选，列出的object最大个数
 */

oss.listObject({
  bucket: '',
  prefix: '',
  marker: '',
  delimiter: '',
  maxKeys: ''
}, function (err, res) {});
```


### bucket

列举bucket
```js
oss.listBucket(function (err, res) {});
```

创建bucket
```js
oss.createBucket({
  bucket: '',
  acl: ''
}, function (err, res) {});
```

删除bucket
```js
oss.deleteBucket({
  bucket: ''
}, function (err, res) {});
```

获取bucket访问规则
```js
oss.getBucketAcl({
  bucket: ''
}, function (err, res) {});
```

设置bucket访问规则
```js
oss.setBucketAcl({
  bucket: '',
  acl: ''
}, function (err, res) {});
```

### test
Coverage: 93%

### License
MIT
