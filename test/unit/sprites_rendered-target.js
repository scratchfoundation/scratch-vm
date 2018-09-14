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
    const deletedCostume = a.deleteCostume(0);
    t.equals(a.sprite.costumes.length, 2);
    t.equals(a.sprite.costumes[0].id, 2);
    t.equals(a.sprite.costumes[1].id, 3);
    t.equals(a.currentCostume, 0);
    t.deepEqual(deletedCostume, o1);

    //    Costume 1          Costume 1
    // x* Costume 2   =>   * Costume 3
    //    Costume 3
    a.sprite.costumes = [o1, o2, o3];
    a.setCostume(1);
    const deletedCostume2 = a.deleteCostume(1);
    t.equals(a.sprite.costumes.length, 2);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 3);
    t.equals(a.currentCostume, 1);
    t.deepEqual(deletedCostume2, o2);

    //    Costume 1          Costume 1
    //    Costume 2   =>   * Costume 2
    // x* Costume 3
    a.sprite.costumes = [o1, o2, o3];
    a.setCostume(2);
    const deletedCostume3 = a.deleteCostume(2);
    t.equals(a.sprite.costumes.length, 2);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.sprite.costumes[1].id, 2);
    t.equals(a.currentCostume, 1);
    t.deepEqual(deletedCostume3, o3);

    // Refuses to delete only costume
    a.sprite.costumes = [o1];
    a.setCostume(0);
    const noDeletedCostume = a.deleteCostume(0);
    t.equals(a.sprite.costumes.length, 1);
    t.equals(a.sprite.costumes[0].id, 1);
    t.equals(a.currentCostume, 0);
    t.equal(noDeletedCostume, null);

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

    const firstDeleted = a.deleteSound(0);
    t.deepEqual(a.sprite.sounds, [o2, o3]);
    t.deepEqual(firstDeleted, o1);

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

test('layers', t => { // TODO this tests fake functionality. Move layering tests into Render.
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
    // Note, there are only sprites in this test, no stage, and the addition
    // of layer groups, goToBack no longer specifies a minimum order number
    t.equals(a.renderer.order, 0);
    a.goForwardLayers(1);
    t.equals(a.renderer.order, 1);
    o.drawableID = 999;
    a.goBehindOther(o);
    t.equals(a.renderer.order, 1);
    t.end();
});

test('getLayerOrder returns result of renderer getDrawableOrder or null if renderer is not attached', t => {
    const s = new Sprite();
    const r = new Runtime();
    const a = new RenderedTarget(s, r);

    // getLayerOrder should return null if there is no renderer attached to the runtime
    t.equal(a.getLayerOrder(), null);

    const renderer = new FakeRenderer();
    r.attachRenderer(renderer);
    const b = new RenderedTarget(s, r);

    t.equal(b.getLayerOrder(), 'stub');

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

test('#reorderCostume', t => {
    const o1 = {id: 0};
    const o2 = {id: 1};
    const o3 = {id: 2};
    const o4 = {id: 3};
    const o5 = {id: 4};
    const s = new Sprite();
    const r = new Runtime();
    s.costumes = [o1, o2, o3, o4, o5];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    const resetCostumes = () => {
        a.setCostume(0);
        s.costumes = [o1, o2, o3, o4, o5];
    };
    const costumeIds = () => a.sprite.costumes.map(c => c.id);

    resetCostumes();
    t.deepEquals(costumeIds(), [0, 1, 2, 3, 4]);
    t.equals(a.currentCostume, 0);

    // Returns false if the costumes are the same and no change occurred
    t.equal(a.reorderCostume(3, 3), false);
    t.equal(a.reorderCostume(999, 5000), false); // Clamped to the same values.
    t.equal(a.reorderCostume(-999, -5000), false);

    // Make sure reordering up and down works and current costume follows
    resetCostumes();
    t.equal(a.reorderCostume(0, 3), true);
    t.deepEquals(costumeIds(), [1, 2, 3, 0, 4]);
    t.equals(a.currentCostume, 3); // Index of id=0

    resetCostumes();
    a.setCostume(1);
    t.equal(a.reorderCostume(3, 1), true);
    t.deepEquals(costumeIds(), [0, 3, 1, 2, 4]);
    t.equals(a.currentCostume, 2); // Index of id=1

    // Out of bounds indices get clamped
    resetCostumes();
    t.equal(a.reorderCostume(10, 0), true);
    t.deepEquals(costumeIds(), [4, 0, 1, 2, 3]);
    t.equals(a.currentCostume, 1); // Index of id=0

    resetCostumes();
    t.equal(a.reorderCostume(2, -1000), true);
    t.deepEquals(costumeIds(), [2, 0, 1, 3, 4]);
    t.equals(a.currentCostume, 1); // Index of id=0

    t.end();
});

test('#reorderSound', t => {
    const o1 = {id: 0, name: 'name0'};
    const o2 = {id: 1, name: 'name1'};
    const o3 = {id: 2, name: 'name2'};
    const o4 = {id: 3, name: 'name3'};
    const o5 = {id: 4, name: 'name4'};
    const s = new Sprite();
    const r = new Runtime();
    s.sounds = [o1, o2, o3, o4, o5];
    const a = new RenderedTarget(s, r);
    const renderer = new FakeRenderer();
    a.renderer = renderer;

    const resetSounds = () => {
        s.sounds = [o1, o2, o3, o4, o5];
    };
    const soundIds = () => a.sprite.sounds.map(c => c.id);

    resetSounds();
    t.deepEquals(soundIds(), [0, 1, 2, 3, 4]);

    // Return false if indices are the same and no change occurred.
    t.equal(a.reorderSound(3, 3), false);
    t.equal(a.reorderSound(100000, 99999), false); // Clamped to the same values
    t.equal(a.reorderSound(-100000, -99999), false);

    // Make sure reordering up and down works and current sound follows
    resetSounds();
    t.equal(a.reorderSound(0, 3), true);
    t.deepEquals(soundIds(), [1, 2, 3, 0, 4]);

    resetSounds();
    t.equal(a.reorderSound(3, 1), true);
    t.deepEquals(soundIds(), [0, 3, 1, 2, 4]);

    // Out of bounds indices get clamped
    resetSounds();
    t.equal(a.reorderSound(10, 0), true);
    t.deepEquals(soundIds(), [4, 0, 1, 2, 3]);

    resetSounds();
    t.equal(a.reorderSound(2, -1000), true);
    t.deepEquals(soundIds(), [2, 0, 1, 3, 4]);

    t.end();
});
