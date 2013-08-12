var sublevel = require('level-sublevel')
var replicate = require('level-replicate')
var levelup = require('levelup')
var leveljs = require('level-js')
var websocket = require('websocket-stream')

var backend = 'ws://localhost:8080'
var stream = websocket(backend)

var db = sublevel(levelup('test', { db: leveljs })).sublevel('foo')

var replicator = replicate(db, 'master', "MASTER-1")
stream.pipe(replicator.createStream({tail: true})).pipe(stream)
stream.on('data', function(c) { console.log(c) })

setTimeout(function() {
  db.put('hello', new Int8Array(5), { valueEncoding: 'binary' })
}, 2000)