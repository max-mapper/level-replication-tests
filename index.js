var levelup = require('levelup')
var leveljs = require('level-js')
var sublevel = require('level-sublevel')
var multilevel = require('multilevel')
var replicate = require('level-replicate/msgpack')
var websocket = require('websocket-stream')
var deleteRange = require('level-delete-range')

module.exports = function(localDbName, backend, cb) {
  var db = sublevel(levelup(localDbName, {
    db: leveljs,
    valueEncoding: 'binary'
  }))

  // multilevel to server to verify assertions
  var validatorStream = websocket(backend + '/verify')
  var remote = multilevel.client()
  validatorStream.pipe(remote.createRpcStream()).pipe(validatorStream)
  // remote.on('data', function(e) { console.log(e) })
  // remote.on('error', function(e) { console.log('remote stream error', e) })

  destroy(db, function(err) {
    if (err) return cb(err)
    var replicator = replicate(db, 'master', "MASTER-2")
    var stream = websocket(backend, { type: Uint8Array })

    stream.pipe(replicator.createStream({tail: true})).pipe(stream)
    // stream.on('data', function(c) { console.log(c) })
    stream.on('open', function() {
      // why is this necessary? level-replicate misses the first db.put without it
      setTimeout(function() {
        cb(false, db, remote, done)
      }, 1000)
    })
    
    function done() {
      stream.destroy()
      validatorStream.destroy()
    }
  })
}


function destroy(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff\xff'}, cb)
}
