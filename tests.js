var tape = require('tape')
var poll = require('./poll')
var getTestDbs = require('./')

var backend = 'ws://localhost:12985'
var binary = {valueEncoding: 'binary'}

console.log('cleaning and acquiring test databases...')
getTestDbs('test', backend, function(err, db, remote, done) {
  if (err) return console.error('test db err', err)
  runTests(db, remote, done)
})

function runTests(db, remote, done) {
  var binVal = new Uint8Array(5)
  
  tape.test('local to remote binary value', function(t) {
    db.put('hello', binVal, binary, function(err) {
      t.equals(!!err, false)
      poll(function(next) {
        remote.get('hello', binary, function(err, val) {
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
  
  tape.test('local delete triggers remote delete', function(t) {
    db.del('hello', function(err) {
      t.equals(!!err, false)
      poll(function(next) {
        remote.get('hello', function(err, val) {
          if (!err || val) return next(false, false)
          next(err, val)
        })
      }, function(err, result) {
        t.equals(err.name, 'NotFoundError')
        t.end()
        done()
      })
    })
  })
}

