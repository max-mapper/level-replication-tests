var getTestDbs = require('./')
var uuid = require('hat')
var poll = require('./poll')

var backend = 'ws://localhost:12985'
var binary = {valueEncoding: 'binary'}

var num = 2000
var timeOut = 60000

console.log('cleaning and acquiring test databases...')

getTestDbs('test', backend, function(err, db, remote, done) {
  if (err) return console.error('test db err', err)

  console.log('starting bench of ' + num)
  
  bench(db, remote, num, function(start) {
    console.log(num + ' local puts took ' + (new Date() - start) + "ms")
    console.log('waiting for remote sync to finish...')
    poll(function(next) {
      remote.get('last', binary, function(err, val) {
        if (err) return next(false, false)
        next(err, val)
      })
    }, function(err, result) {
      if (err) return console.error(err)
      console.log(num + ' remote puts done ' + (new Date() - start) + "ms with margin of error 100ms (due to polling)")
      console.log('all done')
      done()
    }, 100, Date.now(), timeOut)
    
  })
})

function bench(db, remote, num, cb) {
  var start = new Date()
  var done = 0
  var ui8 = new Uint8Array( num )
  for (var idx = 0; idx < num; idx++) ui8[idx] = Math.floor( Math.random() * 256 )
  
  for (var i = num; i > 1; --i) {
    db.put(uuid(), ui8, binary, function(err) {
      done++
      if (done + 1 === num) putLast()
    })
  }
  
  function putLast() {
    db.put('last', ui8, binary, function(err) {
      cb(start)
    })
  }
}


// compare clocks... doesnt work though
// var clockKey = 'ÿmasterÿÿclockÿMASTER-2'
// setInterval(function() {
//   db.get(clockKey, function(err, localClock) {
//     remote.get(clockKey, {valueEncoding: 'utf8'}, function(err, remoteClock) {
//       console.log(new Uint8Array(localClock).toString() === remoteClock.toString())
//     })
//   })
// }, 250)