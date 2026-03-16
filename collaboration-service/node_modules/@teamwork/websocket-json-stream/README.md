# WebSocketJSONStream

[![npm version](https://badge.fury.io/js/%40teamwork%2Fwebsocket-json-stream.svg)](https://badge.fury.io/js/%40teamwork%2Fwebsocket-json-stream)
[![Build Status](https://travis-ci.org/Teamwork/websocket-json-stream.svg?branch=master)](https://travis-ci.org/Teamwork/websocket-json-stream)
[![Coverage Status](https://coveralls.io/repos/github/Teamwork/websocket-json-stream/badge.svg)](https://coveralls.io/github/Teamwork/websocket-json-stream)

A nodejs stream wrapper for WebSocket connections. It works with browser WebSockets too.

## Usage

```js
const WebSocket = require('ws')
const WebSocketJSONStream = require('@teamwork/websocket-json-stream')

const stream = new WebSocketJSONStream(new WebSocket(url))
// ...

new WebSocket.Server({ server }).on('connection', ws => {
    const stream = new WebSocketJSONStream(ws)
    // ...
})
```

See [example.js](./example.js) for a working usage example.

## Error Handling

WebSocket error events are not handled by this module, so you should handle them yourself to avoid crashing the process unnecessarily in nodejs.

When writing to a stream when its associated WebSocket is already CLOSING or CLOSED, the stream emits an error event with the `name` property value equal to `Error [ERR_CLOSED]`.

## Closing a WebSocket via its stream

Calling [`stream.end()`](https://nodejs.org/api/stream.html#stream_writable_end_chunk_encoding_callback) or [`stream.destroy()`](https://nodejs.org/api/stream.html#stream_writable_destroy_error) will close the WebSocket connection.

When a WebSocket is closed either by the server or the client, a [`CloseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) will be emitted. CloseEvents have both a numeric `code` and a string `reason` property that may be used to indicate the type of closure.

### `stream.end()`

Calling `stream.end()` will close the WebSocket with the code `1000` and reason `'stream end'`. `1000` indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled. (https://tools.ietf.org/html/rfc6455#section-7.4.1)

Clients may implement this to mean that the server is closing the stream intentionally, and the client should not automatically reconnect.

```javascript
const stream = new WebSocketJSONStream(ws)
// Closes WebSocket with the code 1000 and the reason 'stream end'
stream.end()
```

The code `1000` may also be used when calling the [`webSocket.close(code)`](https://html.spec.whatwg.org/multipage/web-sockets.html#dom-websocket-close) method of WebSockets in browsers.

### `stream.destroy()`

Calling `stream.destroy()` without an error object will close the stream without a code. This results in the client emitting a CloseEvent that has code `1005` and reason `''`. `1005` is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint. It is designated for use in applications expecting a status code to indicate that no status code was actually present. (https://tools.ietf.org/html/rfc6455#section-7.4.1)

```javascript
const stream = new WebSocketJSONStream(ws)
// Closes WebSocket with no status code (1005) and the reason ''
stream.destroy()
```

Calling `webSocket.close()` method of WebSockets in browsers without any arguments will produce a CloseEvent with the code `1005`. A reason string cannot be provided together with the code `1005`.

### `stream.destroy(error)`

Calling `stream.destroy(error)` with an error will emit an `'error'` event and close the stream with the code `1011` and reason `'stream error'` by default. `1011` indicates that a remote endpoint is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request. (http://www.rfc-editor.org/errata_search.php?eid=3227)

```javascript
const stream = new WebSocketJSONStream(ws)
stream.on('error', (error) => {
  // Error event must be handled, or it will be throw when calling
  // stream.destroy() with an error argument
})

// Closes WebSocket with the code 1011 and the reason 'stream error'
const error = new Error('Unexpected server error')
stream.destroy(error)
```

The code `1011` cannot be used when calling the `webSocket.close(code)` method of WebSockets in browsers.

### `error.closeCode` and `error.closeReason`

Custom close code and reason values may be sent by setting `error.closeCode` or `error.closeReason` properties on the error argument passed to `stream.destroy(error)`. For example:

```javascript
const stream = new WebSocketJSONStream(ws)
stream.on('error', (error) => {
  // Error event must be handled, or it will be throw when calling
  // stream.destroy() with an error argument
})

// Example of extending from Error and adding additional properties
class CustomStreamError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
        this.closeCode = null
        this.closeReason = null
    }
}

// Closes WebSocket with the code 4000 and the reason 'custom reason'.
// error.message is not sent to the client
const error = new CustomStreamError('Example error')
error.closeCode = 4000
error.closeReason = 'custom reason'
stream.destroy(error)
```

Browser WebSockets allow custom close codes between 3000 and 4999.
