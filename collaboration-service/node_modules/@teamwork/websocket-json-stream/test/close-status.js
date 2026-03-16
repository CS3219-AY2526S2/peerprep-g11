const assert = require('chai').assert

const NORMAL_CLOSURE_CODE = 1000
const NO_STATUS_CODE = 1005
const INTERNAL_ERROR_CODE = 1011
const CUSTOM_CODE = 4000

module.exports = function() {
    [ 'clientWebSocket', 'serverWebSocket' ].forEach(webSocketName => {
        /* eslint no-invalid-this: "off" */
        describe(`${webSocketName} CloseEvent`, function () {
            it('is emitted with code 1000 and reason "stream end" on clientStream.end()', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, NORMAL_CLOSURE_CODE)
                    assert.equal(event.reason, 'stream end')
                    done()
                })
                this.clientStream.end()
            })
            it('is emitted with code 1000 and reason "stream end" on serverStream.end()', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, NORMAL_CLOSURE_CODE)
                    assert.equal(event.reason, 'stream end')
                    done()
                })
                this.serverStream.end()
            })
            it('is emitted with code 1005 and reason "" on clientStream.destroy()', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, NO_STATUS_CODE)
                    assert.equal(event.reason, '')
                    done()
                })
                this.clientStream.destroy()
            })
            it('is emitted with code 1005 and reason "" on serverStream.destroy()', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, NO_STATUS_CODE)
                    assert.equal(event.reason, '')
                    done()
                })
                this.serverStream.destroy()
            })
            it('is emitted with code 1011 and reason "stream error" on clientStream.destroy(error)', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, INTERNAL_ERROR_CODE)
                    assert.equal(event.reason, 'stream error')
                    done()
                })
                const error = new Error('Test error')
                this.clientStream.on('error', () => {})
                this.clientStream.destroy(error)
            })
            it('is emitted with code 1011 and reason "stream error" on serverStream.destroy(error)', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, INTERNAL_ERROR_CODE)
                    assert.equal(event.reason, 'stream error')
                    done()
                })
                const error = new Error('Test error')
                this.serverStream.on('error', () => {})
                this.serverStream.destroy(error)
            })
            it('is emitted with code from error.closeCode on clientStream.destroy(error)', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, CUSTOM_CODE)
                    done()
                })
                const error = new Error('Test error')
                error.closeCode = CUSTOM_CODE
                this.clientStream.on('error', () => {})
                this.clientStream.destroy(error)
            })
            it('is emitted with code from error.closeCode on serverStream.destroy(error)', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.code, CUSTOM_CODE)
                    done()
                })
                const error = new Error('Test error')
                error.closeCode = CUSTOM_CODE
                this.serverStream.on('error', () => {})
                this.serverStream.destroy(error)
            })
            it('is emitted with reason from error.closeReason on clientStream.destroy(error)', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.reason, 'custom reason')
                    done()
                })
                const error = new Error('Test error')
                error.closeReason = 'custom reason'
                this.clientStream.on('error', () => {})
                this.clientStream.destroy(error)
            })
            it('is emitted with reason from error.closeReason on serverStream.destroy(error)', function (done) {
                this[webSocketName].addEventListener('close', event => {
                    assert.equal(event.reason, 'custom reason')
                    done()
                })
                const error = new Error('Test error')
                error.closeReason = 'custom reason'
                this.serverStream.on('error', () => {})
                this.serverStream.destroy(error)
            })
        })

        describe(`${webSocketName} "close" event`, function () {
            it('is emitted with code 1000 and reason "stream end" on clientStream.end()', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(code, NORMAL_CLOSURE_CODE)
                    assert.equal(reason, 'stream end')
                    done()
                })
                this.clientStream.end()
            })
            it('is emitted with code 1000 and reason "stream end" on serverStream.end()', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(code, NORMAL_CLOSURE_CODE)
                    assert.equal(reason, 'stream end')
                    done()
                })
                this.serverStream.end()
            })
            it('is emitted with code 1005 and reason "" on clientStream.destroy()', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(code, NO_STATUS_CODE)
                    assert.equal(reason, '')
                    done()
                })
                this.clientStream.destroy()
            })
            it('is emitted with code 1005 and reason "" on serverStream.destroy()', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(code, NO_STATUS_CODE)
                    assert.equal(reason, '')
                    done()
                })
                this.serverStream.destroy()
            })
            it('is emitted with code 1011 and reason "stream error" on clientStream.destroy(error)', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(code, INTERNAL_ERROR_CODE)
                    assert.equal(reason, 'stream error')
                    done()
                })
                const error = new Error('Test error')
                this.clientStream.on('error', () => {})
                this.clientStream.destroy(error)
            })
            it('is emitted with code 1011 and reason "stream error" on serverStream.destroy(error)', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(code, INTERNAL_ERROR_CODE)
                    assert.equal(reason, 'stream error')
                    done()
                })
                const error = new Error('Test error')
                this.serverStream.on('error', () => {})
                this.serverStream.destroy(error)
            })
            it('is emitted with code from error.closeCode on clientStream.destroy(error)', function (done) {
                this[webSocketName].on('close', code => {
                    assert.equal(code, CUSTOM_CODE)
                    done()
                })
                const error = new Error('Test error')
                error.closeCode = CUSTOM_CODE
                this.clientStream.on('error', () => {})
                this.clientStream.destroy(error)
            })
            it('is emitted with code from error.closeCode on serverStream.destroy(error)', function (done) {
                this[webSocketName].on('close', code => {
                    assert.equal(code, CUSTOM_CODE)
                    done()
                })
                const error = new Error('Test error')
                error.closeCode = CUSTOM_CODE
                this.serverStream.on('error', () => {})
                this.serverStream.destroy(error)
            })
            it('is emitted with reason from error.closeReason on clientStream.destroy(error)', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(reason, 'custom reason')
                    done()
                })
                const error = new Error('Test error')
                error.closeReason = 'custom reason'
                this.clientStream.on('error', () => {})
                this.clientStream.destroy(error)
            })
            it('is emitted with reason from error.closeReason on serverStream.destroy(error)', function (done) {
                this[webSocketName].on('close', (code, reason) => {
                    assert.equal(reason, 'custom reason')
                    done()
                })
                const error = new Error('Test error')
                error.closeReason = 'custom reason'
                this.serverStream.on('error', () => {})
                this.serverStream.destroy(error)
            })
        })
    })
}
