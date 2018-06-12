const test = require('tap').test;
const JSONRPCWebSocket = require('../../src/util/jsonrpc-web-socket');

test('constructor', t => {
    JSONRPCWebSocket();
    t.end();
});

test('dispose', t => {
    t.end();
});
