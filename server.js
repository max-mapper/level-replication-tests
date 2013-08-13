var WebSocketServer = require('ws').Server
var http = require('http')
var ecstatic = require('ecstatic')
var websocket = require('websocket-stream')
var MemDOWN = require('memdown')
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var replicate = require('level-replicate')

var factory = function (location) { return new MemDOWN(location) }
var db = levelup('test', { db: factory })
var server = http.createServer(ecstatic('./'))
var db = sublevel(db).sublevel('test', {valueEncoding: 'binary'})
var wss = new WebSocketServer({ server: server })

wss.on('connection', function(ws) {
  var replicator = replicate(db, 'master', "MASTER-1")
  var stream = websocket(ws)
  stream.pipe(replicator.createStream({tail: true})).pipe(stream)
  stream.pipe(process.stdout)
})

db.post(console.log)

server.listen(12985)
console.log('open :12985')
