var test = require('tap').test;
var RenderedTarget = require('../../src/sprites/rendered-target');
var Sprite = require('../../src/sprites/sprite');
var Runtime = require('../../src/engine/runtime');


var fakeRenderer = function (){
    var renderer = new Object();
    renderer.unused = '';
    renderer.x = 0;
    renderer.y = 0;
    renderer.order = 0;
    renderer.spriteCount = 5;
    renderer.createDrawable = function () {
        return true;
    };
    renderer.getFencedPositionOfDrawable = function (d, p) { // eslint-disable-line no-unused-vars
        return [p[0], p[1]];
    };
    renderer.updateDrawableProperties = function (d, p) { // eslint-disable-line no-unused-vars
        if (p.position) {
            renderer.x = p.position[0];
            renderer.y = p.position[1];
        }
        return true;
    };
    renderer.getSkinSize = function (d) { // eslint-disable-line no-unused-vars
        return [0, 0];
    };
    renderer.pick = function (x, y, a, b, d) { // eslint-disable-line no-unused-vars
        return true;
    };
    renderer.isTouchingColor = function (d, c) { // eslint-disable-line no-unused-vars
        return true;
    };
    renderer.setDrawableOrder = function (d, l, optA, optB) { // eslint-disable-line no-unused-vars
        return true;
    };
    renderer.getBounds = function (d) { // eslint-disable-line no-unused-vars
        return {left: renderer.x, right: renderer.x, top: renderer.y, bottom: renderer.y};
    };
    renderer.setDrawableOrder = function (d, a, optA, optB){ // eslint-disable-line no-unused-vars
        if (d === 999) return 1; // fake for test case
        if (optA) {
            a += renderer.order;
        }
        if (optB) {
            a = Math.max(a, optB);
        }
        a = Math.max(a, 0);
        renderer.order = Math.min(a, renderer.spriteCount);
        return renderer.order;
    };
    renderer.pick = function (x, y, a, b, c){ // eslint-disable-line no-unused-vars
        return c[0];
    };
    renderer.isTouchingColor = function (a, b){ // eslint-disable-line no-unused-vars
        return false;
    };
        
    return renderer;
};


test('clone effects', function (t) {
    // Create two clones and ensure they have different graphic effect objects.
    // Regression test for Github issue #224
    var spr = new Sprite();
    var a = new RenderedTarget(spr, null);
    var b = new RenderedTarget(spr, null);
    t.ok(a.effects !== b.effects);
    t.end();
});

test('setxy', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setXY(123, 321, true);
    t.equals(a.x, 123);
    t.equals(a.y, 321);
    t.end();
});

test('direction', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setDirection(123);
    t.equals(a._getRenderedDirectionAndScale().direction, 123);
    t.end();
});

test('setSay', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setSay();
    a.setSay('types not specified', 'message');
    t.end();
});

test('setVisible', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setVisible(true);
    t.end();
});

test('setSize', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setSize(123);
    t.equals(a._getRenderedDirectionAndScale().scale[0], 123);
    t.end();
});

test('set and clear effects', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    for (var effect in a.effects) {
        a.setEffect(effect, 1);
        t.equals(a.effects[effect], 1);
    }
    a.clearEffects();
    for (effect in a.effects) {
        t.equals(a.effects[effect], 0);
    }
    t.end();
});

test('setCostume', function (t) {
    var o = new Object();
    var s = new Sprite();
    var r = new Runtime();
    s.costumes = [o];
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setCostume(0);
    t.end();
});

test('setRotationStyle', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var renderer = fakeRenderer();
    a.renderer = renderer;
    a.setRotationStyle(RenderedTarget.ROTATION_STYLE_NONE);
    t.end();
});

test('getBounds', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.getBounds().top, 0);
    a.setXY(241, 241);
    t.equals(a.getBounds().top, 241);
    t.end();
});

test('isTouchingPoint', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingPoint(), true);
    t.end();
});

test('isTouchingEdge', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingEdge(), false);
    a.setXY(1000, 1000);
    t.equals(a.isTouchingEdge(), true);
    t.end();
});

test('isTouchingSprite', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingSprite('fake'), false);
    t.end();
});

test('isTouchingColor', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingColor(), false);
    t.end();
});

test('colorIsTouchingColor', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.colorIsTouchingColor(), false);
    t.end();
});

test('layers', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    var o = new Object();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    a.goToFront();
    t.equals(a.renderer.order, 5);
    a.goBackLayers(2);
    t.equals(a.renderer.order, 3);
    o.drawableID = 999;
    a.goBehindOther(o);
    t.equals(a.renderer.order, 1);
    t.end();
});

test('keepInFence', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var renderer = fakeRenderer();
    r.attachRenderer(renderer);
    var a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.keepInFence(1000, 1000)[0], 240);
    t.equals(a.keepInFence(-1000, 1000)[0], -240);
    t.equals(a.keepInFence(1000, 1000)[1], 180);
    t.equals(a.keepInFence(1000, -1000)[1], -180);
    t.end();
});

test('#stopAll clears graphics effects', function (t) {
    var s = new Sprite();
    var r = new Runtime();
    var a = new RenderedTarget(s, r);
    var effectName = 'brightness';
    a.setEffect(effectName, 100);
    a.onStopAll();
    t.equals(a.effects[effectName], 0);
    t.end();
});
