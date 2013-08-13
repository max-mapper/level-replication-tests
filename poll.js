module.exports = poll

function poll(check, cb, interval, startTime, timeOut) {
  if (!timeOut) timeOut = 3000
  if (startTime && (Date.now() - startTime > timeOut)) return cb('timeout')
  if (!startTime) startTime = Date.now()
  var result = check(function(err, result) {
    if (err || result) return cb(err, result)
    setTimeout(function() {
      poll(check, cb, interval, startTime, timeOut)
    }, interval || 100)
  })
}