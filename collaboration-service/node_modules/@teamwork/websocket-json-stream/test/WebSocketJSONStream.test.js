const assert = require('chai').assert
const http = require('http')
const WebSocket = require('ws')
const WebSocketJSONStream = require('..')
const testCloseStatus = require('./close-status')

const handler = (done, code) => (...args) => {
    try {
        code(...args)
        done()
    } catch (e) {
        done(e)
    }
}

describe('WebSocketJSONStream', function () {
    beforeEach(function (done) {
        this.httpServer = http.createServer()
        this.wsServer = new WebSocket.Server({ server: this.httpServer })
        this.httpServer.listen(() => {
            const address = this.httpServer.address()

            this.url = `http://${address.address}:${address.port}`
            this.connect(({ clientWebSocket, serverWebSocket }) => {
                this.clientStream = new WebSocketJSONStream(this.clientWebSocket = clientWebSocket)
                this.serverStream = new WebSocketJSONStream(this.serverWebSocket = serverWebSocket)
                done()
            })
        })

        this.connect = function (callback) {
            const clientWebSocket = new WebSocket(this.url)

            this.wsServer.once('connection', serverWebSocket => {
                clientWebSocket.once('open', () =>
                    callback({ clientWebSocket, serverWebSocket }))
            })
        }
    })

    afterEach(function (done) {
        this.wsServer.close()
        this.httpServer.close(done)
    })

    it('should send and receive messages', function (done) {
        const serverSentData = [ { a: 1 }, { b: 2 } ]
        const clientSentData = [ { y: -1 }, { z: -2 } ]
        const serverReceivedData = []
        const clientReceivedData = []

        this.serverStream.on('data', data => serverReceivedData.push(data))
        this.clientStream.on('data', data => clientReceivedData.push(data))
        this.clientStream.on('close', handler(done, () => {
            assert.deepEqual(serverReceivedData, clientSentData)
            assert.deepEqual(clientReceivedData, serverSentData)
        }))

        serverSentData.forEach(data => this.serverStream.write(data))
        clientSentData.forEach(data => this.clientStream.write(data))
        this.clientStream.end()
    })

    it('should get clientStream close on clientStream.end()', function (done) {
        this.clientStream.on('close', () => done())
        this.clientStream.end()
    })
    it('should get clientStream close on serverStream.end()', function (done) {
        this.clientStream.on('close', () => done())
        this.serverStream.end()
    })
    it('should get serverStream close on clientStream.end()', function (done) {
        this.serverStream.on('close', () => done())
        this.clientStream.end()
    })
    it('should get serverStream close on serverStream.end()', function (done) {
        this.serverStream.on('close', () => done())
        this.serverStream.end()
    })

    it('should get clientStream close on clientStream.destroy()', function (done) {
        this.clientStream.on('close', () => done())
        this.clientStream.destroy()
    })
    it('should get clientStream close on serverStream.destroy()', function (done) {
        this.clientStream.on('close', () => done())
        this.serverStream.destroy()
    })
    it('should get serverStream close on clientStream.destroy()', function (done) {
        this.serverStream.on('close', () => done())
        this.clientStream.destroy()
    })
    it('should get serverStream close on serverStream.destroy()', function (done) {
        this.serverStream.on('close', () => done())
        this.serverStream.destroy()
    })

    it('should get clientStream finish on clientStream.end()', function (done) {
        this.clientStream.on('finish', () => done())
        this.clientStream.end()
    })
    it('should get serverStream finish on serverStream.end()', function (done) {
        this.serverStream.on('finish', () => done())
        this.serverStream.end()
    })

    it('should get clientStream error on clientStream.write invalid data (Symbol)', function (done) {
        this.clientStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.clientStream.write(Symbol('Test'))
    })
    it('should get serverStream error on serverStream.write invalid data (Symbol)', function (done) {
        this.serverStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.serverStream.write(Symbol('Test'))
    })
    it('should get clientStream error on clientStream.write invalid data (cyclic data)', function (done) {
        const data = {}
        data.a = data
        this.clientStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.clientStream.write(data)
    })
    it('should get serverStream error on serverStream.write invalid data (cyclic data)', function (done) {
        const data = {}
        data.a = data
        this.serverStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.serverStream.write(data)
    })
    it('should get clientStream error on serverWebSocket.send invalid data', function (done) {
        this.clientStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.serverWebSocket.send('qwerty')
    })
    it('should get serverStream error on clientWebSocket.send invalid data', function (done) {
        this.serverStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.clientWebSocket.send('qwerty')
    })
    it('should get clientStream error on clientStream.write after end', function (done) {
        this.clientStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.clientStream.end()
        this.clientStream.write({})
    })
    it('should get serverStream error on serverStream.write after end', function (done) {
        this.serverStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
        this.serverStream.end()
        this.serverStream.write({})
    })
    it('should get clientStream error on clientStream.write, if clientWebSocket is closed', function (done) {
        this.clientWebSocket.on('close', () => {
            this.clientStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
            this.clientStream.write({})
        })
        this.clientWebSocket.close()
    })
    it('should get serverStream error on serverStream.write, if serverWebSocket is closed', function (done) {
        this.serverWebSocket.on('close', () => {
            this.serverStream.once('error', handler(done, e => assert.instanceOf(e, Error)))
            this.serverStream.write({})
        })
        this.serverWebSocket.close()
    })
    it('should get clientStream error when clientWebSocket sends JSON-encoded null', function (done) {
        this.clientStream.on('error', handler(done, e => assert.instanceOf(e, Error)))
        this.serverWebSocket.send('null')
    })
    it('should get clientStream error when clientWebSocket sends JSON-encoded undefined', function (done) {
        this.clientStream.on('error', handler(done, e => assert.instanceOf(e, Error)))
        this.serverWebSocket.send('undefined')
    })

    it('clientStream.destroy when clientWebSocket.readyState === WebSocket.CONNECTING', function (done) {
        const clientWebSocket = new WebSocket(this.url)
        const clientStream = new WebSocketJSONStream(clientWebSocket)

        clientStream.once('close', () => done())
        clientStream.destroy()
    })
    it('clientStream.destroy when clientWebSocket.readyState === WebSocket.CONNECTING and gets error', function (done) {
        const clientWebSocket = new WebSocket('http://invalid-url:0')
        const clientStream = new WebSocketJSONStream(clientWebSocket)

        clientWebSocket.on('error', () => null) // ignore invalid-url error
        clientStream.on('close', () => done())
        clientStream.destroy()
    })
    it('clientStream.destroy when clientWebSocket.readyState === WebSocket.OPEN', function (done) {
        const clientWebSocket = new WebSocket(this.url)
        const clientStream = new WebSocketJSONStream(clientWebSocket)

        clientWebSocket.on('close', () => done())
        clientWebSocket.on('open', () => clientStream.destroy())
    })
    it('clientStream.destroy when clientWebSocket.readyState === WebSocket.CLOSING', function (done) {
        const clientWebSocket = new WebSocket(this.url)
        const clientStream = new WebSocketJSONStream(clientWebSocket)

        clientWebSocket.on('close', () => done())
        clientWebSocket.on('open', () => {
            clientWebSocket.close()
            clientStream.destroy()
        })
    })
    it('clientStream.destroy when clientWebSocket.readyState === WebSocket.CLOSED', function (done) {
        const clientWebSocket = new WebSocket(this.url)

        clientWebSocket.on('close', () => {
            new WebSocketJSONStream(clientWebSocket).destroy()
            done()
        })
        clientWebSocket.on('open', () => clientWebSocket.close())
    })
    it('write when clientWebSocket.readyState === WebSocket.CONNECTING', function (done) {
        const clientWebSocket = new WebSocket(this.url)
        const clientStream = new WebSocketJSONStream(clientWebSocket)
        let opened = false

        clientWebSocket.on('open', () => {
            opened = true
        })
        clientStream.write({}, handler(done, error => {
            assert.ok(error == null)
            assert.ok(opened)
        }))
    })
    it('write when clientWebSocket.readyState === WebSocket.CONNECTING and gets error', function (done) {
        const clientWebSocket = new WebSocket('http://invalid-url:0')
        const clientStream = new WebSocketJSONStream(clientWebSocket)
        let closed = false

        clientStream.on('error', error => {
            assert.ok(error instanceof Error)
            assert.equal(error.name, 'Error [ERR_CLOSED]')
            assert.equal(error.message, 'WebSocket CLOSING or CLOSED.')
        })
        clientWebSocket.on('error', () => null) // ignore invalid-url error
        clientWebSocket.on('close', () => {
            closed = true
        })
        clientStream.write({}, handler(done, error => {
            assert.ok(error instanceof Error)
            assert.equal(error.name, 'Error [ERR_CLOSED]')
            assert.equal(error.message, 'WebSocket CLOSING or CLOSED.')
            assert.ok(closed)
        }))
    })
    it('write when clientWebSocket.readyState === WebSocket.CLOSING', function (done) {
        this.clientWebSocket.close()
        this.clientStream.on('error', error => {
            assert.ok(error instanceof Error)
            assert.equal(error.name, 'Error [ERR_CLOSED]')
            assert.equal(error.message, 'WebSocket CLOSING or CLOSED.')
        })
        this.clientStream.write({}, handler(done, error => {
            assert.ok(error instanceof Error)
            assert.equal(error.name, 'Error [ERR_CLOSED]')
            assert.equal(error.message, 'WebSocket CLOSING or CLOSED.')
        }))
    })

    testCloseStatus()
})
