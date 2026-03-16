# 2.0.0

- **BREAKING** Drop support for nodejs 6.
- **BREAKING** Socket error events are no longer re-emitted as stream error events.
- Browser WebSocket support.
- Support writing to the stream when the socket is still connecting.

# 1.1.1

- Updated dependencies.

# 1.1.0

- A correct WebSocket "close" reason is now reported based on how the stream is ended/destroyed.

# 1.0.0

Initial release.
