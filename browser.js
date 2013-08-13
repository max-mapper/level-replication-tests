var levelup = require('levelup')
var leveljs = require('level-js')
var sublevel = require('level-sublevel')
var multilevel = require('multilevel')
var replicate = require('level-replicate')
var websocket = require('websocket-stream')
var deleteRange = require('level-delete-range')
var tape = require('tape')

var backend = 'ws://localhost:12985'
var binary = {valueEncoding: 'binary'}

var db = sublevel(levelup('test', {
  db: leveljs,
  valueEncoding: 'json'
}))

// multilevel to server to verify assertions
var validatorStream = websocket(backend + '/verify')
var remote = multilevel.client()
validatorStream.pipe(remote.createRpcStream()).pipe(validatorStream)
remote.on('data', function(e) { console.log(e) })
remote.on('error', function(e) { console.log('remote stream error', e) })

destroy(db, function(err) {
  if (err) console.log('destroy err', err)
  var replicator = replicate(db, 'master', "MASTER-2")
  var stream = websocket(backend)

  stream.pipe(replicator.createStream({tail: true})).pipe(stream)
  stream.on('data', function(c) { console.log(c) })
  stream.on('open', function() {
    // why is this necessary? level-replicate misses the first db.put without it
    setTimeout(runTests, 1000)
  })
})

function runTests() {
  var binVal = new Uint8Array(5)
  
  tape.test('local to remote string value', function(t) {
    db.put('yes', 'thisisdog', function(err) {
      poll(function(next) {
        remote.get('yes', function(err, val) {
          if (err) return next(false, false)
          next(err, val)
        })
      }, function(err, result) {
        if (err) result = err
        t.equals(result, 'thisisdog')
        t.end()
      })
    })
  })
  
  tape.test('local to remote binary value', function(t) {
    db.put('hello', binVal, binary, function(err) {
      poll(function(next) {
        remote.get('hello', binary, function(err, val) {
          console.log('polling...', err, val)
          if (err) return next(false, false)
          next(err, val)
        })
      }, function(err, result) {
        if (err) result = err
        t.equals(JSON.stringify(result), JSON.stringify(binVal))
        t.end()
      })
    })
  })
}

function poll(check, cb, interval, startTime, timeOut) {
  if (!timeOut) timeOut = 2000
  if (startTime && (Date.now() - startTime > timeOut)) return cb('timeout')
  if (!startTime) startTime = Date.now()
  var result = check(function(err, result) {
    if (err || result) return cb(err, result)
    setTimeout(function() {
      poll(check, cb, interval, startTime, timeOut)
    }, interval || 100)
  })
}

function destroy(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff\xff'}, cb)
}
