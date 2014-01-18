[![NPM](https://nodei.co/npm/aliyun-oss.png?downloads=true)](https://nodei.co/npm/aliyun-oss/)

## developing

### a node.js module to connect aliyun oss
```bash
npm install aliyun-oss
```

### how to use
```js
var OSS = require('aliyun-oss')
var option = {
  accessKeyId: 'your access key id',
  accessKeySecret: 'your access key secret'
}

var oss = OSS.createClient(option)
```

参数说明：
```js
options = {
  bucket: 'bucket name',
  object: 'object name',
  acl: 'bucket 访问规则'
  headers: {
    // 可选，用户自定义 header，如: x-oss-meta-location
  }
}
```

### object

创建object
```js
/*
* source:  上传的文件路径 或者 buffer 或者 stream
* headers: 可选，object类型，用户自定义header，如: x-oss-meta-location
*          当上传方式为: buffer 或者 stream, 建议添加 'Content-Type'(此时无法根据扩展名判断)
*/

putObject({
  bucket: '',
  object: '',
  source: '',
  headers: {
    // optional
    'Content-Length': 1024
  }
}, function (err, res) {})
```

复制object
```js
copyObject({
  bucket: '',
  object: '',
  sourceBucket: '',
  sourceObject: ''
}, function (err, res) {})
```

删除object
```js
deleteObject({
  bucket: '',
  object: ''
}, function (err, res) {})
```

获取object
```js
/*
* dest: 保存object的文件路径 或者 writeStream
* headers: 可选，object类型，用户自定义header，如: If-Unmodified-Since
*/

getObject({
  bucket: '',
  object: '',
  dest: '',
  headers: {}
}, function (err, res) {})
```

获取object头信息
```js
headObject({
  bucket: '',
  object: ''
}, function (err, res) {})
```

获取object列表
```js
/*
* prefix:    可选，object 前缀
* marker:    可选，列表起始object
* delimiter: 可选，object分组字符，若'/'为则不列出路径深度大于等于二层的object。
* maxKeys:   可选，列出的object最大个数
*/

listObject({
  bucket: '',
  prefix: '',
  marker: '',
  delimiter: '',
  maxKeys: ''
}, function (err, res) {})
```

### bucket

列出所有bucket
```js
listBucket(function (err, res) {})
```

创建bucket
```js
createBucket({
  bucket: '',
  acl: ''
}, function (err, res) {})
```

删除bucket
```js
deleteBucket({
  bucket: ''
}, function (err, res) {})
```

获取bucket访问规则
```js
getBucketAcl({
  bucket: ''
}, function (err, res) {})
```

设置bucket访问规则
```js
setBucketAcl({
  bucket: '',
  acl: ''
}, function (err, res) {})
```

### License
The MIT License (MIT)
