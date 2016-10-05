var test = require('tap').test;
var Clone = require('../../src/sprites/clone');
var Sprite = require('../../src/sprites/sprite');

test('clone effects', function (t) {
    // Create two clones and ensure they have different graphic effect objects.
    // Regression test for Github issue #224
    var spr = new Sprite();
    var a = new Clone(spr, null);
    var b = new Clone(spr, null);
    t.ok(a.effects !== b.effects);
    t.end();
});
