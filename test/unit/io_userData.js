const test = require('tap').test;
const UserData = require('../../src/io/userData');

test('spec', t => {
    const userData = new UserData();

    t.type(userData, 'object');
    t.type(userData.postData, 'function');
    t.type(userData.getUsername, 'function');
    t.end();
});

test('getUsername returns empty string initially', t => {
    const userData = new UserData();

    t.strictEquals(userData.getUsername(), '');
    t.end();
});

test('postData sets the username', t => {
    const userData = new UserData();
    userData.postData({username: 'TEST'});
    t.strictEquals(userData.getUsername(), 'TEST');
    t.end();
});
