var WebSocketServer = require('ws').Server
var http = require('http')
var ecstatic = require('ecstatic')
var websocket = require('websocket-stream')
var MemDOWN = require('memdown')
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var replicate = require('level-replicate')
var deleteRange = require('level-delete-range')
var multilevel = require('multilevel')

var factory = function (location) { return new MemDOWN(location) }
var db = levelup('test', { db: factory })
var server = http.createServer(ecstatic('./'))
var encoding = {valueEncoding: 'binary'}
var testDb = sublevel(db).sublevel('test', encoding)
var wss = new WebSocketServer({ server: server })

wss.on('connection', function(ws) {
  var path = ws.upgradeReq.url
  var stream = websocket(ws)
  if (path === '/verify') {
    var multilevelServer = multilevel.server(testDb)
    stream.on('end', function() {
      multilevelServer.destroy()
    })
    stream.pipe(multilevelServer).pipe(stream)
    return
  }
  var replicator = replicate(testDb, 'master', "MASTER-1")
  stream.pipe(replicator.createStream({tail: true})).pipe(stream)
  stream.pipe(process.stdout)
})

testDb.post(console.log)

function destroy(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff\xff'}, cb)
}

destroy(testDb, function(err) {
  if (err) console.log('destroy err', err)
  server.listen(12985)
  console.log('open :12985, view console')
})
