var levelup = require('levelup')
var leveljs = require('level-js')
var sublevel = require('level-sublevel')
var replicate = require('level-replicate')
var websocket = require('websocket-stream')
var deleteRange = require('level-delete-range')

var backend = 'ws://localhost:12985'
var stream = websocket(backend)

var db = sublevel(levelup('test', { db: leveljs })).sublevel('foo')

destroy(db, function() {
  var replicator = replicate(db, 'master', "MASTER-2")
  stream.pipe(replicator.createStream({tail: true})).pipe(stream)
  stream.on('data', function(c) { console.log(c) })

  setTimeout(function() {
    db.put('hello', new Int8Array(5), { valueEncoding: 'binary' })
  }, 2000)
})

function destroy(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff'}, cb)
}
