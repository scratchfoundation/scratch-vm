var Cast = require('../util/cast');

var Scratch3SensingBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3SensingBlocks.prototype.getPrimitives = function () {
    return {
        sensing_touchingobject: this.touchingObject,
        sensing_touchingcolor: this.touchingColor,
        sensing_coloristouchingcolor: this.colorTouchingColor,
        sensing_distanceto: this.distanceTo,
        sensing_timer: this.getTimer,
        sensing_resettimer: this.resetTimer,
        sensing_of: this.getAttributeOf,
        sensing_mousex: this.getMouseX,
        sensing_mousey: this.getMouseY,
        sensing_mousedown: this.getMouseDown,
        sensing_keypressed: this.getKeyPressed,
        sensing_current: this.current,
        sensing_dayssince2000: this.daysSince2000
    };
};

Scratch3SensingBlocks.prototype.touchingObject = function (args, util) {
    var requestedObject = args.TOUCHINGOBJECTMENU;
    if (requestedObject === '_mouse_') {
        var mouseX = util.ioQuery('mouse', 'getX');
        var mouseY = util.ioQuery('mouse', 'getY');
        return util.target.isTouchingPoint(mouseX, mouseY);
    } else if (requestedObject === '_edge_') {
        return util.target.isTouchingEdge();
    } else {
        return util.target.isTouchingSprite(requestedObject);
    }
};

Scratch3SensingBlocks.prototype.touchingColor = function (args, util) {
    var color = Cast.toRgbColorList(args.COLOR);
    return util.target.isTouchingColor(color);
};

Scratch3SensingBlocks.prototype.colorTouchingColor = function (args, util) {
    var maskColor = Cast.toRgbColorList(args.COLOR);
    var targetColor = Cast.toRgbColorList(args.COLOR2);
    return util.target.colorIsTouchingColor(targetColor, maskColor);
};

Scratch3SensingBlocks.prototype.distanceTo = function (args, util) {
    if (util.target.isStage) return 10000;

    var targetX = 0;
    var targetY = 0;
    if (args.DISTANCETOMENU === '_mouse_') {
        targetX = util.ioQuery('mouse', 'getX');
        targetY = util.ioQuery('mouse', 'getY');
    } else {
        var distTarget = this.runtime.getSpriteTargetByName(
            args.DISTANCETOMENU
        );
        if (!distTarget) return 10000;
        targetX = distTarget.x;
        targetY = distTarget.y;
    }

    var dx = util.target.x - targetX;
    var dy = util.target.y - targetY;
    return Math.sqrt((dx * dx) + (dy * dy));
};

Scratch3SensingBlocks.prototype.getTimer = function (args, util) {
    return util.ioQuery('clock', 'projectTimer');
};

Scratch3SensingBlocks.prototype.resetTimer = function (args, util) {
    util.ioQuery('clock', 'resetProjectTimer');
};

Scratch3SensingBlocks.prototype.getMouseX = function (args, util) {
    return util.ioQuery('mouse', 'getX');
};

Scratch3SensingBlocks.prototype.getMouseY = function (args, util) {
    return util.ioQuery('mouse', 'getY');
};

Scratch3SensingBlocks.prototype.getMouseDown = function (args, util) {
    return util.ioQuery('mouse', 'getIsDown');
};

Scratch3SensingBlocks.prototype.current = function (args) {
    var menuOption = Cast.toString(args.CURRENTMENU).toLowerCase();
    var date = new Date();
    switch (menuOption) {
    case 'year': return date.getFullYear();
    case 'month': return date.getMonth() + 1; // getMonth is zero-based
    case 'date': return date.getDate();
    case 'dayofweek': return date.getDay() + 1; // getDay is zero-based, Sun=0
    case 'hour': return date.getHours();
    case 'minute': return date.getMinutes();
    case 'second': return date.getSeconds();
    }
    return 0;
};

Scratch3SensingBlocks.prototype.getKeyPressed = function (args, util) {
    return util.ioQuery('keyboard', 'getKeyIsDown', args.KEY_OPTION);
};

Scratch3SensingBlocks.prototype.daysSince2000 = function () {
    var msPerDay = 24 * 60 * 60 * 1000;
    var start = new Date(2000, 0, 1); // Months are 0-indexed.
    var today = new Date();
    var dstAdjust = today.getTimezoneOffset() - start.getTimezoneOffset();
    var mSecsSinceStart = today.valueOf() - start.valueOf();
    mSecsSinceStart += ((today.getTimezoneOffset() - dstAdjust) * 60 * 1000);
    return mSecsSinceStart / msPerDay;
};

Scratch3SensingBlocks.prototype.getAttributeOf = function (args) {
    var attrTarget;

    if (args.OBJECT === '_stage_') {
        attrTarget = this.runtime.getTargetForStage();
    } else {
        attrTarget = this.runtime.getSpriteTargetByName(args.OBJECT);
    }

    // Generic attributes
    if (attrTarget.isStage) {
        switch (args.PROPERTY) {
        // Scratch 1.4 support
        case 'background #': return attrTarget.currentCostume + 1;

        case 'backdrop #': return attrTarget.currentCostume + 1;
        case 'backdrop name':
            return attrTarget.sprite.costumes[attrTarget.currentCostume].name;
        case 'volume': return; // @todo: Keep this in mind for sound blocks!
        }
    } else {
        switch (args.PROPERTY) {
        case 'x position': return attrTarget.x;
        case 'y position': return attrTarget.y;
        case 'direction': return attrTarget.direction;
        case 'costume #': return attrTarget.currentCostume + 1;
        case 'costume name':
            return attrTarget.sprite.costumes[attrTarget.currentCostume].name;
        case 'size': return attrTarget.size;
        case 'volume': return; // @todo: above, keep in mind for sound blocks..
        }
    }

    // Variables
    var varName = args.PROPERTY;
    if (attrTarget.variables.hasOwnProperty(varName)) {
        return attrTarget.variables[varName].value;
    }

    // Otherwise, 0
    return 0;
};

module.exports = Scratch3SensingBlocks;
