const FakeRenderer = function () {
    this.unused = '';
    this.x = 0;
    this.y = 0;
    this.order = 0;
    this.spriteCount = 5;
};

FakeRenderer.prototype.createDrawable = function () {
    return true;
};

FakeRenderer.prototype.getFencedPositionOfDrawable = function (d, p) { // eslint-disable-line no-unused-vars
    return [p[0], p[1]];
};

FakeRenderer.prototype.updateDrawableSkinId = function (d, skinId) { // eslint-disable-line no-unused-vars
};

FakeRenderer.prototype.updateDrawableSkinIdRotationCenter =
    function (d, skinId, rotationCenter) {}; // eslint-disable-line no-unused-vars

FakeRenderer.prototype.updateDrawablePosition = function (d, position) { // eslint-disable-line no-unused-vars
    this.x = position[0];
    this.y = position[1];
};

FakeRenderer.prototype.updateDrawableDirectionScale =
    function (d, direction, scale) {}; // eslint-disable-line no-unused-vars

FakeRenderer.prototype.updateDrawableVisible = function (d, visible) { // eslint-disable-line no-unused-vars
};

FakeRenderer.prototype.updateDrawableEffect = function (d, effectName, value) { // eslint-disable-line no-unused-vars
};

FakeRenderer.prototype.updateDrawableProperties = function (d, p) { // eslint-disable-line no-unused-vars
    throw new Error('updateDrawableProperties is deprecated');
};

FakeRenderer.prototype.getCurrentSkinSize = function (d) { // eslint-disable-line no-unused-vars
    return [0, 0];
};

FakeRenderer.prototype.pick = function (x, y, a, b, d) { // eslint-disable-line no-unused-vars
    return true;
};

FakeRenderer.prototype.drawableTouching = function (d, x, y, w, h) { // eslint-disable-line no-unused-vars
    return true;
};

FakeRenderer.prototype.isTouchingColor = function (d, c) { // eslint-disable-line no-unused-vars
    return true;
};

FakeRenderer.prototype.getBounds = function (d) { // eslint-disable-line no-unused-vars
    return {left: this.x, right: this.x, top: this.y, bottom: this.y};
};

FakeRenderer.prototype.setDrawableOrder = function (d, a, optG, optA, optB) { // eslint-disable-line no-unused-vars
    if (d === 999) return 1; // fake for test case
    if (optA) {
        a += this.order;
    }
    if (optB) {
        a = Math.max(a, optB);
    }
    a = Math.max(a, 0);
    this.order = Math.min(a, this.spriteCount);
    return this.order;
};

FakeRenderer.prototype.getDrawableOrder = function (d) { // eslint-disable-line no-unused-vars
    return 'stub';
};

FakeRenderer.prototype.pick = function (x, y, a, b, c) { // eslint-disable-line no-unused-vars
    return c[0];
};

FakeRenderer.prototype.isTouchingColor = function (a, b) { // eslint-disable-line no-unused-vars
    return false;
};

FakeRenderer.prototype.setLayerGroupOrdering = function (a) {}; // eslint-disable-line no-unused-vars

module.exports = FakeRenderer;
