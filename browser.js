var levelup = require('levelup')
var leveljs = require('level-js')
var sublevel = require('level-sublevel')
var replicate = require('level-replicate')
var websocket = require('websocket-stream')
var deleteRange = require('level-delete-range')

var backend = 'ws://localhost:12985'

var db = sublevel(levelup('test', { db: leveljs })).sublevel('foo', {valueEncoding: 'binary'})

destroy(db, function() {
  var stream = websocket(backend)
  stream.on('data', function(c) { console.log(c) })

  var replicator = replicate(db, 'master', "MASTER-2")
  stream.pipe(replicator.createStream({tail: true})).pipe(stream)

  setTimeout(function() {
    db.put('hello', new Uint8Array(5), { valueEncoding: 'binary' })
  }, 2000)
})

function destroy(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff'}, cb)
}
