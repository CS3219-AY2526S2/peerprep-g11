const http = require('http')
const WebSocket = require('ws')
const WebSocketJSONStream = require('.')

const server = http.createServer()
const webSocketServer = new WebSocket.Server({ server })

server.listen(() => {
    const address = server.address()
    const url = `http://${address.address}:${address.port}`
    const clientWebSocket = new WebSocket(url)
    const clientStream = new WebSocketJSONStream(clientWebSocket)

    clientWebSocket.on('open', () => {
        clientStream.on('data', data => console.log('clientStream data', data))
        clientStream.on('finish', () => console.log('clientStream finish'))
        clientStream.on('close', () => console.log('clientStream close'))
        clientStream.write({ messageFrom: 'client' })
        clientStream.end()
        server.close()
    })
})
webSocketServer.on('connection', serverWebSocket => {
    const serverStream = new WebSocketJSONStream(serverWebSocket)

    serverStream.on('data', data => console.log('serverStream data', data))
    serverStream.on('end', () => console.log('serverStream end'))
    serverStream.on('close', () => console.log('serverStream close'))
    serverStream.write({ messageFrom: 'server' })
})
