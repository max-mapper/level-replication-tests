var WebSocketServer = require('ws').Server
var http = require('http')
var ecstatic = require('ecstatic')
var sublevel = require('level-sublevel')
var replicate = require('level-replicate')
var levelup = require('levelup')
var websocket = require('websocket-stream')

var server = http.createServer(ecstatic('./'))
var db = sublevel(levelup('test.db')).sublevel('foo')
var wss = new WebSocketServer({ server: server })

wss.on('connection', function(ws) {
  var replicator = replicate(db, 'master', "MASTER-1")
  var stream = websocket(ws)
  stream.pipe(replicator.createStream({tail: true})).pipe(stream)
  stream.pipe(process.stdout)
})

server.listen(8080)
