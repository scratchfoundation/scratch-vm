const test = require('tap').test;
const RenderedTarget = require('../../src/sprites/rendered-target');
const Sprite = require('../../src/sprites/sprite');
const Runtime = require('../../src/engine/runtime');
const FakeRenderer = require('../fixtures/fake-renderer');

test('clone effects', t => {
    // Create two clones and ensure they have different graphic effect objects.
    // Regression test for Github issue #224
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    const b = new RenderedTarget(spr, null);
    t.ok(a.effects !== b.effects);
    t.end();
});

test('setxy', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setXY(123, 321, true);
    t.equals(a.x, 123);
    t.equals(a.y, 321);
    t.end();
});

test('direction', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setDirection(123);
    t.equals(a._getRenderedDirectionAndScale().direction, 123);
    t.end();
});

test('setSay', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setSay();
    a.setSay('types not specified', 'message');
    t.end();
});

test('setVisible', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setVisible(true);
    t.end();
});

test('setSize', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setSize(123);
    t.equals(a._getRenderedDirectionAndScale().scale[0], 123);
    t.end();
});

test('set and clear effects', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
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

test('setCostume', t => {
    const o = new Object();
    const s = new Sprite();
    const r = new Runtime();
    s.costumes = [o];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setCostume(0);
    t.end();
});

test('setRotationStyle', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;
    a.setRotationStyle(RenderedTarget.ROTATION_STYLE_NONE);
    t.end();
});

test('getBounds', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.getBounds().top, 0);
    a.setXY(241, 241);
    t.equals(a.getBounds().top, 241);
    t.end();
});

test('isTouchingPoint', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingPoint(), true);
    t.end();
});

test('isTouchingEdge', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingEdge(), false);
    a.setXY(1000, 1000);
    t.equals(a.isTouchingEdge(), true);
    t.end();
});

test('isTouchingSprite', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingSprite('fake'), false);
    t.end();
});

test('isTouchingColor', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.isTouchingColor(), false);
    t.end();
});

test('colorIsTouchingColor', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.colorIsTouchingColor(), false);
    t.end();
});

test('layers', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    const o = new Object();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
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

test('keepInFence', t => {
    const s = new Sprite();
    const r = new Runtime();
    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const a = new RenderedTarget(s, r);
    a.renderer = renderer;
    t.equals(a.keepInFence(1000, 1000)[0], 240);
    t.equals(a.keepInFence(-1000, 1000)[0], -240);
    t.equals(a.keepInFence(1000, 1000)[1], 180);
    t.equals(a.keepInFence(1000, -1000)[1], -180);
    t.end();
});

test('#stopAll clears graphics effects', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);
    const effectName = 'brightness';
    a.setEffect(effectName, 100);
    a.onStopAll();
    t.equals(a.effects[effectName], 0);
    t.end();
});

test('#getCostumes returns the costumes', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    const costumes = [1, 2, 3];
    a.sprite.costumes = costumes;
    t.equals(a.getCostumes(), costumes);
    t.end();
});

test('#getSounds returns the sounds', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    const sounds = [1, 2, 3];
    a.sprite.sounds = sounds;
    t.equals(a.getSounds(), sounds);
    t.end();
});

test('#toJSON returns the sounds and costumes', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    const sounds = [1, 2, 3];
    const costumes = ['a', 'b', 'c'];
    a.sprite.sounds = sounds;
    a.sprite.costumes = costumes;
    t.same(a.toJSON().sounds, sounds);
    t.same(a.toJSON().costumes, costumes);
    t.end();
});
