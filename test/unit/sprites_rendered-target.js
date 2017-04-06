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

test('#getCostumes returns the costumes', function (t) {
    var spr = new Sprite();
    var a = new RenderedTarget(spr, null);
    var costumes = [1, 2, 3];
    a.sprite.costumes = costumes;
    t.equals(a.getCostumes(), costumes);
    t.end();
});

test('#getSounds returns the sounds', function (t) {
    var spr = new Sprite();
    var a = new RenderedTarget(spr, null);
    var sounds = [1, 2, 3];
    a.sprite.sounds = sounds;
    t.equals(a.getSounds(), sounds);
    t.end();
});

test('#toJSON returns the sounds and costumes', function (t) {
    var spr = new Sprite();
    var a = new RenderedTarget(spr, null);
    var sounds = [1, 2, 3];
    var costumes = ['a', 'b', 'c'];
    a.sprite.sounds = sounds;
    a.sprite.costumes = costumes;
    t.same(a.toJSON().sounds, sounds);
    t.same(a.toJSON().costumes, costumes);
    t.end();
});
