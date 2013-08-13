var levelup = require('levelup')
var leveljs = require('level-js')
var sublevel = require('level-sublevel')
var replicate = require('level-replicate')
var websocket = require('websocket-stream')
var deleteRange = require('level-delete-range')

var backend = 'ws://localhost:12985'

var db = sublevel(levelup('test', {
  db: leveljs,
  valueEncoding: 'json'
}))

destroy(db, function(err) {
  if (err) console.log('destroy err', err)
  var replicator = replicate(db, 'master', "MASTER-2")
  var stream = websocket(backend)

  stream.pipe(replicator.createStream({tail: true})).pipe(stream)
  stream.on('data', function(c) { console.log(c) })
  setTimeout(function() {
    db.put('hello', new Uint8Array(5), {valueEncoding: 'binary'}, function(err) {
      console.log('put done, err:', err)
    })
  }, 3000)
})

function destroy(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff\xff'}, cb)
}
