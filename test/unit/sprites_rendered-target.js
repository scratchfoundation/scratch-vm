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
    for (const effect in a.effects) {
        a.setEffect(effect, 1);
        t.equals(a.effects[effect], 1);
    }
    a.clearEffects();
    for (const effect in a.effects) {
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

test('deleteCostume', t => {
    const o1 = {id: 1};
    const o2 = {id: 2};
    const o3 = {id: 3};
    const o4 = {id: 4};
    const o5 = {id: 5};

    const s = new Sprite();
    const r = new Runtime();
    s.costumes = [o1, o2, o3];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    // x* Costume 1        * Costume 2
    //    Costume 2   =>     Costume 3
    //    Costume 3
    a.setCostume(0);
    a.deleteCostume(0);
    t.equals(a.sprite.costumes.length, 2);
    t.equals(a.sprite.costumes[0].id, 2);
    t.equals(a.sprite.costumes[1].id, 3);
    t.equals(a.currentCostume, 0);

    //    Costume 1          Costume 1
    // x* Costume 2   =>   * Costume 3
    //    Costume 3
    a.sprite.costumes = [o1, o2, o3];
    a.setCostume(1);
    a.deleteCostume(1);
    t.equals(a.sprite.costumes.length, 2);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 3);
    t.equals(a.currentCostume, 1);

    //    Costume 1          Costume 1
    //    Costume 2   =>   * Costume 2
    // x* Costume 3
    a.sprite.costumes = [o1, o2, o3];
    a.setCostume(2);
    a.deleteCostume(2);
    t.equals(a.sprite.costumes.length, 2);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 2);
    t.equals(a.currentCostume, 1);

    // Refuses to delete only costume
    a.sprite.costumes = [o1];
    a.setCostume(0);
    a.deleteCostume(0);
    t.equals(a.sprite.costumes.length, 1);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.currentCostume, 0);

    //   Costume 1          Costume 1
    // x Costume 2          Costume 3
    //   Costume 3   =>   * Costume 4
    // * Costume 4          Costume 5
    //   Costume 5
    a.sprite.costumes = [o1, o2, o3, o4, o5];
    a.setCostume(3);
    a.deleteCostume(1);
    t.equals(a.sprite.costumes.length, 4);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 3);
    t.equals(a.sprite.costumes[2].id, 4);
    t.equals(a.sprite.costumes[3].id, 5);
    t.equals(a.currentCostume, 2);

    //   Costume 1          Costume 1
    // * Costume 2        * Costume 2
    //   Costume 3   =>     Costume 3
    // x Costume 4          Costume 5
    //   Costume 5
    a.sprite.costumes = [o1, o2, o3, o4, o5];
    a.setCostume(1);
    a.deleteCostume(3);
    t.equals(a.sprite.costumes.length, 4);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 2);
    t.equals(a.sprite.costumes[2].id, 3);
    t.equals(a.sprite.costumes[3].id, 5);
    t.equals(a.currentCostume, 1);

    //   Costume 1          Costume 1
    // * Costume 2        * Costume 2
    //   Costume 3   =>     Costume 3
    //   Costume 4          Costume 4
    // x Costume 5
    a.sprite.costumes = [o1, o2, o3, o4, o5];
    a.setCostume(1);
    a.deleteCostume(4);
    t.equals(a.sprite.costumes.length, 4);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 2);
    t.equals(a.sprite.costumes[2].id, 3);
    t.equals(a.sprite.costumes[3].id, 4);
    t.equals(a.currentCostume, 1);
    t.end();
});

test('deleteSound', t => {
    const o1 = {id: 1};
    const o2 = {id: 2};
    const o3 = {id: 3};

    const s = new Sprite();
    const r = new Runtime();
    s.sounds = [o1, o2, o3];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    a.deleteSound(0);
    t.deepEqual(a.sprite.sounds, [o2, o3]);

    // Allows deleting the only sound
    a.sprite.sounds = [o1];
    a.deleteSound(0);
    t.deepEqual(a.sprite.sounds, []);

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
    a.goBackwardLayers(2);
    t.equals(a.renderer.order, 3);
    a.goToBack();
    t.equals(a.renderer.order, 1);
    a.goForwardLayers(1);
    t.equals(a.renderer.order, 2);
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
    a.sprite.costumes = [{id: 1}, {id: 2}, {id: 3}];
    t.equals(a.getCostumes().length, 3);
    t.equals(a.getCostumes()[0].id, 1);
    t.equals(a.getCostumes()[1].id, 2);
    t.equals(a.getCostumes()[2].id, 3);
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
    a.sprite.sounds = sounds;
    a.sprite.costumes = [{id: 1}, {id: 2}, {id: 3}];
    t.same(a.toJSON().sounds, sounds);
    t.same(a.toJSON().costumes, a.sprite.costumes);
    t.end();
});

test('#addSound does not duplicate names', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    a.sprite.sounds = [{name: 'first'}];
    a.addSound({name: 'first'});
    t.deepEqual(a.sprite.sounds, [{name: 'first'}, {name: 'first2'}]);
    t.end();
});

test('#addCostume does not duplicate names', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    a.addCostume({name: 'first'});
    a.addCostume({name: 'first'});
    t.equal(a.sprite.costumes.length, 2);
    t.equal(a.sprite.costumes[0].name, 'first');
    t.equal(a.sprite.costumes[1].name, 'first2');
    t.end();
});

test('#renameSound does not duplicate names', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    a.sprite.sounds = [{name: 'first'}, {name: 'second'}];
    a.renameSound(0, 'first'); // Shouldn't increment the name, noop
    t.deepEqual(a.sprite.sounds, [{name: 'first'}, {name: 'second'}]);
    a.renameSound(1, 'first');
    t.deepEqual(a.sprite.sounds, [{name: 'first'}, {name: 'first2'}]);
    t.end();
});

test('#renameCostume does not duplicate names', t => {
    const spr = new Sprite();
    const a = new RenderedTarget(spr, null);
    a.sprite.costumes = [{name: 'first'}, {name: 'second'}];
    a.renameCostume(0, 'first'); // Shouldn't increment the name, noop
    t.equal(a.sprite.costumes.length, 2);
    t.equal(a.sprite.costumes[0].name, 'first');
    t.equal(a.sprite.costumes[1].name, 'second');
    a.renameCostume(1, 'first');
    t.equal(a.sprite.costumes.length, 2);
    t.equal(a.sprite.costumes[0].name, 'first');
    t.equal(a.sprite.costumes[1].name, 'first2');
    t.end();
});
