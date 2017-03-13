var test = require('tap').test;
var RenderedTarget = require('../../src/sprites/rendered-target');
var Sprite = require('../../src/sprites/sprite');

test('clone effects', function (t) {
    // Create two clones and ensure they have different graphic effect objects.
    // Regression test for Github issue #224
    var spr = new Sprite();
    var a = new RenderedTarget(spr, null);
    var b = new RenderedTarget(spr, null);
    t.ok(a.effects !== b.effects);
    t.end();
});

test('#stopAll clears graphics effects', function (t) {
    var spr = new Sprite();
    var a = new RenderedTarget(spr, null);
    var effectName = 'brightness';
    a.setEffect(effectName, 100);
    a.onStopAll();
    t.equals(a.effects[effectName], 0);
    t.end();
});
