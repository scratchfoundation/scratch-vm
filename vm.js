/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {module.exports = global["VirtualMachine"] = __webpack_require__(10);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(11);
	var util = __webpack_require__(12);

	var Runtime = __webpack_require__(16);
	var sb2import = __webpack_require__(103);
	var Sprite = __webpack_require__(109);
	var Blocks = __webpack_require__(34);

	/**
	 * Handles connections between blocks, stage, and extensions.
	 *
	 * @author Andrew Sliwinski <ascii@media.mit.edu>
	 */
	var VirtualMachine = function () {
	    var instance = this;
	    // Bind event emitter and runtime to VM instance
	    EventEmitter.call(instance);
	    /**
	     * VM runtime, to store blocks, I/O devices, sprites/targets, etc.
	     * @type {!Runtime}
	     */
	    instance.runtime = new Runtime();
	    /**
	     * The "currently editing"/selected target ID for the VM.
	     * Block events from any Blockly workspace are routed to this target.
	     * @type {!string}
	     */
	    instance.editingTarget = null;
	    // Runtime emits are passed along as VM emits.
	    instance.runtime.on(Runtime.SCRIPT_GLOW_ON, function (id) {
	        instance.emit(Runtime.SCRIPT_GLOW_ON, {id: id});
	    });
	    instance.runtime.on(Runtime.SCRIPT_GLOW_OFF, function (id) {
	        instance.emit(Runtime.SCRIPT_GLOW_OFF, {id: id});
	    });
	    instance.runtime.on(Runtime.BLOCK_GLOW_ON, function (id) {
	        instance.emit(Runtime.BLOCK_GLOW_ON, {id: id});
	    });
	    instance.runtime.on(Runtime.BLOCK_GLOW_OFF, function (id) {
	        instance.emit(Runtime.BLOCK_GLOW_OFF, {id: id});
	    });
	    instance.runtime.on(Runtime.VISUAL_REPORT, function (id, value) {
	        instance.emit(Runtime.VISUAL_REPORT, {id: id, value: value});
	    });
	    instance.runtime.on(Runtime.SPRITE_INFO_REPORT, function (data) {
	        instance.emit(Runtime.SPRITE_INFO_REPORT, data);
	    });

	    this.blockListener = this.blockListener.bind(this);
	    this.flyoutBlockListener = this.flyoutBlockListener.bind(this);
	};

	/**
	 * Inherit from EventEmitter
	 */
	util.inherits(VirtualMachine, EventEmitter);

	/**
	 * Start running the VM - do this before anything else.
	 */
	VirtualMachine.prototype.start = function () {
	    this.runtime.start();
	};

	/**
	 * "Green flag" handler - start all threads starting with a green flag.
	 */
	VirtualMachine.prototype.greenFlag = function () {
	    this.runtime.greenFlag();
	};

	/**
	 * Set whether the VM is in "turbo mode."
	 * When true, loops don't yield to redraw.
	 * @param {Boolean} turboModeOn Whether turbo mode should be set.
	 */
	VirtualMachine.prototype.setTurboMode = function (turboModeOn) {
	    this.runtime.turboMode = !!turboModeOn;
	};

	/**
	 * Set whether the VM is in 2.0 "compatibility mode."
	 * When true, ticks go at 2.0 speed (30 TPS).
	 * @param {Boolean} compatibilityModeOn Whether compatibility mode is set.
	 */
	VirtualMachine.prototype.setCompatibilityMode = function (compatibilityModeOn) {
	    this.runtime.setCompatibilityMode(!!compatibilityModeOn);
	};

	/**
	 * Stop all threads and running activities.
	 */
	VirtualMachine.prototype.stopAll = function () {
	    this.runtime.stopAll();
	};

	/**
	 * Clear out current running project data.
	 */
	VirtualMachine.prototype.clear = function () {
	    this.runtime.dispose();
	    this.editingTarget = null;
	    this.emitTargetsUpdate();
	};

	/**
	 * Get data for playground. Data comes back in an emitted event.
	 */
	VirtualMachine.prototype.getPlaygroundData = function () {
	    var instance = this;
	    // Only send back thread data for the current editingTarget.
	    var threadData = this.runtime.threads.filter(function (thread) {
	        return thread.target === instance.editingTarget;
	    });
	    // Remove the target key, since it's a circular reference.
	    var filteredThreadData = JSON.stringify(threadData, function (key, value) {
	        if (key === 'target') return;
	        return value;
	    }, 2);
	    this.emit('playgroundData', {
	        blocks: this.editingTarget.blocks,
	        threads: filteredThreadData
	    });
	};

	/**
	 * Post I/O data to the virtual devices.
	 * @param {?string} device Name of virtual I/O device.
	 * @param {Object} data Any data object to post to the I/O device.
	 */
	VirtualMachine.prototype.postIOData = function (device, data) {
	    if (this.runtime.ioDevices[device]) {
	        this.runtime.ioDevices[device].postData(data);
	    }
	};

	/**
	 * Load a project from a Scratch 2.0 JSON representation.
	 * @param {?string} json JSON string representing the project.
	 */
	VirtualMachine.prototype.loadProject = function (json) {
	    this.clear();
	    // @todo: Handle other formats, e.g., Scratch 1.4, Scratch 3.0.
	    sb2import(json, this.runtime);
	    // Select the first target for editing, e.g., the first sprite.
	    this.editingTarget = this.runtime.targets[1];
	    // Update the VM user's knowledge of targets and blocks on the workspace.
	    this.emitTargetsUpdate();
	    this.emitWorkspaceUpdate();
	    this.runtime.setEditingTarget(this.editingTarget);
	};

	/**
	 * Add a single sprite from the "Sprite2" (i.e., SB2 sprite) format.
	 * @param {?string} json JSON string representing the sprite.
	 */
	VirtualMachine.prototype.addSprite2 = function (json) {
	    // Select new sprite.
	    this.editingTarget = sb2import(json, this.runtime, true);
	    // Update the VM user's knowledge of targets and blocks on the workspace.
	    this.emitTargetsUpdate();
	    this.emitWorkspaceUpdate();
	    this.runtime.setEditingTarget(this.editingTarget);
	};

	/**
	 * Add a costume to the current editing target.
	 * @param {!Object} costumeObject Object representing the costume.
	 */
	VirtualMachine.prototype.addCostume = function (costumeObject) {
	    this.editingTarget.sprite.costumes.push(costumeObject);
	    // Switch to the costume.
	    this.editingTarget.setCostume(
	        this.editingTarget.sprite.costumes.length - 1
	    );
	};

	/**
	 * Add a backdrop to the stage.
	 * @param {!Object} backdropObject Object representing the backdrop.
	 */
	VirtualMachine.prototype.addBackdrop = function (backdropObject) {
	    var stage = this.runtime.getTargetForStage();
	    stage.sprite.costumes.push(backdropObject);
	    // Switch to the backdrop.
	    stage.setCostume(stage.sprite.costumes.length - 1);
	};

	/**
	 * Rename a sprite.
	 * @param {string} targetId ID of a target whose sprite to rename.
	 * @param {string} newName New name of the sprite.
	 */
	VirtualMachine.prototype.renameSprite = function (targetId, newName) {
	    var target = this.runtime.getTargetById(targetId);
	    if (target) {
	        if (!target.isSprite()) {
	            throw new Error('Cannot rename non-sprite targets.');
	        }
	        var sprite = target.sprite;
	        if (!sprite) {
	            throw new Error('No sprite associated with this target.');
	        }
	        sprite.name = newName;
	        this.emitTargetsUpdate();
	    } else {
	        throw new Error('No target with the provided id.');
	    }
	};

	/**
	 * Delete a sprite and all its clones.
	 * @param {string} targetId ID of a target whose sprite to delete.
	 */
	VirtualMachine.prototype.deleteSprite = function (targetId) {
	    var target = this.runtime.getTargetById(targetId);
	    if (target) {
	        if (!target.isSprite()) {
	            throw new Error('Cannot delete non-sprite targets.');
	        }
	        var sprite = target.sprite;
	        if (!sprite) {
	            throw new Error('No sprite associated with this target.');
	        }
	        var currentEditingTarget = this.editingTarget;
	        for (var i = 0; i < sprite.clones.length; i++) {
	            var clone = sprite.clones[i];
	            this.runtime.stopForTarget(sprite.clones[i]);
	            this.runtime.disposeTarget(sprite.clones[i]);
	            // Ensure editing target is switched if we are deleting it.
	            if (clone === currentEditingTarget) {
	                this.setEditingTarget(this.runtime.targets[0].id);
	            }
	        }
	        // Sprite object should be deleted by GC.
	        this.emitTargetsUpdate();
	    } else {
	        throw new Error('No target with the provided id.');
	    }
	};

	/**
	 * Temporary way to make an empty project, in case the desired project
	 * cannot be loaded from the online server.
	 */
	VirtualMachine.prototype.createEmptyProject = function () {
	    // Stage.
	    var blocks2 = new Blocks();
	    var stage = new Sprite(blocks2, this.runtime);
	    stage.name = 'Stage';
	    stage.costumes.push({
	        skin: './assets/stage.png',
	        name: 'backdrop1',
	        bitmapResolution: 2,
	        rotationCenterX: 480,
	        rotationCenterY: 360
	    });
	    var target2 = stage.createClone();
	    this.runtime.targets.push(target2);
	    target2.x = 0;
	    target2.y = 0;
	    target2.direction = 90;
	    target2.size = 200;
	    target2.visible = true;
	    target2.isStage = true;
	    // Sprite1 (cat).
	    var blocks1 = new Blocks();
	    var sprite = new Sprite(blocks1, this.runtime);
	    sprite.name = 'Sprite1';
	    sprite.costumes.push({
	        skin: './assets/scratch_cat.svg',
	        name: 'costume1',
	        bitmapResolution: 1,
	        rotationCenterX: 47,
	        rotationCenterY: 55
	    });
	    var target1 = sprite.createClone();
	    this.runtime.targets.push(target1);
	    target1.x = 0;
	    target1.y = 0;
	    target1.direction = 90;
	    target1.size = 100;
	    target1.visible = true;
	    this.editingTarget = this.runtime.targets[0];
	    this.emitTargetsUpdate();
	    this.emitWorkspaceUpdate();
	};

	/**
	 * Set the renderer for the VM/runtime
	 * @param {!RenderWebGL} renderer The renderer to attach
	 */
	VirtualMachine.prototype.attachRenderer = function (renderer) {
	    this.runtime.attachRenderer(renderer);
	};

	/**
	 * Handle a Blockly event for the current editing target.
	 * @param {!Blockly.Event} e Any Blockly event.
	 */
	VirtualMachine.prototype.blockListener = function (e) {
	    if (this.editingTarget) {
	        this.editingTarget.blocks.blocklyListen(e, this.runtime);
	    }
	};

	/**
	 * Handle a Blockly event for the flyout.
	 * @param {!Blockly.Event} e Any Blockly event.
	 */
	VirtualMachine.prototype.flyoutBlockListener = function (e) {
	    this.runtime.flyoutBlocks.blocklyListen(e, this.runtime);
	};

	/**
	 * Set an editing target. An editor UI can use this function to switch
	 * between editing different targets, sprites, etc.
	 * After switching the editing target, the VM may emit updates
	 * to the list of targets and any attached workspace blocks
	 * (see `emitTargetsUpdate` and `emitWorkspaceUpdate`).
	 * @param {string} targetId Id of target to set as editing.
	 */
	VirtualMachine.prototype.setEditingTarget = function (targetId) {
	    // Has the target id changed? If not, exit.
	    if (targetId === this.editingTarget.id) {
	        return;
	    }
	    var target = this.runtime.getTargetById(targetId);
	    if (target) {
	        this.editingTarget = target;
	        // Emit appropriate UI updates.
	        this.emitTargetsUpdate();
	        this.emitWorkspaceUpdate();
	        this.runtime.setEditingTarget(target);
	    }
	};

	/**
	 * Emit metadata about available targets.
	 * An editor UI could use this to display a list of targets and show
	 * the currently editing one.
	 */
	VirtualMachine.prototype.emitTargetsUpdate = function () {
	    this.emit('targetsUpdate', {
	        // [[target id, human readable target name], ...].
	        targetList: this.runtime.targets.filter(function (target) {
	            // Don't report clones.
	            return !target.hasOwnProperty('isOriginal') || target.isOriginal;
	        }).map(function (target) {
	            return [target.id, target.getName()];
	        }),
	        // Currently editing target id.
	        editingTarget: this.editingTarget ? this.editingTarget.id : null
	    });
	};

	/**
	 * Emit an Blockly/scratch-blocks compatible XML representation
	 * of the current editing target's blocks.
	 */
	VirtualMachine.prototype.emitWorkspaceUpdate = function () {
	    this.emit('workspaceUpdate', {
	        xml: this.editingTarget.blocks.toXML()
	    });
	};

	/**
	 * Post/edit sprite info for the current editing target.
	 * @param {object} data An object with sprite info data to set.
	 */
	VirtualMachine.prototype.postSpriteInfo = function (data) {
	    this.editingTarget.postSpriteInfo(data);
	};

	module.exports = VirtualMachine;


/***/ },
/* 11 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(14);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(15);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(13)))

/***/ },
/* 13 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 15 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(11);
	var Sequencer = __webpack_require__(17);
	var Blocks = __webpack_require__(34);
	var Thread = __webpack_require__(19);
	var util = __webpack_require__(12);

	// Virtual I/O devices.
	var Clock = __webpack_require__(89);
	var Keyboard = __webpack_require__(90);
	var Mouse = __webpack_require__(93);

	var defaultBlockPackages = {
	    scratch3_control: __webpack_require__(95),
	    scratch3_event: __webpack_require__(96),
	    scratch3_looks: __webpack_require__(97),
	    scratch3_motion: __webpack_require__(98),
	    scratch3_operators: __webpack_require__(99),
	    scratch3_sensing: __webpack_require__(100),
	    scratch3_data: __webpack_require__(101),
	    scratch3_procedures: __webpack_require__(102)
	};

	/**
	 * Manages targets, scripts, and the sequencer.
	 */
	var Runtime = function () {
	    // Bind event emitter
	    EventEmitter.call(this);

	    /**
	     * Target management and storage.
	     * @type {Array.<!Target>}
	     */
	    this.targets = [];

	    /**
	     * A list of threads that are currently running in the VM.
	     * Threads are added when execution starts and pruned when execution ends.
	     * @type {Array.<Thread>}
	     */
	    this.threads = [];

	    /** @type {!Sequencer} */
	    this.sequencer = new Sequencer(this);

	    /**
	     * Storage container for flyout blocks.
	     * These will execute on `_editingTarget.`
	     * @type {!Blocks}
	     */
	    this.flyoutBlocks = new Blocks();

	    /**
	     * Currently known editing target for the VM.
	     * @type {?Target}
	     */
	    this._editingTarget = null;

	    /**
	     * Map to look up a block primitive's implementation function by its opcode.
	     * This is a two-step lookup: package name first, then primitive name.
	     * @type {Object.<string, Function>}
	     */
	    this._primitives = {};

	    /**
	     * Map to look up hat blocks' metadata.
	     * Keys are opcode for hat, values are metadata objects.
	     * @type {Object.<string, Object>}
	     */
	    this._hats = {};

	    /**
	     * Currently known values for edge-activated hats.
	     * Keys are block ID for the hat; values are the currently known values.
	     * @type {Object.<string, *>}
	     */
	    this._edgeActivatedHatValues = {};

	    /**
	     * A list of script block IDs that were glowing during the previous frame.
	     * @type {!Array.<!string>}
	     */
	    this._scriptGlowsPreviousFrame = [];

	    /**
	     * Currently known number of clones, used to enforce clone limit.
	     * @type {number}
	     */
	    this._cloneCounter = 0;

	    /**
	     * Whether the project is in "turbo mode."
	     * @type {Boolean}
	     */
	    this.turboMode = false;

	    /**
	     * Whether the project is in "compatibility mode" (30 TPS).
	     * @type {Boolean}
	     */
	    this.compatibilityMode = false;

	    /**
	     * A reference to the current runtime stepping interval, set
	     * by a `setInterval`.
	     * @type {!number}
	     */
	    this._steppingInterval = null;

	    /**
	     * Current length of a step.
	     * Changes as mode switches, and used by the sequencer to calculate
	     * WORK_TIME.
	     * @type {!number}
	     */
	    this.currentStepTime = null;

	    /**
	     * Whether any primitive has requested a redraw.
	     * Affects whether `Sequencer.stepThreads` will yield
	     * after stepping each thread.
	     * Reset on every frame.
	     * @type {boolean}
	     */
	    this.redrawRequested = false;

	    // Register all given block packages.
	    this._registerBlockPackages();

	    // Register and initialize "IO devices", containers for processing
	    // I/O related data.
	    /** @type {Object.<string, Object>} */
	    this.ioDevices = {
	        clock: new Clock(),
	        keyboard: new Keyboard(this),
	        mouse: new Mouse(this)
	    };
	};

	/**
	 * Inherit from EventEmitter
	 */
	util.inherits(Runtime, EventEmitter);

	/**
	 * Width of the stage, in pixels.
	 * @const {number}
	 */
	Runtime.STAGE_WIDTH = 480;

	/**
	 * Height of the stage, in pixels.
	 * @const {number}
	 */
	Runtime.STAGE_HEIGHT = 360;

	/**
	 * Event name for glowing a script.
	 * @const {string}
	 */
	Runtime.SCRIPT_GLOW_ON = 'STACK_GLOW_ON';

	/**
	 * Event name for unglowing a script.
	 * @const {string}
	 */
	Runtime.SCRIPT_GLOW_OFF = 'STACK_GLOW_OFF';

	/**
	 * Event name for glowing a block.
	 * @const {string}
	 */
	Runtime.BLOCK_GLOW_ON = 'BLOCK_GLOW_ON';

	/**
	 * Event name for unglowing a block.
	 * @const {string}
	 */
	Runtime.BLOCK_GLOW_OFF = 'BLOCK_GLOW_OFF';

	/**
	 * Event name for visual value report.
	 * @const {string}
	 */
	Runtime.VISUAL_REPORT = 'VISUAL_REPORT';

	/**
	 * Event name for sprite info report.
	 * @const {string}
	 */
	Runtime.SPRITE_INFO_REPORT = 'SPRITE_INFO_REPORT';

	/**
	 * How rapidly we try to step threads by default, in ms.
	 */
	Runtime.THREAD_STEP_INTERVAL = 1000 / 60;

	/**
	 * In compatibility mode, how rapidly we try to step threads, in ms.
	 */
	Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY = 1000 / 30;

	/**
	 * How many clones can be created at a time.
	 * @const {number}
	 */
	Runtime.MAX_CLONES = 300;

	// -----------------------------------------------------------------------------
	// -----------------------------------------------------------------------------

	/**
	 * Register default block packages with this runtime.
	 * @todo Prefix opcodes with package name.
	 * @private
	 */
	Runtime.prototype._registerBlockPackages = function () {
	    for (var packageName in defaultBlockPackages) {
	        if (defaultBlockPackages.hasOwnProperty(packageName)) {
	            // @todo pass a different runtime depending on package privilege?
	            var packageObject = new (defaultBlockPackages[packageName])(this);
	            // Collect primitives from package.
	            if (packageObject.getPrimitives) {
	                var packagePrimitives = packageObject.getPrimitives();
	                for (var op in packagePrimitives) {
	                    if (packagePrimitives.hasOwnProperty(op)) {
	                        this._primitives[op] =
	                            packagePrimitives[op].bind(packageObject);
	                    }
	                }
	            }
	            // Collect hat metadata from package.
	            if (packageObject.getHats) {
	                var packageHats = packageObject.getHats();
	                for (var hatName in packageHats) {
	                    if (packageHats.hasOwnProperty(hatName)) {
	                        this._hats[hatName] = packageHats[hatName];
	                    }
	                }
	            }
	        }
	    }
	};

	/**
	 * Retrieve the function associated with the given opcode.
	 * @param {!string} opcode The opcode to look up.
	 * @return {Function} The function which implements the opcode.
	 */
	Runtime.prototype.getOpcodeFunction = function (opcode) {
	    return this._primitives[opcode];
	};

	/**
	 * Return whether an opcode represents a hat block.
	 * @param {!string} opcode The opcode to look up.
	 * @return {Boolean} True if the op is known to be a hat.
	 */
	Runtime.prototype.getIsHat = function (opcode) {
	    return this._hats.hasOwnProperty(opcode);
	};

	/**
	 * Return whether an opcode represents an edge-activated hat block.
	 * @param {!string} opcode The opcode to look up.
	 * @return {Boolean} True if the op is known to be a edge-activated hat.
	 */
	Runtime.prototype.getIsEdgeActivatedHat = function (opcode) {
	    return this._hats.hasOwnProperty(opcode) &&
	        this._hats[opcode].edgeActivated;
	};

	/**
	 * Update an edge-activated hat block value.
	 * @param {!string} blockId ID of hat to store value for.
	 * @param {*} newValue Value to store for edge-activated hat.
	 * @return {*} The old value for the edge-activated hat.
	 */
	Runtime.prototype.updateEdgeActivatedValue = function (blockId, newValue) {
	    var oldValue = this._edgeActivatedHatValues[blockId];
	    this._edgeActivatedHatValues[blockId] = newValue;
	    return oldValue;
	};

	/**
	 * Clear all edge-activaed hat values.
	 */
	Runtime.prototype.clearEdgeActivatedValues = function () {
	    this._edgeActivatedHatValues = {};
	};

	/**
	 * Attach the renderer
	 * @param {!RenderWebGL} renderer The renderer to attach
	 */
	Runtime.prototype.attachRenderer = function (renderer) {
	    this.renderer = renderer;
	};

	// -----------------------------------------------------------------------------
	// -----------------------------------------------------------------------------

	/**
	 * Create a thread and push it to the list of threads.
	 * @param {!string} id ID of block that starts the stack.
	 * @param {!Target} target Target to run thread on.
	 * @return {!Thread} The newly created thread.
	 */
	Runtime.prototype._pushThread = function (id, target) {
	    var thread = new Thread(id);
	    thread.target = target;
	    thread.pushStack(id);
	    this.threads.push(thread);
	    return thread;
	};

	/**
	 * Remove a thread from the list of threads.
	 * @param {?Thread} thread Thread object to remove from actives
	 */
	Runtime.prototype._removeThread = function (thread) {
	    // Inform sequencer to stop executing that thread.
	    this.sequencer.retireThread(thread);
	    // Remove from the list.
	    var i = this.threads.indexOf(thread);
	    if (i > -1) {
	        this.threads.splice(i, 1);
	    }
	};

	/**
	 * Return whether a thread is currently active/running.
	 * @param {?Thread} thread Thread object to check.
	 * @return {Boolean} True if the thread is active/running.
	 */
	Runtime.prototype.isActiveThread = function (thread) {
	    return this.threads.indexOf(thread) > -1;
	};

	/**
	 * Toggle a script.
	 * @param {!string} topBlockId ID of block that starts the script.
	 */
	Runtime.prototype.toggleScript = function (topBlockId) {
	    // Remove any existing thread.
	    for (var i = 0; i < this.threads.length; i++) {
	        if (this.threads[i].topBlock === topBlockId) {
	            this._removeThread(this.threads[i]);
	            return;
	        }
	    }
	    // Otherwise add it.
	    this._pushThread(topBlockId, this._editingTarget);
	};

	/**
	 * Run a function `f` for all scripts in a workspace.
	 * `f` will be called with two parameters:
	 *  - the top block ID of the script.
	 *  - the target that owns the script.
	 * @param {!Function} f Function to call for each script.
	 * @param {Target=} optTarget Optionally, a target to restrict to.
	 */
	Runtime.prototype.allScriptsDo = function (f, optTarget) {
	    var targets = this.targets;
	    if (optTarget) {
	        targets = [optTarget];
	    }
	    for (var t = 0; t < targets.length; t++) {
	        var target = targets[t];
	        var scripts = target.blocks.getScripts();
	        for (var j = 0; j < scripts.length; j++) {
	            var topBlockId = scripts[j];
	            f(topBlockId, target);
	        }
	    }
	};

	/**
	 * Start all relevant hats.
	 * @param {!string} requestedHatOpcode Opcode of hats to start.
	 * @param {Object=} optMatchFields Optionally, fields to match on the hat.
	 * @param {Target=} optTarget Optionally, a target to restrict to.
	 * @return {Array.<Thread>} List of threads started by this function.
	 */
	Runtime.prototype.startHats = function (requestedHatOpcode,
	    optMatchFields, optTarget) {
	    if (!this._hats.hasOwnProperty(requestedHatOpcode)) {
	        // No known hat with this opcode.
	        return;
	    }
	    var instance = this;
	    var newThreads = [];
	    // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
	    this.allScriptsDo(function (topBlockId, target) {
	        var potentialHatOpcode = target.blocks.getBlock(topBlockId).opcode;
	        if (potentialHatOpcode !== requestedHatOpcode) {
	            // Not the right hat.
	            return;
	        }
	        // Match any requested fields.
	        // For example: ensures that broadcasts match.
	        // This needs to happen before the block is evaluated
	        // (i.e., before the predicate can be run) because "broadcast and wait"
	        // needs to have a precise collection of started threads.
	        var hatFields = target.blocks.getFields(topBlockId);
	        if (optMatchFields) {
	            for (var matchField in optMatchFields) {
	                if (hatFields[matchField].value !==
	                    optMatchFields[matchField]) {
	                    // Field mismatch.
	                    return;
	                }
	            }
	        }
	        // Look up metadata for the relevant hat.
	        var hatMeta = instance._hats[requestedHatOpcode];
	        if (hatMeta.restartExistingThreads) {
	            // If `restartExistingThreads` is true, we should stop
	            // any existing threads starting with the top block.
	            for (var i = 0; i < instance.threads.length; i++) {
	                if (instance.threads[i].topBlock === topBlockId &&
	                    instance.threads[i].target === target) {
	                    instance._removeThread(instance.threads[i]);
	                }
	            }
	        } else {
	            // If `restartExistingThreads` is false, we should
	            // give up if any threads with the top block are running.
	            for (var j = 0; j < instance.threads.length; j++) {
	                if (instance.threads[j].topBlock === topBlockId &&
	                    instance.threads[j].target === target) {
	                    // Some thread is already running.
	                    return;
	                }
	            }
	        }
	        // Start the thread with this top block.
	        newThreads.push(instance._pushThread(topBlockId, target));
	    }, optTarget);
	    return newThreads;
	};

	/**
	 * Dispose all targets. Return to clean state.
	 */
	Runtime.prototype.dispose = function () {
	    this.stopAll();
	    this.targets.map(this.disposeTarget, this);
	};

	/**
	 * Dispose of a target.
	 * @param {!Target} disposingTarget Target to dispose of.
	 */
	Runtime.prototype.disposeTarget = function (disposingTarget) {
	    this.targets = this.targets.filter(function (target) {
	        if (disposingTarget !== target) return true;
	        // Allow target to do dispose actions.
	        target.dispose();
	        // Remove from list of targets.
	        return false;
	    });
	};

	/**
	 * Stop any threads acting on the target.
	 * @param {!Target} target Target to stop threads for.
	 * @param {Thread=} optThreadException Optional thread to skip.
	 */
	Runtime.prototype.stopForTarget = function (target, optThreadException) {
	    // Stop any threads on the target.
	    for (var i = 0; i < this.threads.length; i++) {
	        if (this.threads[i] === optThreadException) {
	            continue;
	        }
	        if (this.threads[i].target === target) {
	            this._removeThread(this.threads[i]);
	        }
	    }
	};

	/**
	 * Start all threads that start with the green flag.
	 */
	Runtime.prototype.greenFlag = function () {
	    this.stopAll();
	    this.ioDevices.clock.resetProjectTimer();
	    this.clearEdgeActivatedValues();
	    // Inform all targets of the green flag.
	    for (var i = 0; i < this.targets.length; i++) {
	        this.targets[i].onGreenFlag();
	    }
	    this.startHats('event_whenflagclicked');
	};

	/**
	 * Stop "everything."
	 */
	Runtime.prototype.stopAll = function () {
	    // Dispose all clones.
	    var newTargets = [];
	    for (var i = 0; i < this.targets.length; i++) {
	        if (this.targets[i].hasOwnProperty('isOriginal') &&
	            !this.targets[i].isOriginal) {
	            this.targets[i].dispose();
	        } else {
	            newTargets.push(this.targets[i]);
	        }
	    }
	    this.targets = newTargets;
	    // Dispose all threads.
	    var threadsCopy = this.threads.slice();
	    while (threadsCopy.length > 0) {
	        var poppedThread = threadsCopy.pop();
	        this._removeThread(poppedThread);
	    }
	};

	/**
	 * Repeatedly run `sequencer.stepThreads` and filter out
	 * inactive threads after each iteration.
	 */
	Runtime.prototype._step = function () {
	    // Find all edge-activated hats, and add them to threads to be evaluated.
	    for (var hatType in this._hats) {
	        var hat = this._hats[hatType];
	        if (hat.edgeActivated) {
	            this.startHats(hatType);
	        }
	    }
	    this.redrawRequested = false;
	    var inactiveThreads = this.sequencer.stepThreads();
	    this._updateGlows(inactiveThreads);
	    if (this.renderer) {
	        // @todo: Only render when this.redrawRequested or clones rendered.
	        this.renderer.draw();
	    }
	};

	/**
	 * Set the current editing target known by the runtime.
	 * @param {!Target} editingTarget New editing target.
	 */
	Runtime.prototype.setEditingTarget = function (editingTarget) {
	    this._editingTarget = editingTarget;
	    // Script glows must be cleared.
	    this._scriptGlowsPreviousFrame = [];
	    this._updateGlows();
	    this.spriteInfoReport(editingTarget);
	};

	/**
	 * Set whether we are in 30 TPS compatibility mode.
	 * @param {boolean} compatibilityModeOn True iff in compatibility mode.
	 */
	Runtime.prototype.setCompatibilityMode = function (compatibilityModeOn) {
	    this.compatibilityMode = compatibilityModeOn;
	    if (this._steppingInterval) {
	        self.clearInterval(this._steppingInterval);
	        this.start();
	    }
	};

	/**
	 * Emit glows/glow clears for scripts after a single tick.
	 * Looks at `this.threads` and notices which have turned on/off new glows.
	 * @param {Array.<Thread>=} optExtraThreads Optional list of inactive threads.
	 */
	Runtime.prototype._updateGlows = function (optExtraThreads) {
	    var searchThreads = [];
	    searchThreads.push.apply(searchThreads, this.threads);
	    if (optExtraThreads) {
	        searchThreads.push.apply(searchThreads, optExtraThreads);
	    }
	    // Set of scripts that request a glow this frame.
	    var requestedGlowsThisFrame = [];
	    // Final set of scripts glowing during this frame.
	    var finalScriptGlows = [];
	    // Find all scripts that should be glowing.
	    for (var i = 0; i < searchThreads.length; i++) {
	        var thread = searchThreads[i];
	        var target = thread.target;
	        if (target === this._editingTarget) {
	            var blockForThread = thread.blockGlowInFrame;
	            if (thread.requestScriptGlowInFrame) {
	                var script = target.blocks.getTopLevelScript(blockForThread);
	                if (!script) {
	                    // Attempt to find in flyout blocks.
	                    script = this.flyoutBlocks.getTopLevelScript(
	                        blockForThread
	                    );
	                }
	                if (script) {
	                    requestedGlowsThisFrame.push(script);
	                }
	            }
	        }
	    }
	    // Compare to previous frame.
	    for (var j = 0; j < this._scriptGlowsPreviousFrame.length; j++) {
	        var previousFrameGlow = this._scriptGlowsPreviousFrame[j];
	        if (requestedGlowsThisFrame.indexOf(previousFrameGlow) < 0) {
	            // Glow turned off.
	            this.glowScript(previousFrameGlow, false);
	        } else {
	            // Still glowing.
	            finalScriptGlows.push(previousFrameGlow);
	        }
	    }
	    for (var k = 0; k < requestedGlowsThisFrame.length; k++) {
	        var currentFrameGlow = requestedGlowsThisFrame[k];
	        if (this._scriptGlowsPreviousFrame.indexOf(currentFrameGlow) < 0) {
	            // Glow turned on.
	            this.glowScript(currentFrameGlow, true);
	            finalScriptGlows.push(currentFrameGlow);
	        }
	    }
	    this._scriptGlowsPreviousFrame = finalScriptGlows;
	};

	/**
	 * "Quiet" a script's glow: stop the VM from generating glow/unglow events
	 * about that script. Use when a script has just been deleted, but we may
	 * still be tracking glow data about it.
	 * @param {!string} scriptBlockId Id of top-level block in script to quiet.
	 */
	Runtime.prototype.quietGlow = function (scriptBlockId) {
	    var index = this._scriptGlowsPreviousFrame.indexOf(scriptBlockId);
	    if (index > -1) {
	        this._scriptGlowsPreviousFrame.splice(index, 1);
	    }
	};

	/**
	 * Emit feedback for block glowing (used in the sequencer).
	 * @param {?string} blockId ID for the block to update glow
	 * @param {boolean} isGlowing True to turn on glow; false to turn off.
	 */
	Runtime.prototype.glowBlock = function (blockId, isGlowing) {
	    if (isGlowing) {
	        this.emit(Runtime.BLOCK_GLOW_ON, blockId);
	    } else {
	        this.emit(Runtime.BLOCK_GLOW_OFF, blockId);
	    }
	};

	/**
	 * Emit feedback for script glowing.
	 * @param {?string} topBlockId ID for the top block to update glow
	 * @param {boolean} isGlowing True to turn on glow; false to turn off.
	 */
	Runtime.prototype.glowScript = function (topBlockId, isGlowing) {
	    if (isGlowing) {
	        this.emit(Runtime.SCRIPT_GLOW_ON, topBlockId);
	    } else {
	        this.emit(Runtime.SCRIPT_GLOW_OFF, topBlockId);
	    }
	};

	/**
	 * Emit value for reporter to show in the blocks.
	 * @param {string} blockId ID for the block.
	 * @param {string} value Value to show associated with the block.
	 */
	Runtime.prototype.visualReport = function (blockId, value) {
	    this.emit(Runtime.VISUAL_REPORT, blockId, String(value));
	};

	/**
	 * Emit a sprite info report if the provided target is the editing target.
	 * @param {!Target} target Target to report sprite info for.
	 */
	Runtime.prototype.spriteInfoReport = function (target) {
	    if (target !== this._editingTarget) {
	        return;
	    }
	    this.emit(Runtime.SPRITE_INFO_REPORT, {
	        x: target.x,
	        y: target.y,
	        direction: target.direction,
	        visible: target.visible,
	        rotationStyle: target.rotationStyle
	    });
	};

	/**
	 * Get a target by its id.
	 * @param {string} targetId Id of target to find.
	 * @return {?Target} The target, if found.
	 */
	Runtime.prototype.getTargetById = function (targetId) {
	    for (var i = 0; i < this.targets.length; i++) {
	        var target = this.targets[i];
	        if (target.id === targetId) {
	            return target;
	        }
	    }
	};

	/**
	 * Get the first original (non-clone-block-created) sprite given a name.
	 * @param {string} spriteName Name of sprite to look for.
	 * @return {?Target} Target representing a sprite of the given name.
	 */
	Runtime.prototype.getSpriteTargetByName = function (spriteName) {
	    for (var i = 0; i < this.targets.length; i++) {
	        var target = this.targets[i];
	        if (target.sprite && target.sprite.name === spriteName) {
	            return target;
	        }
	    }
	};

	/**
	 * Update the clone counter to track how many clones are created.
	 * @param {number} changeAmount How many clones have been created/destroyed.
	 */
	Runtime.prototype.changeCloneCounter = function (changeAmount) {
	    this._cloneCounter += changeAmount;
	};

	/**
	 * Return whether there are clones available.
	 * @return {boolean} True until the number of clones hits Runtime.MAX_CLONES.
	 */
	Runtime.prototype.clonesAvailable = function () {
	    return this._cloneCounter < Runtime.MAX_CLONES;
	};

	/**
	 * Get a target representing the Scratch stage, if one exists.
	 * @return {?Target} The target, if found.
	 */
	Runtime.prototype.getTargetForStage = function () {
	    for (var i = 0; i < this.targets.length; i++) {
	        var target = this.targets[i];
	        if (target.isStage) {
	            return target;
	        }
	    }
	};

	/**
	 * Tell the runtime to request a redraw.
	 * Use after a clone/sprite has completed some visible operation on the stage.
	 */
	Runtime.prototype.requestRedraw = function () {
	    this.redrawRequested = true;
	};

	/**
	 * Set up timers to repeatedly step in a browser.
	 */
	Runtime.prototype.start = function () {
	    var interval = Runtime.THREAD_STEP_INTERVAL;
	    if (this.compatibilityMode) {
	        interval = Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY;
	    }
	    this.currentStepTime = interval;
	    this._steppingInterval = self.setInterval(function () {
	        this._step();
	    }.bind(this), interval);
	};

	module.exports = Runtime;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var Timer = __webpack_require__(18);
	var Thread = __webpack_require__(19);
	var execute = __webpack_require__(20);

	var Sequencer = function (runtime) {
	    /**
	     * A utility timer for timing thread sequencing.
	     * @type {!Timer}
	     */
	    this.timer = new Timer();

	    /**
	     * Reference to the runtime owning this sequencer.
	     * @type {!Runtime}
	     */
	    this.runtime = runtime;
	};

	/**
	 * Time to run a warp-mode thread, in ms.
	 * @type {number}
	 */
	Sequencer.WARP_TIME = 500;

	/**
	 * Step through all threads in `this.runtime.threads`, running them in order.
	 * @return {Array.<!Thread>} List of inactive threads after stepping.
	 */
	Sequencer.prototype.stepThreads = function () {
	    // Work time is 75% of the thread stepping interval.
	    var WORK_TIME = 0.75 * this.runtime.currentStepTime;
	    // Start counting toward WORK_TIME.
	    this.timer.start();
	    // Count of active threads.
	    var numActiveThreads = Infinity;
	    // Whether `stepThreads` has run through a full single tick.
	    var ranFirstTick = false;
	    var inactiveThreads = [];
	    // Conditions for continuing to stepping threads:
	    // 1. We must have threads in the list, and some must be active.
	    // 2. Time elapsed must be less than WORK_TIME.
	    // 3. Either turbo mode, or no redraw has been requested by a primitive.
	    while (this.runtime.threads.length > 0 &&
	           numActiveThreads > 0 &&
	           this.timer.timeElapsed() < WORK_TIME &&
	           (this.runtime.turboMode || !this.runtime.redrawRequested)) {
	        numActiveThreads = 0;
	        // Inline copy of the threads, updated on each step.
	        var threadsCopy = this.runtime.threads.slice();
	        // Attempt to run each thread one time.
	        for (var i = 0; i < threadsCopy.length; i++) {
	            var activeThread = threadsCopy[i];
	            if (activeThread.stack.length === 0 ||
	                activeThread.status === Thread.STATUS_DONE) {
	                // Finished with this thread.
	                if (inactiveThreads.indexOf(activeThread) < 0) {
	                    inactiveThreads.push(activeThread);
	                }
	                continue;
	            }
	            if (activeThread.status === Thread.STATUS_YIELD_TICK &&
	                !ranFirstTick) {
	                // Clear single-tick yield from the last call of `stepThreads`.
	                activeThread.status = Thread.STATUS_RUNNING;
	            }
	            if (activeThread.status === Thread.STATUS_RUNNING ||
	                activeThread.status === Thread.STATUS_YIELD) {
	                // Normal-mode thread: step.
	                this.stepThread(activeThread);
	                activeThread.warpTimer = null;
	            }
	            if (activeThread.status === Thread.STATUS_RUNNING) {
	                numActiveThreads++;
	            }
	        }
	        // We successfully ticked once. Prevents running STATUS_YIELD_TICK
	        // threads on the next tick.
	        ranFirstTick = true;
	    }
	    // Filter inactive threads from `this.runtime.threads`.
	    this.runtime.threads = this.runtime.threads.filter(function (thread) {
	        if (inactiveThreads.indexOf(thread) > -1) {
	            return false;
	        }
	        return true;
	    });
	    return inactiveThreads;
	};

	/**
	 * Step the requested thread for as long as necessary.
	 * @param {!Thread} thread Thread object to step.
	 */
	Sequencer.prototype.stepThread = function (thread) {
	    var currentBlockId = thread.peekStack();
	    if (!currentBlockId) {
	        // A "null block" - empty branch.
	        thread.popStack();
	    }
	    while (thread.peekStack()) {
	        var isWarpMode = thread.peekStackFrame().warpMode;
	        if (isWarpMode && !thread.warpTimer) {
	            // Initialize warp-mode timer if it hasn't been already.
	            // This will start counting the thread toward `Sequencer.WARP_TIME`.
	            thread.warpTimer = new Timer();
	            thread.warpTimer.start();
	        }
	        // Execute the current block.
	        // Save the current block ID to notice if we did control flow.
	        currentBlockId = thread.peekStack();
	        execute(this, thread);
	        thread.blockGlowInFrame = currentBlockId;
	        // If the thread has yielded or is waiting, yield to other threads.
	        if (thread.status === Thread.STATUS_YIELD) {
	            // Mark as running for next iteration.
	            thread.status = Thread.STATUS_RUNNING;
	            // In warp mode, yielded blocks are re-executed immediately.
	            if (isWarpMode &&
	                thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME) {
	                continue;
	            }
	            return;
	        } else if (thread.status === Thread.STATUS_PROMISE_WAIT) {
	            // A promise was returned by the primitive. Yield the thread
	            // until the promise resolves. Promise resolution should reset
	            // thread.status to Thread.STATUS_RUNNING.
	            return;
	        }
	        // If no control flow has happened, switch to next block.
	        if (thread.peekStack() === currentBlockId) {
	            thread.goToNextBlock();
	        }
	        // If no next block has been found at this point, look on the stack.
	        while (!thread.peekStack()) {
	            thread.popStack();
	            if (thread.stack.length === 0) {
	                // No more stack to run!
	                thread.status = Thread.STATUS_DONE;
	                return;
	            }
	            if (thread.peekStackFrame().isLoop) {
	                // The current level of the stack is marked as a loop.
	                // Return to yield for the frame/tick in general.
	                // Unless we're in warp mode - then only return if the
	                // warp timer is up.
	                if (!isWarpMode ||
	                    thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
	                    // Don't do anything to the stack, since loops need
	                    // to be re-executed.
	                    return;
	                } else {
	                    // Don't go to the next block for this level of the stack,
	                    // since loops need to be re-executed.
	                    continue;
	                }
	            } else if (thread.peekStackFrame().waitingReporter) {
	                // This level of the stack was waiting for a value.
	                // This means a reporter has just returned - so don't go
	                // to the next block for this level of the stack.
	                return;
	            }
	            // Get next block of existing block on the stack.
	            thread.goToNextBlock();
	        }
	    }
	};

	/**
	 * Step a thread into a block's branch.
	 * @param {!Thread} thread Thread object to step to branch.
	 * @param {Number} branchNum Which branch to step to (i.e., 1, 2).
	 * @param {Boolean} isLoop Whether this block is a loop.
	 */
	Sequencer.prototype.stepToBranch = function (thread, branchNum, isLoop) {
	    if (!branchNum) {
	        branchNum = 1;
	    }
	    var currentBlockId = thread.peekStack();
	    var branchId = thread.target.blocks.getBranch(
	        currentBlockId,
	        branchNum
	    );
	    thread.peekStackFrame().isLoop = isLoop;
	    if (branchId) {
	        // Push branch ID to the thread's stack.
	        thread.pushStack(branchId);
	    } else {
	        thread.pushStack(null);
	    }
	};

	/**
	 * Step a procedure.
	 * @param {!Thread} thread Thread object to step to procedure.
	 * @param {!string} procedureCode Procedure code of procedure to step to.
	 */
	Sequencer.prototype.stepToProcedure = function (thread, procedureCode) {
	    var definition = thread.target.blocks.getProcedureDefinition(procedureCode);
	    if (!definition) {
	        return;
	    }
	    // Check if the call is recursive.
	    // If so, set the thread to yield after pushing.
	    var isRecursive = thread.isRecursiveCall(procedureCode);
	    // To step to a procedure, we put its definition on the stack.
	    // Execution for the thread will proceed through the definition hat
	    // and on to the main definition of the procedure.
	    // When that set of blocks finishes executing, it will be popped
	    // from the stack by the sequencer, returning control to the caller.
	    thread.pushStack(definition);
	    // In known warp-mode threads, only yield when time is up.
	    if (thread.peekStackFrame().warpMode &&
	        thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
	        thread.status = Thread.STATUS_YIELD;
	    } else {
	        // Look for warp-mode flag on definition, and set the thread
	        // to warp-mode if needed.
	        var definitionBlock = thread.target.blocks.getBlock(definition);
	        var doWarp = definitionBlock.mutation.warp;
	        if (doWarp) {
	            thread.peekStackFrame().warpMode = true;
	        } else {
	            // In normal-mode threads, yield any time we have a recursive call.
	            if (isRecursive) {
	                thread.status = Thread.STATUS_YIELD;
	            }
	        }
	    }
	};

	/**
	 * Retire a thread in the middle, without considering further blocks.
	 * @param {!Thread} thread Thread object to retire.
	 */
	Sequencer.prototype.retireThread = function (thread) {
	    thread.stack = [];
	    thread.stackFrame = [];
	    thread.requestScriptGlowInFrame = false;
	    thread.status = Thread.STATUS_DONE;
	};

	module.exports = Sequencer;


/***/ },
/* 18 */
/***/ function(module, exports) {

	/**
	 * @fileoverview
	 * A utility for accurately measuring time.
	 * To use:
	 * ---
	 * var timer = new Timer();
	 * timer.start();
	 * ... pass some time ...
	 * var timeDifference = timer.timeElapsed();
	 * ---
	 * Or, you can use the `time` and `relativeTime`
	 * to do some measurement yourself.
	 */

	/**
	 * @constructor
	 */
	var Timer = function () {};

	/**
	 * Used to store the start time of a timer action.
	 * Updated when calling `timer.start`.
	 */
	Timer.prototype.startTime = 0;

	/**
	 * Return the currently known absolute time, in ms precision.
	 * @returns {number} ms elapsed since 1 January 1970 00:00:00 UTC.
	 */
	Timer.prototype.time = function () {
	    if (Date.now) {
	        return Date.now();
	    } else {
	        return new Date().getTime();
	    }
	};

	/**
	 * Returns a time accurate relative to other times produced by this function.
	 * If possible, will use sub-millisecond precision.
	 * If not, will use millisecond precision.
	 * Not guaranteed to produce the same absolute values per-system.
	 * @returns {number} ms-scale accurate time relative to other relative times.
	 */
	Timer.prototype.relativeTime = function () {
	    if (typeof self !== 'undefined' &&
	        self.performance && 'now' in self.performance) {
	        return self.performance.now();
	    } else {
	        return this.time();
	    }
	};

	/**
	 * Start a timer for measuring elapsed time,
	 * at the most accurate precision possible.
	 */
	Timer.prototype.start = function () {
	    this.startTime = this.relativeTime();
	};

	/**
	 * Check time elapsed since `timer.start` was called.
	 * @returns {number} Time elapsed, in ms (possibly sub-ms precision).
	 */
	Timer.prototype.timeElapsed = function () {
	    return this.relativeTime() - this.startTime;
	};

	module.exports = Timer;


/***/ },
/* 19 */
/***/ function(module, exports) {

	/**
	 * A thread is a running stack context and all the metadata needed.
	 * @param {?string} firstBlock First block to execute in the thread.
	 * @constructor
	 */
	var Thread = function (firstBlock) {
	    /**
	     * ID of top block of the thread
	     * @type {!string}
	     */
	    this.topBlock = firstBlock;

	    /**
	     * Stack for the thread. When the sequencer enters a control structure,
	     * the block is pushed onto the stack so we know where to exit.
	     * @type {Array.<string>}
	     */
	    this.stack = [];

	    /**
	     * Stack frames for the thread. Store metadata for the executing blocks.
	     * @type {Array.<Object>}
	     */
	    this.stackFrames = [];

	    /**
	     * Status of the thread, one of three states (below)
	     * @type {number}
	     */
	    this.status = 0; /* Thread.STATUS_RUNNING */

	    /**
	     * Target of this thread.
	     * @type {?Target}
	     */
	    this.target = null;

	    /**
	     * Whether the thread requests its script to glow during this frame.
	     * @type {boolean}
	     */
	    this.requestScriptGlowInFrame = false;

	    /**
	     * Which block ID should glow during this frame, if any.
	     * @type {?string}
	     */
	    this.blockGlowInFrame = null;

	    /**
	     * A timer for when the thread enters warp mode.
	     * Substitutes the sequencer's count toward WORK_TIME on a per-thread basis.
	     * @type {?Timer}
	     */
	    this.warpTimer = null;
	};

	/**
	 * Thread status for initialized or running thread.
	 * This is the default state for a thread - execution should run normally,
	 * stepping from block to block.
	 * @const
	 */
	Thread.STATUS_RUNNING = 0;

	/**
	 * Threads are in this state when a primitive is waiting on a promise;
	 * execution is paused until the promise changes thread status.
	 * @const
	 */
	Thread.STATUS_PROMISE_WAIT = 1;

	/**
	 * Thread status for yield.
	 * @const
	 */
	Thread.STATUS_YIELD = 2;

	/**
	 * Thread status for a single-tick yield. This will be cleared when the
	 * thread is resumed.
	 * @const
	 */
	Thread.STATUS_YIELD_TICK = 3;

	/**
	 * Thread status for a finished/done thread.
	 * Thread is in this state when there are no more blocks to execute.
	 * @const
	 */
	Thread.STATUS_DONE = 4;

	/**
	 * Push stack and update stack frames appropriately.
	 * @param {string} blockId Block ID to push to stack.
	 */
	Thread.prototype.pushStack = function (blockId) {
	    this.stack.push(blockId);
	    // Push an empty stack frame, if we need one.
	    // Might not, if we just popped the stack.
	    if (this.stack.length > this.stackFrames.length) {
	        // Copy warp mode from any higher level.
	        var warpMode = false;
	        if (this.stackFrames[this.stackFrames.length - 1]) {
	            warpMode = this.stackFrames[this.stackFrames.length - 1].warpMode;
	        }
	        this.stackFrames.push({
	            isLoop: false, // Whether this level of the stack is a loop.
	            warpMode: warpMode, // Whether this level is in warp mode.
	            reported: {}, // Collects reported input values.
	            waitingReporter: null, // Name of waiting reporter.
	            params: {}, // Procedure parameters.
	            executionContext: {} // A context passed to block implementations.
	        });
	    }
	};

	/**
	 * Pop last block on the stack and its stack frame.
	 * @return {string} Block ID popped from the stack.
	 */
	Thread.prototype.popStack = function () {
	    this.stackFrames.pop();
	    return this.stack.pop();
	};

	/**
	 * Get top stack item.
	 * @return {?string} Block ID on top of stack.
	 */
	Thread.prototype.peekStack = function () {
	    return this.stack[this.stack.length - 1];
	};


	/**
	 * Get top stack frame.
	 * @return {?Object} Last stack frame stored on this thread.
	 */
	Thread.prototype.peekStackFrame = function () {
	    return this.stackFrames[this.stackFrames.length - 1];
	};

	/**
	 * Get stack frame above the current top.
	 * @return {?Object} Second to last stack frame stored on this thread.
	 */
	Thread.prototype.peekParentStackFrame = function () {
	    return this.stackFrames[this.stackFrames.length - 2];
	};

	/**
	 * Push a reported value to the parent of the current stack frame.
	 * @param {*} value Reported value to push.
	 */
	Thread.prototype.pushReportedValue = function (value) {
	    var parentStackFrame = this.peekParentStackFrame();
	    if (parentStackFrame) {
	        var waitingReporter = parentStackFrame.waitingReporter;
	        parentStackFrame.reported[waitingReporter] = value;
	    }
	};

	/**
	 * Add a parameter to the stack frame.
	 * Use when calling a procedure with parameter values.
	 * @param {!string} paramName Name of parameter.
	 * @param {*} value Value to set for parameter.
	 */
	Thread.prototype.pushParam = function (paramName, value) {
	    var stackFrame = this.peekStackFrame();
	    stackFrame.params[paramName] = value;
	};

	/**
	 * Get a parameter at the lowest possible level of the stack.
	 * @param {!string} paramName Name of parameter.
	 * @return {*} value Value for parameter.
	 */
	Thread.prototype.getParam = function (paramName) {
	    for (var i = this.stackFrames.length - 1; i >= 0; i--) {
	        var frame = this.stackFrames[i];
	        if (frame.params.hasOwnProperty(paramName)) {
	            return frame.params[paramName];
	        }
	    }
	    return null;
	};

	/**
	 * Whether the current execution of a thread is at the top of the stack.
	 * @return {Boolean} True if execution is at top of the stack.
	 */
	Thread.prototype.atStackTop = function () {
	    return this.peekStack() === this.topBlock;
	};


	/**
	 * Switch the thread to the next block at the current level of the stack.
	 * For example, this is used in a standard sequence of blocks,
	 * where execution proceeds from one block to the next.
	 */
	Thread.prototype.goToNextBlock = function () {
	    var nextBlockId = this.target.blocks.getNextBlock(this.peekStack());
	    // Copy warp mode to next block.
	    var warpMode = this.peekStackFrame().warpMode;
	    // The current block is on the stack - pop it and push the next.
	    // Note that this could push `null` - that is handled by the sequencer.
	    this.popStack();
	    this.pushStack(nextBlockId);
	    if (this.peekStackFrame()) {
	        this.peekStackFrame().warpMode = warpMode;
	    }
	};

	/**
	 * Attempt to determine whether a procedure call is recursive,
	 * by examining the stack.
	 * @param {!string} procedureCode Procedure code of procedure being called.
	 * @return {boolean} True if the call appears recursive.
	 */
	Thread.prototype.isRecursiveCall = function (procedureCode) {
	    var callCount = 5; // Max number of enclosing procedure calls to examine.
	    var sp = this.stack.length - 1;
	    for (var i = sp - 1; i >= 0; i--) {
	        var block = this.target.blocks.getBlock(this.stack[i]);
	        if (block.opcode === 'procedures_callnoreturn' &&
	            block.mutation.proccode === procedureCode) {
	            return true;
	        }
	        if (--callCount < 0) return false;
	    }
	    return false;
	};

	module.exports = Thread;


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var log = __webpack_require__(21);
	var Thread = __webpack_require__(19);

	/**
	 * Utility function to determine if a value is a Promise.
	 * @param {*} value Value to check for a Promise.
	 * @return {Boolean} True if the value appears to be a Promise.
	 */
	var isPromise = function (value) {
	    return value && value.then && typeof value.then === 'function';
	};

	/**
	 * Execute a block.
	 * @param {!Sequencer} sequencer Which sequencer is executing.
	 * @param {!Thread} thread Thread which to read and execute.
	 */
	var execute = function (sequencer, thread) {
	    var runtime = sequencer.runtime;
	    var target = thread.target;

	    // Current block to execute is the one on the top of the stack.
	    var currentBlockId = thread.peekStack();
	    var currentStackFrame = thread.peekStackFrame();

	    // Check where the block lives: target blocks or flyout blocks.
	    var targetHasBlock = (
	        typeof target.blocks.getBlock(currentBlockId) !== 'undefined'
	    );
	    var flyoutHasBlock = (
	        typeof runtime.flyoutBlocks.getBlock(currentBlockId) !== 'undefined'
	    );

	    // Stop if block or target no longer exists.
	    if (!target || (!targetHasBlock && !flyoutHasBlock)) {
	        // No block found: stop the thread; script no longer exists.
	        sequencer.retireThread(thread);
	        return;
	    }

	    // Query info about the block.
	    var blockContainer = null;
	    if (targetHasBlock) {
	        blockContainer = target.blocks;
	    } else {
	        blockContainer = runtime.flyoutBlocks;
	    }
	    var opcode = blockContainer.getOpcode(currentBlockId);
	    var fields = blockContainer.getFields(currentBlockId);
	    var inputs = blockContainer.getInputs(currentBlockId);
	    var blockFunction = runtime.getOpcodeFunction(opcode);
	    var isHat = runtime.getIsHat(opcode);


	    if (!opcode) {
	        log.warn('Could not get opcode for block: ' + currentBlockId);
	        return;
	    }

	    /**
	     * Handle any reported value from the primitive, either directly returned
	     * or after a promise resolves.
	     * @param {*} resolvedValue Value eventually returned from the primitive.
	     */
	    var handleReport = function (resolvedValue) {
	        thread.pushReportedValue(resolvedValue);
	        if (isHat) {
	            // Hat predicate was evaluated.
	            if (runtime.getIsEdgeActivatedHat(opcode)) {
	                // If this is an edge-activated hat, only proceed if
	                // the value is true and used to be false.
	                var oldEdgeValue = runtime.updateEdgeActivatedValue(
	                    currentBlockId,
	                    resolvedValue
	                );
	                var edgeWasActivated = !oldEdgeValue && resolvedValue;
	                if (!edgeWasActivated) {
	                    sequencer.retireThread(thread);
	                }
	            } else {
	                // Not an edge-activated hat: retire the thread
	                // if predicate was false.
	                if (!resolvedValue) {
	                    sequencer.retireThread(thread);
	                }
	            }
	        } else {
	            // In a non-hat, report the value visually if necessary if
	            // at the top of the thread stack.
	            if (typeof resolvedValue !== 'undefined' && thread.atStackTop()) {
	                runtime.visualReport(currentBlockId, resolvedValue);
	            }
	            // Finished any yields.
	            thread.status = Thread.STATUS_RUNNING;
	        }
	    };

	    // Hats and single-field shadows are implemented slightly differently
	    // from regular blocks.
	    // For hats: if they have an associated block function,
	    // it's treated as a predicate; if not, execution will proceed as a no-op.
	    // For single-field shadows: If the block has a single field, and no inputs,
	    // immediately return the value of the field.
	    if (!blockFunction) {
	        if (isHat) {
	            // Skip through the block (hat with no predicate).
	            return;
	        } else {
	            if (Object.keys(fields).length === 1 &&
	                Object.keys(inputs).length === 0) {
	                // One field and no inputs - treat as arg.
	                for (var fieldKey in fields) { // One iteration.
	                    handleReport(fields[fieldKey].value);
	                }
	            } else {
	                log.warn('Could not get implementation for opcode: ' +
	                    opcode);
	            }
	            thread.requestScriptGlowInFrame = true;
	            return;
	        }
	    }

	    // Generate values for arguments (inputs).
	    var argValues = {};

	    // Add all fields on this block to the argValues.
	    for (var fieldName in fields) {
	        argValues[fieldName] = fields[fieldName].value;
	    }

	    // Recursively evaluate input blocks.
	    for (var inputName in inputs) {
	        var input = inputs[inputName];
	        var inputBlockId = input.block;
	        // Is there no value for this input waiting in the stack frame?
	        if (typeof currentStackFrame.reported[inputName] === 'undefined' &&
	            inputBlockId) {
	            // If there's not, we need to evaluate the block.
	            // Push to the stack to evaluate the reporter block.
	            thread.pushStack(inputBlockId);
	            // Save name of input for `Thread.pushReportedValue`.
	            currentStackFrame.waitingReporter = inputName;
	            // Actually execute the block.
	            execute(sequencer, thread);
	            if (thread.status === Thread.STATUS_PROMISE_WAIT) {
	                return;
	            } else {
	                // Execution returned immediately,
	                // and presumably a value was reported, so pop the stack.
	                currentStackFrame.waitingReporter = null;
	                thread.popStack();
	            }
	        }
	        argValues[inputName] = currentStackFrame.reported[inputName];
	    }

	    // Add any mutation to args (e.g., for procedures).
	    var mutation = blockContainer.getMutation(currentBlockId);
	    if (mutation) {
	        argValues.mutation = mutation;
	    }

	    // If we've gotten this far, all of the input blocks are evaluated,
	    // and `argValues` is fully populated. So, execute the block primitive.
	    // First, clear `currentStackFrame.reported`, so any subsequent execution
	    // (e.g., on return from a branch) gets fresh inputs.
	    currentStackFrame.reported = {};

	    var primitiveReportedValue = null;
	    primitiveReportedValue = blockFunction(argValues, {
	        stackFrame: currentStackFrame.executionContext,
	        target: target,
	        yield: function () {
	            thread.status = Thread.STATUS_YIELD;
	        },
	        startBranch: function (branchNum, isLoop) {
	            sequencer.stepToBranch(thread, branchNum, isLoop);
	        },
	        stopAll: function () {
	            runtime.stopAll();
	        },
	        stopOtherTargetThreads: function () {
	            runtime.stopForTarget(target, thread);
	        },
	        stopThread: function () {
	            sequencer.retireThread(thread);
	        },
	        startProcedure: function (procedureCode) {
	            sequencer.stepToProcedure(thread, procedureCode);
	        },
	        getProcedureParamNames: function (procedureCode) {
	            return blockContainer.getProcedureParamNames(procedureCode);
	        },
	        pushParam: function (paramName, paramValue) {
	            thread.pushParam(paramName, paramValue);
	        },
	        getParam: function (paramName) {
	            return thread.getParam(paramName);
	        },
	        startHats: function (requestedHat, optMatchFields, optTarget) {
	            return (
	                runtime.startHats(requestedHat, optMatchFields, optTarget)
	            );
	        },
	        ioQuery: function (device, func, args) {
	            // Find the I/O device and execute the query/function call.
	            if (runtime.ioDevices[device] && runtime.ioDevices[device][func]) {
	                var devObject = runtime.ioDevices[device];
	                // @todo Figure out why eslint complains about no-useless-call
	                // no-useless-call can't tell if the call is useless for dynamic
	                // expressions... or something. Not exactly sure why it
	                // complains here.
	                // eslint-disable-next-line no-useless-call
	                return devObject[func].call(devObject, args);
	            }
	        }
	    });

	    if (typeof primitiveReportedValue === 'undefined') {
	        // No value reported - potentially a command block.
	        // Edge-activated hats don't request a glow; all commands do.
	        thread.requestScriptGlowInFrame = true;
	    }

	    // If it's a promise, wait until promise resolves.
	    if (isPromise(primitiveReportedValue)) {
	        if (thread.status === Thread.STATUS_RUNNING) {
	            // Primitive returned a promise; automatically yield thread.
	            thread.status = Thread.STATUS_PROMISE_WAIT;
	        }
	        // Promise handlers
	        primitiveReportedValue.then(function (resolvedValue) {
	            handleReport(resolvedValue);
	            if (typeof resolvedValue === 'undefined') {
	                var popped = thread.popStack();
	                var nextBlockId = thread.target.blocks.getNextBlock(popped);
	                thread.pushStack(nextBlockId);
	            } else {
	                thread.popStack();
	            }
	        }, function (rejectionReason) {
	            // Promise rejected: the primitive had some error.
	            // Log it and proceed.
	            log.warn('Primitive rejected promise: ', rejectionReason);
	            thread.status = Thread.STATUS_RUNNING;
	            thread.popStack();
	        });
	    } else if (thread.status === Thread.STATUS_RUNNING) {
	        handleReport(primitiveReportedValue);
	    }
	};

	module.exports = execute;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var minilog = __webpack_require__(22);
	minilog.enable();

	module.exports = minilog('vm');


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var Minilog = __webpack_require__(23);

	var oldEnable = Minilog.enable,
	    oldDisable = Minilog.disable,
	    isChrome = (typeof navigator != 'undefined' && /chrome/i.test(navigator.userAgent)),
	    console = __webpack_require__(27);

	// Use a more capable logging backend if on Chrome
	Minilog.defaultBackend = (isChrome ? console.minilog : console);

	// apply enable inputs from localStorage and from the URL
	if(typeof window != 'undefined') {
	  try {
	    Minilog.enable(JSON.parse(window.localStorage['minilogSettings']));
	  } catch(e) {}
	  if(window.location && window.location.search) {
	    var match = RegExp('[?&]minilog=([^&]*)').exec(window.location.search);
	    match && Minilog.enable(decodeURIComponent(match[1]));
	  }
	}

	// Make enable also add to localStorage
	Minilog.enable = function() {
	  oldEnable.call(Minilog, true);
	  try { window.localStorage['minilogSettings'] = JSON.stringify(true); } catch(e) {}
	  return this;
	};

	Minilog.disable = function() {
	  oldDisable.call(Minilog);
	  try { delete window.localStorage.minilogSettings; } catch(e) {}
	  return this;
	};

	exports = module.exports = Minilog;

	exports.backends = {
	  array: __webpack_require__(31),
	  browser: Minilog.defaultBackend,
	  localStorage: __webpack_require__(32),
	  jQuery: __webpack_require__(33)
	};


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24),
	    Filter = __webpack_require__(26);

	var log = new Transform(),
	    slice = Array.prototype.slice;

	exports = module.exports = function create(name) {
	  var o   = function() { log.write(name, undefined, slice.call(arguments)); return o; };
	  o.debug = function() { log.write(name, 'debug', slice.call(arguments)); return o; };
	  o.info  = function() { log.write(name, 'info',  slice.call(arguments)); return o; };
	  o.warn  = function() { log.write(name, 'warn',  slice.call(arguments)); return o; };
	  o.error = function() { log.write(name, 'error', slice.call(arguments)); return o; };
	  o.log   = o.debug; // for interface compliance with Node and browser consoles
	  o.suggest = exports.suggest;
	  o.format = log.format;
	  return o;
	};

	// filled in separately
	exports.defaultBackend = exports.defaultFormatter = null;

	exports.pipe = function(dest) {
	  return log.pipe(dest);
	};

	exports.end = exports.unpipe = exports.disable = function(from) {
	  return log.unpipe(from);
	};

	exports.Transform = Transform;
	exports.Filter = Filter;
	// this is the default filter that's applied when .enable() is called normally
	// you can bypass it completely and set up your own pipes
	exports.suggest = new Filter();

	exports.enable = function() {
	  if(exports.defaultFormatter) {
	    return log.pipe(exports.suggest) // filter
	              .pipe(exports.defaultFormatter) // formatter
	              .pipe(exports.defaultBackend); // backend
	  }
	  return log.pipe(exports.suggest) // filter
	            .pipe(exports.defaultBackend); // formatter
	};



/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var microee = __webpack_require__(25);

	// Implements a subset of Node's stream.Transform - in a cross-platform manner.
	function Transform() {}

	microee.mixin(Transform);

	// The write() signature is different from Node's
	// --> makes it much easier to work with objects in logs.
	// One of the lessons from v1 was that it's better to target
	// a good browser rather than the lowest common denominator
	// internally.
	// If you want to use external streams, pipe() to ./stringify.js first.
	Transform.prototype.write = function(name, level, args) {
	  this.emit('item', name, level, args);
	};

	Transform.prototype.end = function() {
	  this.emit('end');
	  this.removeAllListeners();
	};

	Transform.prototype.pipe = function(dest) {
	  var s = this;
	  // prevent double piping
	  s.emit('unpipe', dest);
	  // tell the dest that it's being piped to
	  dest.emit('pipe', s);

	  function onItem() {
	    dest.write.apply(dest, Array.prototype.slice.call(arguments));
	  }
	  function onEnd() { !dest._isStdio && dest.end(); }

	  s.on('item', onItem);
	  s.on('end', onEnd);

	  s.when('unpipe', function(from) {
	    var match = (from === dest) || typeof from == 'undefined';
	    if(match) {
	      s.removeListener('item', onItem);
	      s.removeListener('end', onEnd);
	      dest.emit('unpipe');
	    }
	    return match;
	  });

	  return dest;
	};

	Transform.prototype.unpipe = function(from) {
	  this.emit('unpipe', from);
	  return this;
	};

	Transform.prototype.format = function(dest) {
	  throw new Error([
	    'Warning: .format() is deprecated in Minilog v2! Use .pipe() instead. For example:',
	    'var Minilog = require(\'minilog\');',
	    'Minilog',
	    '  .pipe(Minilog.backends.console.formatClean)',
	    '  .pipe(Minilog.backends.console);'].join('\n'));
	};

	Transform.mixin = function(dest) {
	  var o = Transform.prototype, k;
	  for (k in o) {
	    o.hasOwnProperty(k) && (dest.prototype[k] = o[k]);
	  }
	};

	module.exports = Transform;


/***/ },
/* 25 */
/***/ function(module, exports) {

	function M() { this._events = {}; }
	M.prototype = {
	  on: function(ev, cb) {
	    this._events || (this._events = {});
	    var e = this._events;
	    (e[ev] || (e[ev] = [])).push(cb);
	    return this;
	  },
	  removeListener: function(ev, cb) {
	    var e = this._events[ev] || [], i;
	    for(i = e.length-1; i >= 0 && e[i]; i--){
	      if(e[i] === cb || e[i].cb === cb) { e.splice(i, 1); }
	    }
	  },
	  removeAllListeners: function(ev) {
	    if(!ev) { this._events = {}; }
	    else { this._events[ev] && (this._events[ev] = []); }
	  },
	  emit: function(ev) {
	    this._events || (this._events = {});
	    var args = Array.prototype.slice.call(arguments, 1), i, e = this._events[ev] || [];
	    for(i = e.length-1; i >= 0 && e[i]; i--){
	      e[i].apply(this, args);
	    }
	    return this;
	  },
	  when: function(ev, cb) {
	    return this.once(ev, cb, true);
	  },
	  once: function(ev, cb, when) {
	    if(!cb) return this;
	    function c() {
	      if(!when) this.removeListener(ev, c);
	      if(cb.apply(this, arguments) && when) this.removeListener(ev, c);
	    }
	    c.cb = cb;
	    this.on(ev, c);
	    return this;
	  }
	};
	M.mixin = function(dest) {
	  var o = M.prototype, k;
	  for (k in o) {
	    o.hasOwnProperty(k) && (dest.prototype[k] = o[k]);
	  }
	};
	module.exports = M;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	// default filter
	var Transform = __webpack_require__(24);

	var levelMap = { debug: 1, info: 2, warn: 3, error: 4 };

	function Filter() {
	  this.enabled = true;
	  this.defaultResult = true;
	  this.clear();
	}

	Transform.mixin(Filter);

	// allow all matching, with level >= given level
	Filter.prototype.allow = function(name, level) {
	  this._white.push({ n: name, l: levelMap[level] });
	  return this;
	};

	// deny all matching, with level <= given level
	Filter.prototype.deny = function(name, level) {
	  this._black.push({ n: name, l: levelMap[level] });
	  return this;
	};

	Filter.prototype.clear = function() {
	  this._white = [];
	  this._black = [];
	  return this;
	};

	function test(rule, name) {
	  // use .test for RegExps
	  return (rule.n.test ? rule.n.test(name) : rule.n == name);
	};

	Filter.prototype.test = function(name, level) {
	  var i, len = Math.max(this._white.length, this._black.length);
	  for(i = 0; i < len; i++) {
	    if(this._white[i] && test(this._white[i], name) && levelMap[level] >= this._white[i].l) {
	      return true;
	    }
	    if(this._black[i] && test(this._black[i], name) && levelMap[level] < this._black[i].l) {
	      return false;
	    }
	  }
	  return this.defaultResult;
	};

	Filter.prototype.write = function(name, level, args) {
	  if(!this.enabled || this.test(name, level)) {
	    return this.emit('item', name, level, args);
	  }
	};

	module.exports = Filter;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24);

	var newlines = /\n+$/,
	    logger = new Transform();

	logger.write = function(name, level, args) {
	  var i = args.length-1;
	  if (typeof console === 'undefined' || !console.log) {
	    return;
	  }
	  if(console.log.apply) {
	    return console.log.apply(console, [name, level].concat(args));
	  } else if(JSON && JSON.stringify) {
	    // console.log.apply is undefined in IE8 and IE9
	    // for IE8/9: make console.log at least a bit less awful
	    if(args[i] && typeof args[i] == 'string') {
	      args[i] = args[i].replace(newlines, '');
	    }
	    try {
	      for(i = 0; i < args.length; i++) {
	        args[i] = JSON.stringify(args[i]);
	      }
	    } catch(e) {}
	    console.log(args.join(' '));
	  }
	};

	logger.formatters = ['color', 'minilog'];
	logger.color = __webpack_require__(28);
	logger.minilog = __webpack_require__(30);

	module.exports = logger;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24),
	    color = __webpack_require__(29);

	var colors = { debug: ['cyan'], info: ['purple' ], warn: [ 'yellow', true ], error: [ 'red', true ] },
	    logger = new Transform();

	logger.write = function(name, level, args) {
	  var fn = console.log;
	  if(console[level] && console[level].apply) {
	    fn = console[level];
	    fn.apply(console, [ '%c'+name+' %c'+level, color('gray'), color.apply(color, colors[level])].concat(args));
	  }
	};

	// NOP, because piping the formatted logs can only cause trouble.
	logger.pipe = function() { };

	module.exports = logger;


/***/ },
/* 29 */
/***/ function(module, exports) {

	var hex = {
	  black: '#000',
	  red: '#c23621',
	  green: '#25bc26',
	  yellow: '#bbbb00',
	  blue:  '#492ee1',
	  magenta: '#d338d3',
	  cyan: '#33bbc8',
	  gray: '#808080',
	  purple: '#708'
	};
	function color(fg, isInverse) {
	  if(isInverse) {
	    return 'color: #fff; background: '+hex[fg]+';';
	  } else {
	    return 'color: '+hex[fg]+';';
	  }
	}

	module.exports = color;


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24),
	    color = __webpack_require__(29),
	    colors = { debug: ['gray'], info: ['purple' ], warn: [ 'yellow', true ], error: [ 'red', true ] },
	    logger = new Transform();

	logger.write = function(name, level, args) {
	  var fn = console.log;
	  if(level != 'debug' && console[level]) {
	    fn = console[level];
	  }

	  var subset = [], i = 0;
	  if(level != 'info') {
	    for(; i < args.length; i++) {
	      if(typeof args[i] != 'string') break;
	    }
	    fn.apply(console, [ '%c'+name +' '+ args.slice(0, i).join(' '), color.apply(color, colors[level]) ].concat(args.slice(i)));
	  } else {
	    fn.apply(console, [ '%c'+name, color.apply(color, colors[level]) ].concat(args));
	  }
	};

	// NOP, because piping the formatted logs can only cause trouble.
	logger.pipe = function() { };

	module.exports = logger;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24),
	    cache = [ ];

	var logger = new Transform();

	logger.write = function(name, level, args) {
	  cache.push([ name, level, args ]);
	};

	// utility functions
	logger.get = function() { return cache; };
	logger.empty = function() { cache = []; };

	module.exports = logger;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24),
	    cache = false;

	var logger = new Transform();

	logger.write = function(name, level, args) {
	  if(typeof window == 'undefined' || typeof JSON == 'undefined' || !JSON.stringify || !JSON.parse) return;
	  try {
	    if(!cache) { cache = (window.localStorage.minilog ? JSON.parse(window.localStorage.minilog) : []); }
	    cache.push([ new Date().toString(), name, level, args ]);
	    window.localStorage.minilog = JSON.stringify(cache);
	  } catch(e) {}
	};

	module.exports = logger;

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var Transform = __webpack_require__(24);

	var cid = new Date().valueOf().toString(36);

	function AjaxLogger(options) {
	  this.url = options.url || '';
	  this.cache = [];
	  this.timer = null;
	  this.interval = options.interval || 30*1000;
	  this.enabled = true;
	  this.jQuery = window.jQuery;
	  this.extras = {};
	}

	Transform.mixin(AjaxLogger);

	AjaxLogger.prototype.write = function(name, level, args) {
	  if(!this.timer) { this.init(); }
	  this.cache.push([name, level].concat(args));
	};

	AjaxLogger.prototype.init = function() {
	  if(!this.enabled || !this.jQuery) return;
	  var self = this;
	  this.timer = setTimeout(function() {
	    var i, logs = [], ajaxData, url = self.url;
	    if(self.cache.length == 0) return self.init();
	    // Test each log line and only log the ones that are valid (e.g. don't have circular references).
	    // Slight performance hit but benefit is we log all valid lines.
	    for(i = 0; i < self.cache.length; i++) {
	      try {
	        JSON.stringify(self.cache[i]);
	        logs.push(self.cache[i]);
	      } catch(e) { }
	    }
	    if(self.jQuery.isEmptyObject(self.extras)) {
	        ajaxData = JSON.stringify({ logs: logs });
	        url = self.url + '?client_id=' + cid;
	    } else {
	        ajaxData = JSON.stringify(self.jQuery.extend({logs: logs}, self.extras));
	    }

	    self.jQuery.ajax(url, {
	      type: 'POST',
	      cache: false,
	      processData: false,
	      data: ajaxData,
	      contentType: 'application/json',
	      timeout: 10000
	    }).success(function(data, status, jqxhr) {
	      if(data.interval) {
	        self.interval = Math.max(1000, data.interval);
	      }
	    }).error(function() {
	      self.interval = 30000;
	    }).always(function() {
	      self.init();
	    });
	    self.cache = [];
	  }, this.interval);
	};

	AjaxLogger.prototype.end = function() {};

	// wait until jQuery is defined. Useful if you don't control the load order.
	AjaxLogger.jQueryWait = function(onDone) {
	  if(typeof window !== 'undefined' && (window.jQuery || window.$)) {
	    return onDone(window.jQuery || window.$);
	  } else if (typeof window !== 'undefined') {
	    setTimeout(function() { AjaxLogger.jQueryWait(onDone); }, 200);
	  }
	};

	module.exports = AjaxLogger;


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var adapter = __webpack_require__(35);
	var mutationAdapter = __webpack_require__(36);
	var xmlEscape = __webpack_require__(88);

	/**
	 * @fileoverview
	 * Store and mutate the VM block representation,
	 * and handle updates from Scratch Blocks events.
	 */

	var Blocks = function () {
	    /**
	     * All blocks in the workspace.
	     * Keys are block IDs, values are metadata about the block.
	     * @type {Object.<string, Object>}
	     */
	    this._blocks = {};

	    /**
	     * All top-level scripts in the workspace.
	     * A list of block IDs that represent scripts (i.e., first block in script).
	     * @type {Array.<String>}
	     */
	    this._scripts = [];
	};

	/**
	 * Blockly inputs that represent statements/branch.
	 * are prefixed with this string.
	 * @const{string}
	 */
	Blocks.BRANCH_INPUT_PREFIX = 'SUBSTACK';

	/**
	 * Provide an object with metadata for the requested block ID.
	 * @param {!string} blockId ID of block we have stored.
	 * @return {?Object} Metadata about the block, if it exists.
	 */
	Blocks.prototype.getBlock = function (blockId) {
	    return this._blocks[blockId];
	};

	/**
	 * Get all known top-level blocks that start scripts.
	 * @return {Array.<string>} List of block IDs.
	 */
	Blocks.prototype.getScripts = function () {
	    return this._scripts;
	};

	 /**
	  * Get the next block for a particular block
	  * @param {?string} id ID of block to get the next block for
	  * @return {?string} ID of next block in the sequence
	  */
	Blocks.prototype.getNextBlock = function (id) {
	    if (typeof this._blocks[id] === 'undefined') return null;
	    return this._blocks[id].next;
	};

	/**
	 * Get the branch for a particular C-shaped block.
	 * @param {?string} id ID for block to get the branch for.
	 * @param {?number} branchNum Which branch to select (e.g. for if-else).
	 * @return {?string} ID of block in the branch.
	 */
	Blocks.prototype.getBranch = function (id, branchNum) {
	    var block = this._blocks[id];
	    if (typeof block === 'undefined') return null;
	    if (!branchNum) branchNum = 1;

	    var inputName = Blocks.BRANCH_INPUT_PREFIX;
	    if (branchNum > 1) {
	        inputName += branchNum;
	    }

	    // Empty C-block?
	    if (!(inputName in block.inputs)) return null;
	    return block.inputs[inputName].block;
	};

	/**
	 * Get the opcode for a particular block
	 * @param {?string} id ID of block to query
	 * @return {?string} the opcode corresponding to that block
	 */
	Blocks.prototype.getOpcode = function (id) {
	    if (typeof this._blocks[id] === 'undefined') return null;
	    return this._blocks[id].opcode;
	};

	/**
	 * Get all fields and their values for a block.
	 * @param {?string} id ID of block to query.
	 * @return {!Object} All fields and their values.
	 */
	Blocks.prototype.getFields = function (id) {
	    if (typeof this._blocks[id] === 'undefined') return null;
	    return this._blocks[id].fields;
	};

	/**
	 * Get all non-branch inputs for a block.
	 * @param {?string} id ID of block to query.
	 * @return {!Object} All non-branch inputs and their associated blocks.
	 */
	Blocks.prototype.getInputs = function (id) {
	    if (typeof this._blocks[id] === 'undefined') return null;
	    var inputs = {};
	    for (var input in this._blocks[id].inputs) {
	        // Ignore blocks prefixed with branch prefix.
	        if (input.substring(0, Blocks.BRANCH_INPUT_PREFIX.length) !==
	            Blocks.BRANCH_INPUT_PREFIX) {
	            inputs[input] = this._blocks[id].inputs[input];
	        }
	    }
	    return inputs;
	};

	/**
	 * Get mutation data for a block.
	 * @param {?string} id ID of block to query.
	 * @return {!Object} Mutation for the block.
	 */
	Blocks.prototype.getMutation = function (id) {
	    if (typeof this._blocks[id] === 'undefined') return null;
	    return this._blocks[id].mutation;
	};

	/**
	 * Get the top-level script for a given block.
	 * @param {?string} id ID of block to query.
	 * @return {?string} ID of top-level script block.
	 */
	Blocks.prototype.getTopLevelScript = function (id) {
	    if (typeof this._blocks[id] === 'undefined') return null;
	    var block = this._blocks[id];
	    while (block.parent !== null) {
	        block = this._blocks[block.parent];
	    }
	    return block.id;
	};

	/**
	 * Get the procedure definition for a given name.
	 * @param {?string} name Name of procedure to query.
	 * @return {?string} ID of procedure definition.
	 */
	Blocks.prototype.getProcedureDefinition = function (name) {
	    for (var id in this._blocks) {
	        var block = this._blocks[id];
	        if ((block.opcode === 'procedures_defnoreturn' ||
	            block.opcode === 'procedures_defreturn') &&
	            block.mutation.proccode === name) {
	            return id;
	        }
	    }
	    return null;
	};

	/**
	 * Get the procedure definition for a given name.
	 * @param {?string} name Name of procedure to query.
	 * @return {?string} ID of procedure definition.
	 */
	Blocks.prototype.getProcedureParamNames = function (name) {
	    for (var id in this._blocks) {
	        var block = this._blocks[id];
	        if ((block.opcode === 'procedures_defnoreturn' ||
	            block.opcode === 'procedures_defreturn') &&
	            block.mutation.proccode === name) {
	            return JSON.parse(block.mutation.argumentnames);
	        }
	    }
	    return null;
	};

	// ---------------------------------------------------------------------

	/**
	 * Create event listener for blocks. Handles validation and serves as a generic
	 * adapter between the blocks and the runtime interface.
	 * @param {Object} e Blockly "block" event
	 * @param {?Runtime} optRuntime Optional runtime to forward click events to.
	 */

	Blocks.prototype.blocklyListen = function (e, optRuntime) {
	    // Validate event
	    if (typeof e !== 'object') return;
	    if (typeof e.blockId !== 'string') return;

	    // UI event: clicked scripts toggle in the runtime.
	    if (e.element === 'stackclick') {
	        if (optRuntime) {
	            optRuntime.toggleScript(e.blockId);
	        }
	        return;
	    }

	    // Block create/update/destroy
	    switch (e.type) {
	    case 'create':
	        var newBlocks = adapter(e);
	        // A create event can create many blocks. Add them all.
	        for (var i = 0; i < newBlocks.length; i++) {
	            this.createBlock(newBlocks[i]);
	        }
	        break;
	    case 'change':
	        this.changeBlock({
	            id: e.blockId,
	            element: e.element,
	            name: e.name,
	            value: e.newValue
	        });
	        break;
	    case 'move':
	        this.moveBlock({
	            id: e.blockId,
	            oldParent: e.oldParentId,
	            oldInput: e.oldInputName,
	            newParent: e.newParentId,
	            newInput: e.newInputName,
	            newCoordinate: e.newCoordinate
	        });
	        break;
	    case 'delete':
	        // Don't accept delete events for missing blocks,
	        // or shadow blocks being obscured.
	        if (!this._blocks.hasOwnProperty(e.blockId) ||
	            this._blocks[e.blockId].shadow) {
	            return;
	        }
	        // Inform any runtime to forget about glows on this script.
	        if (optRuntime && this._blocks[e.blockId].topLevel) {
	            optRuntime.quietGlow(e.blockId);
	        }
	        this.deleteBlock({
	            id: e.blockId
	        });
	        break;
	    }
	};

	// ---------------------------------------------------------------------

	/**
	 * Block management: create blocks and scripts from a `create` event
	 * @param {!Object} block Blockly create event to be processed
	 */
	Blocks.prototype.createBlock = function (block) {
	    // Does the block already exist?
	    // Could happen, e.g., for an unobscured shadow.
	    if (this._blocks.hasOwnProperty(block.id)) {
	        return;
	    }
	    // Create new block.
	    this._blocks[block.id] = block;
	    // Push block id to scripts array.
	    // Blocks are added as a top-level stack if they are marked as a top-block
	    // (if they were top-level XML in the event).
	    if (block.topLevel) {
	        this._addScript(block.id);
	    }
	};

	/**
	 * Block management: change block field values
	 * @param {!Object} args Blockly change event to be processed
	 */
	Blocks.prototype.changeBlock = function (args) {
	    // Validate
	    if (args.element !== 'field' && args.element !== 'mutation') return;
	    if (typeof this._blocks[args.id] === 'undefined') return;

	    if (args.element === 'field') {
	        // Update block value
	        if (!this._blocks[args.id].fields[args.name]) return;
	        this._blocks[args.id].fields[args.name].value = args.value;
	    } else if (args.element === 'mutation') {
	        this._blocks[args.id].mutation = mutationAdapter(args.value);
	    }
	};

	/**
	 * Block management: move blocks from parent to parent
	 * @param {!Object} e Blockly move event to be processed
	 */
	Blocks.prototype.moveBlock = function (e) {
	    if (!this._blocks.hasOwnProperty(e.id)) {
	        return;
	    }

	    // Move coordinate changes.
	    if (e.newCoordinate) {
	        this._blocks[e.id].x = e.newCoordinate.x;
	        this._blocks[e.id].y = e.newCoordinate.y;
	    }

	    // Remove from any old parent.
	    if (typeof e.oldParent !== 'undefined') {
	        var oldParent = this._blocks[e.oldParent];
	        if (typeof e.oldInput !== 'undefined' &&
	            oldParent.inputs[e.oldInput].block === e.id) {
	            // This block was connected to the old parent's input.
	            oldParent.inputs[e.oldInput].block = null;
	        } else if (oldParent.next === e.id) {
	            // This block was connected to the old parent's next connection.
	            oldParent.next = null;
	        }
	        this._blocks[e.id].parent = null;
	    }

	    // Has the block become a top-level block?
	    if (typeof e.newParent === 'undefined') {
	        this._addScript(e.id);
	    } else {
	        // Remove script, if one exists.
	        this._deleteScript(e.id);
	        // Otherwise, try to connect it in its new place.
	        if (typeof e.newInput === 'undefined') {
	            // Moved to the new parent's next connection.
	            this._blocks[e.newParent].next = e.id;
	        } else {
	            // Moved to the new parent's input.
	            // Don't obscure the shadow block.
	            var oldShadow = null;
	            if (this._blocks[e.newParent].inputs.hasOwnProperty(e.newInput)) {
	                oldShadow = this._blocks[e.newParent].inputs[e.newInput].shadow;
	            }
	            this._blocks[e.newParent].inputs[e.newInput] = {
	                name: e.newInput,
	                block: e.id,
	                shadow: oldShadow
	            };
	        }
	        this._blocks[e.id].parent = e.newParent;
	    }
	};

	/**
	 * Block management: delete blocks and their associated scripts.
	 * @param {!Object} e Blockly delete event to be processed.
	 */
	Blocks.prototype.deleteBlock = function (e) {
	    // @todo In runtime, stop threads running on this script.

	    // Get block
	    var block = this._blocks[e.id];

	    // Delete children
	    if (block.next !== null) {
	        this.deleteBlock({id: block.next});
	    }

	    // Delete inputs (including branches)
	    for (var input in block.inputs) {
	        // If it's null, the block in this input moved away.
	        if (block.inputs[input].block !== null) {
	            this.deleteBlock({id: block.inputs[input].block});
	        }
	        // Delete obscured shadow blocks.
	        if (block.inputs[input].shadow !== null &&
	            block.inputs[input].shadow !== block.inputs[input].block) {
	            this.deleteBlock({id: block.inputs[input].shadow});
	        }
	    }

	    // Delete any script starting with this block.
	    this._deleteScript(e.id);

	    // Delete block itself.
	    delete this._blocks[e.id];
	};

	// ---------------------------------------------------------------------

	/**
	 * Encode all of `this._blocks` as an XML string usable
	 * by a Blockly/scratch-blocks workspace.
	 * @return {string} String of XML representing this object's blocks.
	 */
	Blocks.prototype.toXML = function () {
	    var xmlString = '<xml xmlns="http://www.w3.org/1999/xhtml">';
	    for (var i = 0; i < this._scripts.length; i++) {
	        xmlString += this.blockToXML(this._scripts[i]);
	    }
	    return xmlString + '</xml>';
	};

	/**
	 * Recursively encode an individual block and its children
	 * into a Blockly/scratch-blocks XML string.
	 * @param {!string} blockId ID of block to encode.
	 * @return {string} String of XML representing this block and any children.
	 */
	Blocks.prototype.blockToXML = function (blockId) {
	    var block = this._blocks[blockId];
	    // Encode properties of this block.
	    var tagName = (block.shadow) ? 'shadow' : 'block';
	    var xy = (block.topLevel) ?
	        ' x="' + block.x + '" y="' + block.y + '"' :
	        '';
	    var xmlString = '';
	    xmlString += '<' + tagName +
	        ' id="' + block.id + '"' +
	        ' type="' + block.opcode + '"' +
	        xy +
	        '>';
	    // Add any mutation. Must come before inputs.
	    if (block.mutation) {
	        xmlString += this.mutationToXML(block.mutation);
	    }
	    // Add any inputs on this block.
	    for (var input in block.inputs) {
	        var blockInput = block.inputs[input];
	        // Only encode a value tag if the value input is occupied.
	        if (blockInput.block || blockInput.shadow) {
	            xmlString += '<value name="' + blockInput.name + '">';
	            if (blockInput.block) {
	                xmlString += this.blockToXML(blockInput.block);
	            }
	            if (blockInput.shadow && blockInput.shadow !== blockInput.block) {
	                // Obscured shadow.
	                xmlString += this.blockToXML(blockInput.shadow);
	            }
	            xmlString += '</value>';
	        }
	    }
	    // Add any fields on this block.
	    for (var field in block.fields) {
	        var blockField = block.fields[field];
	        var value = blockField.value;
	        if (typeof value === 'string') {
	            value = xmlEscape(blockField.value);
	        }
	        xmlString += '<field name="' + blockField.name + '">' +
	            value + '</field>';
	    }
	    // Add blocks connected to the next connection.
	    if (block.next) {
	        xmlString += '<next>' + this.blockToXML(block.next) + '</next>';
	    }
	    xmlString += '</' + tagName + '>';
	    return xmlString;
	};

	/**
	 * Recursively encode a mutation object to XML.
	 * @param {!Object} mutation Object representing a mutation.
	 * @return {string} XML string representing a mutation.
	 */
	Blocks.prototype.mutationToXML = function (mutation) {
	    var mutationString = '<' + mutation.tagName;
	    for (var prop in mutation) {
	        if (prop === 'children' || prop === 'tagName') continue;
	        var mutationValue = (typeof mutation[prop] === 'string') ?
	            xmlEscape(mutation[prop]) : mutation[prop];
	        mutationString += ' ' + prop + '="' + mutationValue + '"';
	    }
	    mutationString += '>';
	    for (var i = 0; i < mutation.children.length; i++) {
	        mutationString += this.mutationToXML(mutation.children[i]);
	    }
	    mutationString += '</' + mutation.tagName + '>';
	    return mutationString;
	};

	// ---------------------------------------------------------------------

	/**
	 * Helper to add a stack to `this._scripts`.
	 * @param {?string} topBlockId ID of block that starts the script.
	 */
	Blocks.prototype._addScript = function (topBlockId) {
	    var i = this._scripts.indexOf(topBlockId);
	    if (i > -1) return; // Already in scripts.
	    this._scripts.push(topBlockId);
	    // Update `topLevel` property on the top block.
	    this._blocks[topBlockId].topLevel = true;
	};

	/**
	 * Helper to remove a script from `this._scripts`.
	 * @param {?string} topBlockId ID of block that starts the script.
	 */
	Blocks.prototype._deleteScript = function (topBlockId) {
	    var i = this._scripts.indexOf(topBlockId);
	    if (i > -1) this._scripts.splice(i, 1);
	    // Update `topLevel` property on the top block.
	    if (this._blocks[topBlockId]) this._blocks[topBlockId].topLevel = false;
	};

	module.exports = Blocks;


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var mutationAdapter = __webpack_require__(36);
	var html = __webpack_require__(37);

	/**
	 * Convert outer blocks DOM from a Blockly CREATE event
	 * to a usable form for the Scratch runtime.
	 * This structure is based on Blockly xml.js:`domToWorkspace` and `domToBlock`.
	 * @param {Element} blocksDOM DOM tree for this event.
	 * @return {Array.<Object>} Usable list of blocks from this CREATE event.
	 */
	var domToBlocks = function (blocksDOM) {
	    // At this level, there could be multiple blocks adjacent in the DOM tree.
	    var blocks = {};
	    for (var i = 0; i < blocksDOM.length; i++) {
	        var block = blocksDOM[i];
	        if (!block.name || !block.attribs) {
	            continue;
	        }
	        var tagName = block.name.toLowerCase();
	        if (tagName === 'block' || tagName === 'shadow') {
	            domToBlock(block, blocks, true, null);
	        }
	    }
	    // Flatten blocks object into a list.
	    var blocksList = [];
	    for (var b in blocks) {
	        blocksList.push(blocks[b]);
	    }
	    return blocksList;
	};

	/**
	 * Adapter between block creation events and block representation which can be
	 * used by the Scratch runtime.
	 * @param {Object} e `Blockly.events.create`
	 * @return {Array.<Object>} List of blocks from this CREATE event.
	 */
	var adapter = function (e) {
	    // Validate input
	    if (typeof e !== 'object') return;
	    if (typeof e.xml !== 'object') return;

	    return domToBlocks(html.parseDOM(e.xml.outerHTML));
	};

	/**
	 * Convert and an individual block DOM to the representation tree.
	 * Based on Blockly's `domToBlockHeadless_`.
	 * @param {Element} blockDOM DOM tree for an individual block.
	 * @param {Object} blocks Collection of blocks to add to.
	 * @param {Boolean} isTopBlock Whether blocks at this level are "top blocks."
	 * @param {?string} parent Parent block ID.
	 * @return {undefined}
	 */
	var domToBlock = function (blockDOM, blocks, isTopBlock, parent) {
	    // Block skeleton.
	    var block = {
	        id: blockDOM.attribs.id, // Block ID
	        opcode: blockDOM.attribs.type, // For execution, "event_whengreenflag".
	        inputs: {}, // Inputs to this block and the blocks they point to.
	        fields: {}, // Fields on this block and their values.
	        next: null, // Next block in the stack, if one exists.
	        topLevel: isTopBlock, // If this block starts a stack.
	        parent: parent, // Parent block ID, if available.
	        shadow: blockDOM.name === 'shadow', // If this represents a shadow/slot.
	        x: blockDOM.attribs.x, // X position of script, if top-level.
	        y: blockDOM.attribs.y // Y position of script, if top-level.
	    };

	    // Add the block to the representation tree.
	    blocks[block.id] = block;

	    // Process XML children and find enclosed blocks, fields, etc.
	    for (var i = 0; i < blockDOM.children.length; i++) {
	        var xmlChild = blockDOM.children[i];
	        // Enclosed blocks and shadows
	        var childBlockNode = null;
	        var childShadowNode = null;
	        for (var j = 0; j < xmlChild.children.length; j++) {
	            var grandChildNode = xmlChild.children[j];
	            if (!grandChildNode.name) {
	                // Non-XML tag node.
	                continue;
	            }
	            var grandChildNodeName = grandChildNode.name.toLowerCase();
	            if (grandChildNodeName === 'block') {
	                childBlockNode = grandChildNode;
	            } else if (grandChildNodeName === 'shadow') {
	                childShadowNode = grandChildNode;
	            }
	        }

	        // Use shadow block only if there's no real block node.
	        if (!childBlockNode && childShadowNode) {
	            childBlockNode = childShadowNode;
	        }

	        // Not all Blockly-type blocks are handled here,
	        // as we won't be using all of them for Scratch.
	        switch (xmlChild.name.toLowerCase()) {
	        case 'field':
	            // Add the field to this block.
	            var fieldName = xmlChild.attribs.name;
	            var fieldData = '';
	            if (xmlChild.children.length > 0 && xmlChild.children[0].data) {
	                fieldData = xmlChild.children[0].data;
	            } else {
	                // If the child of the field with a data property
	                // doesn't exist, set the data to an empty string.
	                fieldData = '';
	            }
	            block.fields[fieldName] = {
	                name: fieldName,
	                value: fieldData
	            };
	            break;
	        case 'value':
	        case 'statement':
	            // Recursively generate block structure for input block.
	            domToBlock(childBlockNode, blocks, false, block.id);
	            if (childShadowNode && childBlockNode !== childShadowNode) {
	                // Also generate the shadow block.
	                domToBlock(childShadowNode, blocks, false, block.id);
	            }
	            // Link this block's input to the child block.
	            var inputName = xmlChild.attribs.name;
	            block.inputs[inputName] = {
	                name: inputName,
	                block: childBlockNode.attribs.id,
	                shadow: childShadowNode ? childShadowNode.attribs.id : null
	            };
	            break;
	        case 'next':
	            if (!childBlockNode || !childBlockNode.attribs) {
	                // Invalid child block.
	                continue;
	            }
	            // Recursively generate block structure for next block.
	            domToBlock(childBlockNode, blocks, false, block.id);
	            // Link next block to this block.
	            block.next = childBlockNode.attribs.id;
	            break;
	        case 'mutation':
	            block.mutation = mutationAdapter(xmlChild);
	            break;
	        }
	    }
	};

	module.exports = adapter;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var html = __webpack_require__(37);

	/**
	 * Convert a part of a mutation DOM to a mutation VM object, recursively.
	 * @param {Object} dom DOM object for mutation tag.
	 * @return {Object} Object representing useful parts of this mutation.
	 */
	var mutatorTagToObject = function (dom) {
	    var obj = Object.create(null);
	    obj.tagName = dom.name;
	    obj.children = [];
	    for (var prop in dom.attribs) {
	        if (prop === 'xmlns') continue;
	        obj[prop] = dom.attribs[prop];
	    }
	    for (var i = 0; i < dom.children.length; i++) {
	        obj.children.push(
	            mutatorTagToObject(dom.children[i])
	        );
	    }
	    return obj;
	};

	/**
	 * Adapter between mutator XML or DOM and block representation which can be
	 * used by the Scratch runtime.
	 * @param {(Object|string)} mutation Mutation XML string or DOM.
	 * @return {Object} Object representing the mutation.
	 */
	var mutationAdpater = function (mutation) {
	    var mutationParsed;
	    // Check if the mutation is already parsed; if not, parse it.
	    if (typeof mutation === 'object') {
	        mutationParsed = mutation;
	    } else {
	        mutationParsed = html.parseDOM(mutation)[0];
	    }
	    return mutatorTagToObject(mutationParsed);
	};

	module.exports = mutationAdpater;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(38),
	    DomHandler = __webpack_require__(45);

	function defineProp(name, value){
		delete module.exports[name];
		module.exports[name] = value;
		return value;
	}

	module.exports = {
		Parser: Parser,
		Tokenizer: __webpack_require__(39),
		ElementType: __webpack_require__(46),
		DomHandler: DomHandler,
		get FeedHandler(){
			return defineProp("FeedHandler", __webpack_require__(49));
		},
		get Stream(){
			return defineProp("Stream", __webpack_require__(50));
		},
		get WritableStream(){
			return defineProp("WritableStream", __webpack_require__(51));
		},
		get ProxyHandler(){
			return defineProp("ProxyHandler", __webpack_require__(74));
		},
		get DomUtils(){
			return defineProp("DomUtils", __webpack_require__(75));
		},
		get CollectingHandler(){
			return defineProp("CollectingHandler", __webpack_require__(87));
		},
		// For legacy support
		DefaultHandler: DomHandler,
		get RssHandler(){
			return defineProp("RssHandler", this.FeedHandler);
		},
		//helper methods
		parseDOM: function(data, options){
			var handler = new DomHandler(options);
			new Parser(handler, options).end(data);
			return handler.dom;
		},
		parseFeed: function(feed, options){
			var handler = new module.exports.FeedHandler(options);
			new Parser(handler, options).end(feed);
			return handler.dom;
		},
		createDomStream: function(cb, options, elementCb){
			var handler = new DomHandler(cb, options, elementCb);
			return new Parser(handler, options);
		},
		// List of all events that the parser emits
		EVENTS: { /* Format: eventname: number of arguments */
			attribute: 2,
			cdatastart: 0,
			cdataend: 0,
			text: 1,
			processinginstruction: 2,
			comment: 1,
			commentend: 0,
			closetag: 1,
			opentag: 2,
			opentagname: 1,
			error: 1,
			end: 0
		}
	};


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var Tokenizer = __webpack_require__(39);

	/*
		Options:

		xmlMode: Disables the special behavior for script/style tags (false by default)
		lowerCaseAttributeNames: call .toLowerCase for each attribute name (true if xmlMode is `false`)
		lowerCaseTags: call .toLowerCase for each tag name (true if xmlMode is `false`)
	*/

	/*
		Callbacks:

		oncdataend,
		oncdatastart,
		onclosetag,
		oncomment,
		oncommentend,
		onerror,
		onopentag,
		onprocessinginstruction,
		onreset,
		ontext
	*/

	var formTags = {
		input: true,
		option: true,
		optgroup: true,
		select: true,
		button: true,
		datalist: true,
		textarea: true
	};

	var openImpliesClose = {
		tr      : { tr:true, th:true, td:true },
		th      : { th:true },
		td      : { thead:true, th:true, td:true },
		body    : { head:true, link:true, script:true },
		li      : { li:true },
		p       : { p:true },
		h1      : { p:true },
		h2      : { p:true },
		h3      : { p:true },
		h4      : { p:true },
		h5      : { p:true },
		h6      : { p:true },
		select  : formTags,
		input   : formTags,
		output  : formTags,
		button  : formTags,
		datalist: formTags,
		textarea: formTags,
		option  : { option:true },
		optgroup: { optgroup:true }
	};

	var voidElements = {
		__proto__: null,
		area: true,
		base: true,
		basefont: true,
		br: true,
		col: true,
		command: true,
		embed: true,
		frame: true,
		hr: true,
		img: true,
		input: true,
		isindex: true,
		keygen: true,
		link: true,
		meta: true,
		param: true,
		source: true,
		track: true,
		wbr: true,

		//common self closing svg elements
		path: true,
		circle: true,
		ellipse: true,
		line: true,
		rect: true,
		use: true,
		stop: true,
		polyline: true,
		polygon: true
	};

	var re_nameEnd = /\s|\//;

	function Parser(cbs, options){
		this._options = options || {};
		this._cbs = cbs || {};

		this._tagname = "";
		this._attribname = "";
		this._attribvalue = "";
		this._attribs = null;
		this._stack = [];

		this.startIndex = 0;
		this.endIndex = null;

		this._lowerCaseTagNames = "lowerCaseTags" in this._options ?
										!!this._options.lowerCaseTags :
										!this._options.xmlMode;
		this._lowerCaseAttributeNames = "lowerCaseAttributeNames" in this._options ?
										!!this._options.lowerCaseAttributeNames :
										!this._options.xmlMode;
		if(!!this._options.Tokenizer) {
			Tokenizer = this._options.Tokenizer;
		}
		this._tokenizer = new Tokenizer(this._options, this);

		if(this._cbs.onparserinit) this._cbs.onparserinit(this);
	}

	__webpack_require__(12).inherits(Parser, __webpack_require__(11).EventEmitter);

	Parser.prototype._updatePosition = function(initialOffset){
		if(this.endIndex === null){
			if(this._tokenizer._sectionStart <= initialOffset){
				this.startIndex = 0;
			} else {
				this.startIndex = this._tokenizer._sectionStart - initialOffset;
			}
		}
		else this.startIndex = this.endIndex + 1;
		this.endIndex = this._tokenizer.getAbsoluteIndex();
	};

	//Tokenizer event handlers
	Parser.prototype.ontext = function(data){
		this._updatePosition(1);
		this.endIndex--;

		if(this._cbs.ontext) this._cbs.ontext(data);
	};

	Parser.prototype.onopentagname = function(name){
		if(this._lowerCaseTagNames){
			name = name.toLowerCase();
		}

		this._tagname = name;

		if(!this._options.xmlMode && name in openImpliesClose) {
			for(
				var el;
				(el = this._stack[this._stack.length - 1]) in openImpliesClose[name];
				this.onclosetag(el)
			);
		}

		if(this._options.xmlMode || !(name in voidElements)){
			this._stack.push(name);
		}

		if(this._cbs.onopentagname) this._cbs.onopentagname(name);
		if(this._cbs.onopentag) this._attribs = {};
	};

	Parser.prototype.onopentagend = function(){
		this._updatePosition(1);

		if(this._attribs){
			if(this._cbs.onopentag) this._cbs.onopentag(this._tagname, this._attribs);
			this._attribs = null;
		}

		if(!this._options.xmlMode && this._cbs.onclosetag && this._tagname in voidElements){
			this._cbs.onclosetag(this._tagname);
		}

		this._tagname = "";
	};

	Parser.prototype.onclosetag = function(name){
		this._updatePosition(1);

		if(this._lowerCaseTagNames){
			name = name.toLowerCase();
		}

		if(this._stack.length && (!(name in voidElements) || this._options.xmlMode)){
			var pos = this._stack.lastIndexOf(name);
			if(pos !== -1){
				if(this._cbs.onclosetag){
					pos = this._stack.length - pos;
					while(pos--) this._cbs.onclosetag(this._stack.pop());
				}
				else this._stack.length = pos;
			} else if(name === "p" && !this._options.xmlMode){
				this.onopentagname(name);
				this._closeCurrentTag();
			}
		} else if(!this._options.xmlMode && (name === "br" || name === "p")){
			this.onopentagname(name);
			this._closeCurrentTag();
		}
	};

	Parser.prototype.onselfclosingtag = function(){
		if(this._options.xmlMode || this._options.recognizeSelfClosing){
			this._closeCurrentTag();
		} else {
			this.onopentagend();
		}
	};

	Parser.prototype._closeCurrentTag = function(){
		var name = this._tagname;

		this.onopentagend();

		//self-closing tags will be on the top of the stack
		//(cheaper check than in onclosetag)
		if(this._stack[this._stack.length - 1] === name){
			if(this._cbs.onclosetag){
				this._cbs.onclosetag(name);
			}
			this._stack.pop();
		}
	};

	Parser.prototype.onattribname = function(name){
		if(this._lowerCaseAttributeNames){
			name = name.toLowerCase();
		}
		this._attribname = name;
	};

	Parser.prototype.onattribdata = function(value){
		this._attribvalue += value;
	};

	Parser.prototype.onattribend = function(){
		if(this._cbs.onattribute) this._cbs.onattribute(this._attribname, this._attribvalue);
		if(
			this._attribs &&
			!Object.prototype.hasOwnProperty.call(this._attribs, this._attribname)
		){
			this._attribs[this._attribname] = this._attribvalue;
		}
		this._attribname = "";
		this._attribvalue = "";
	};

	Parser.prototype._getInstructionName = function(value){
		var idx = value.search(re_nameEnd),
		    name = idx < 0 ? value : value.substr(0, idx);

		if(this._lowerCaseTagNames){
			name = name.toLowerCase();
		}

		return name;
	};

	Parser.prototype.ondeclaration = function(value){
		if(this._cbs.onprocessinginstruction){
			var name = this._getInstructionName(value);
			this._cbs.onprocessinginstruction("!" + name, "!" + value);
		}
	};

	Parser.prototype.onprocessinginstruction = function(value){
		if(this._cbs.onprocessinginstruction){
			var name = this._getInstructionName(value);
			this._cbs.onprocessinginstruction("?" + name, "?" + value);
		}
	};

	Parser.prototype.oncomment = function(value){
		this._updatePosition(4);

		if(this._cbs.oncomment) this._cbs.oncomment(value);
		if(this._cbs.oncommentend) this._cbs.oncommentend();
	};

	Parser.prototype.oncdata = function(value){
		this._updatePosition(1);

		if(this._options.xmlMode || this._options.recognizeCDATA){
			if(this._cbs.oncdatastart) this._cbs.oncdatastart();
			if(this._cbs.ontext) this._cbs.ontext(value);
			if(this._cbs.oncdataend) this._cbs.oncdataend();
		} else {
			this.oncomment("[CDATA[" + value + "]]");
		}
	};

	Parser.prototype.onerror = function(err){
		if(this._cbs.onerror) this._cbs.onerror(err);
	};

	Parser.prototype.onend = function(){
		if(this._cbs.onclosetag){
			for(
				var i = this._stack.length;
				i > 0;
				this._cbs.onclosetag(this._stack[--i])
			);
		}
		if(this._cbs.onend) this._cbs.onend();
	};


	//Resets the parser to a blank state, ready to parse a new HTML document
	Parser.prototype.reset = function(){
		if(this._cbs.onreset) this._cbs.onreset();
		this._tokenizer.reset();

		this._tagname = "";
		this._attribname = "";
		this._attribs = null;
		this._stack = [];

		if(this._cbs.onparserinit) this._cbs.onparserinit(this);
	};

	//Parses a complete HTML document and pushes it to the handler
	Parser.prototype.parseComplete = function(data){
		this.reset();
		this.end(data);
	};

	Parser.prototype.write = function(chunk){
		this._tokenizer.write(chunk);
	};

	Parser.prototype.end = function(chunk){
		this._tokenizer.end(chunk);
	};

	Parser.prototype.pause = function(){
		this._tokenizer.pause();
	};

	Parser.prototype.resume = function(){
		this._tokenizer.resume();
	};

	//alias for backwards compat
	Parser.prototype.parseChunk = Parser.prototype.write;
	Parser.prototype.done = Parser.prototype.end;

	module.exports = Parser;


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Tokenizer;

	var decodeCodePoint = __webpack_require__(40),
	    entityMap = __webpack_require__(42),
	    legacyMap = __webpack_require__(43),
	    xmlMap    = __webpack_require__(44),

	    i = 0,

	    TEXT                      = i++,
	    BEFORE_TAG_NAME           = i++, //after <
	    IN_TAG_NAME               = i++,
	    IN_SELF_CLOSING_TAG       = i++,
	    BEFORE_CLOSING_TAG_NAME   = i++,
	    IN_CLOSING_TAG_NAME       = i++,
	    AFTER_CLOSING_TAG_NAME    = i++,

	    //attributes
	    BEFORE_ATTRIBUTE_NAME     = i++,
	    IN_ATTRIBUTE_NAME         = i++,
	    AFTER_ATTRIBUTE_NAME      = i++,
	    BEFORE_ATTRIBUTE_VALUE    = i++,
	    IN_ATTRIBUTE_VALUE_DQ     = i++, // "
	    IN_ATTRIBUTE_VALUE_SQ     = i++, // '
	    IN_ATTRIBUTE_VALUE_NQ     = i++,

	    //declarations
	    BEFORE_DECLARATION        = i++, // !
	    IN_DECLARATION            = i++,

	    //processing instructions
	    IN_PROCESSING_INSTRUCTION = i++, // ?

	    //comments
	    BEFORE_COMMENT            = i++,
	    IN_COMMENT                = i++,
	    AFTER_COMMENT_1           = i++,
	    AFTER_COMMENT_2           = i++,

	    //cdata
	    BEFORE_CDATA_1            = i++, // [
	    BEFORE_CDATA_2            = i++, // C
	    BEFORE_CDATA_3            = i++, // D
	    BEFORE_CDATA_4            = i++, // A
	    BEFORE_CDATA_5            = i++, // T
	    BEFORE_CDATA_6            = i++, // A
	    IN_CDATA                  = i++, // [
	    AFTER_CDATA_1             = i++, // ]
	    AFTER_CDATA_2             = i++, // ]

	    //special tags
	    BEFORE_SPECIAL            = i++, //S
	    BEFORE_SPECIAL_END        = i++,   //S

	    BEFORE_SCRIPT_1           = i++, //C
	    BEFORE_SCRIPT_2           = i++, //R
	    BEFORE_SCRIPT_3           = i++, //I
	    BEFORE_SCRIPT_4           = i++, //P
	    BEFORE_SCRIPT_5           = i++, //T
	    AFTER_SCRIPT_1            = i++, //C
	    AFTER_SCRIPT_2            = i++, //R
	    AFTER_SCRIPT_3            = i++, //I
	    AFTER_SCRIPT_4            = i++, //P
	    AFTER_SCRIPT_5            = i++, //T

	    BEFORE_STYLE_1            = i++, //T
	    BEFORE_STYLE_2            = i++, //Y
	    BEFORE_STYLE_3            = i++, //L
	    BEFORE_STYLE_4            = i++, //E
	    AFTER_STYLE_1             = i++, //T
	    AFTER_STYLE_2             = i++, //Y
	    AFTER_STYLE_3             = i++, //L
	    AFTER_STYLE_4             = i++, //E

	    BEFORE_ENTITY             = i++, //&
	    BEFORE_NUMERIC_ENTITY     = i++, //#
	    IN_NAMED_ENTITY           = i++,
	    IN_NUMERIC_ENTITY         = i++,
	    IN_HEX_ENTITY             = i++, //X

	    j = 0,

	    SPECIAL_NONE              = j++,
	    SPECIAL_SCRIPT            = j++,
	    SPECIAL_STYLE             = j++;

	function whitespace(c){
		return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
	}

	function characterState(char, SUCCESS){
		return function(c){
			if(c === char) this._state = SUCCESS;
		};
	}

	function ifElseState(upper, SUCCESS, FAILURE){
		var lower = upper.toLowerCase();

		if(upper === lower){
			return function(c){
				if(c === lower){
					this._state = SUCCESS;
				} else {
					this._state = FAILURE;
					this._index--;
				}
			};
		} else {
			return function(c){
				if(c === lower || c === upper){
					this._state = SUCCESS;
				} else {
					this._state = FAILURE;
					this._index--;
				}
			};
		}
	}

	function consumeSpecialNameChar(upper, NEXT_STATE){
		var lower = upper.toLowerCase();

		return function(c){
			if(c === lower || c === upper){
				this._state = NEXT_STATE;
			} else {
				this._state = IN_TAG_NAME;
				this._index--; //consume the token again
			}
		};
	}

	function Tokenizer(options, cbs){
		this._state = TEXT;
		this._buffer = "";
		this._sectionStart = 0;
		this._index = 0;
		this._bufferOffset = 0; //chars removed from _buffer
		this._baseState = TEXT;
		this._special = SPECIAL_NONE;
		this._cbs = cbs;
		this._running = true;
		this._ended = false;
		this._xmlMode = !!(options && options.xmlMode);
		this._decodeEntities = !!(options && options.decodeEntities);
	}

	Tokenizer.prototype._stateText = function(c){
		if(c === "<"){
			if(this._index > this._sectionStart){
				this._cbs.ontext(this._getSection());
			}
			this._state = BEFORE_TAG_NAME;
			this._sectionStart = this._index;
		} else if(this._decodeEntities && this._special === SPECIAL_NONE && c === "&"){
			if(this._index > this._sectionStart){
				this._cbs.ontext(this._getSection());
			}
			this._baseState = TEXT;
			this._state = BEFORE_ENTITY;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateBeforeTagName = function(c){
		if(c === "/"){
			this._state = BEFORE_CLOSING_TAG_NAME;
		} else if(c === ">" || this._special !== SPECIAL_NONE || whitespace(c)) {
			this._state = TEXT;
		} else if(c === "!"){
			this._state = BEFORE_DECLARATION;
			this._sectionStart = this._index + 1;
		} else if(c === "?"){
			this._state = IN_PROCESSING_INSTRUCTION;
			this._sectionStart = this._index + 1;
		} else if(c === "<"){
			this._cbs.ontext(this._getSection());
			this._sectionStart = this._index;
		} else {
			this._state = (!this._xmlMode && (c === "s" || c === "S")) ?
							BEFORE_SPECIAL : IN_TAG_NAME;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateInTagName = function(c){
		if(c === "/" || c === ">" || whitespace(c)){
			this._emitToken("onopentagname");
			this._state = BEFORE_ATTRIBUTE_NAME;
			this._index--;
		}
	};

	Tokenizer.prototype._stateBeforeCloseingTagName = function(c){
		if(whitespace(c));
		else if(c === ">"){
			this._state = TEXT;
		} else if(this._special !== SPECIAL_NONE){
			if(c === "s" || c === "S"){
				this._state = BEFORE_SPECIAL_END;
			} else {
				this._state = TEXT;
				this._index--;
			}
		} else {
			this._state = IN_CLOSING_TAG_NAME;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateInCloseingTagName = function(c){
		if(c === ">" || whitespace(c)){
			this._emitToken("onclosetag");
			this._state = AFTER_CLOSING_TAG_NAME;
			this._index--;
		}
	};

	Tokenizer.prototype._stateAfterCloseingTagName = function(c){
		//skip everything until ">"
		if(c === ">"){
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		}
	};

	Tokenizer.prototype._stateBeforeAttributeName = function(c){
		if(c === ">"){
			this._cbs.onopentagend();
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		} else if(c === "/"){
			this._state = IN_SELF_CLOSING_TAG;
		} else if(!whitespace(c)){
			this._state = IN_ATTRIBUTE_NAME;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateInSelfClosingTag = function(c){
		if(c === ">"){
			this._cbs.onselfclosingtag();
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		} else if(!whitespace(c)){
			this._state = BEFORE_ATTRIBUTE_NAME;
			this._index--;
		}
	};

	Tokenizer.prototype._stateInAttributeName = function(c){
		if(c === "=" || c === "/" || c === ">" || whitespace(c)){
			this._cbs.onattribname(this._getSection());
			this._sectionStart = -1;
			this._state = AFTER_ATTRIBUTE_NAME;
			this._index--;
		}
	};

	Tokenizer.prototype._stateAfterAttributeName = function(c){
		if(c === "="){
			this._state = BEFORE_ATTRIBUTE_VALUE;
		} else if(c === "/" || c === ">"){
			this._cbs.onattribend();
			this._state = BEFORE_ATTRIBUTE_NAME;
			this._index--;
		} else if(!whitespace(c)){
			this._cbs.onattribend();
			this._state = IN_ATTRIBUTE_NAME;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateBeforeAttributeValue = function(c){
		if(c === "\""){
			this._state = IN_ATTRIBUTE_VALUE_DQ;
			this._sectionStart = this._index + 1;
		} else if(c === "'"){
			this._state = IN_ATTRIBUTE_VALUE_SQ;
			this._sectionStart = this._index + 1;
		} else if(!whitespace(c)){
			this._state = IN_ATTRIBUTE_VALUE_NQ;
			this._sectionStart = this._index;
			this._index--; //reconsume token
		}
	};

	Tokenizer.prototype._stateInAttributeValueDoubleQuotes = function(c){
		if(c === "\""){
			this._emitToken("onattribdata");
			this._cbs.onattribend();
			this._state = BEFORE_ATTRIBUTE_NAME;
		} else if(this._decodeEntities && c === "&"){
			this._emitToken("onattribdata");
			this._baseState = this._state;
			this._state = BEFORE_ENTITY;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateInAttributeValueSingleQuotes = function(c){
		if(c === "'"){
			this._emitToken("onattribdata");
			this._cbs.onattribend();
			this._state = BEFORE_ATTRIBUTE_NAME;
		} else if(this._decodeEntities && c === "&"){
			this._emitToken("onattribdata");
			this._baseState = this._state;
			this._state = BEFORE_ENTITY;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateInAttributeValueNoQuotes = function(c){
		if(whitespace(c) || c === ">"){
			this._emitToken("onattribdata");
			this._cbs.onattribend();
			this._state = BEFORE_ATTRIBUTE_NAME;
			this._index--;
		} else if(this._decodeEntities && c === "&"){
			this._emitToken("onattribdata");
			this._baseState = this._state;
			this._state = BEFORE_ENTITY;
			this._sectionStart = this._index;
		}
	};

	Tokenizer.prototype._stateBeforeDeclaration = function(c){
		this._state = c === "[" ? BEFORE_CDATA_1 :
						c === "-" ? BEFORE_COMMENT :
							IN_DECLARATION;
	};

	Tokenizer.prototype._stateInDeclaration = function(c){
		if(c === ">"){
			this._cbs.ondeclaration(this._getSection());
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		}
	};

	Tokenizer.prototype._stateInProcessingInstruction = function(c){
		if(c === ">"){
			this._cbs.onprocessinginstruction(this._getSection());
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		}
	};

	Tokenizer.prototype._stateBeforeComment = function(c){
		if(c === "-"){
			this._state = IN_COMMENT;
			this._sectionStart = this._index + 1;
		} else {
			this._state = IN_DECLARATION;
		}
	};

	Tokenizer.prototype._stateInComment = function(c){
		if(c === "-") this._state = AFTER_COMMENT_1;
	};

	Tokenizer.prototype._stateAfterComment1 = function(c){
		if(c === "-"){
			this._state = AFTER_COMMENT_2;
		} else {
			this._state = IN_COMMENT;
		}
	};

	Tokenizer.prototype._stateAfterComment2 = function(c){
		if(c === ">"){
			//remove 2 trailing chars
			this._cbs.oncomment(this._buffer.substring(this._sectionStart, this._index - 2));
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		} else if(c !== "-"){
			this._state = IN_COMMENT;
		}
		// else: stay in AFTER_COMMENT_2 (`--->`)
	};

	Tokenizer.prototype._stateBeforeCdata1 = ifElseState("C", BEFORE_CDATA_2, IN_DECLARATION);
	Tokenizer.prototype._stateBeforeCdata2 = ifElseState("D", BEFORE_CDATA_3, IN_DECLARATION);
	Tokenizer.prototype._stateBeforeCdata3 = ifElseState("A", BEFORE_CDATA_4, IN_DECLARATION);
	Tokenizer.prototype._stateBeforeCdata4 = ifElseState("T", BEFORE_CDATA_5, IN_DECLARATION);
	Tokenizer.prototype._stateBeforeCdata5 = ifElseState("A", BEFORE_CDATA_6, IN_DECLARATION);

	Tokenizer.prototype._stateBeforeCdata6 = function(c){
		if(c === "["){
			this._state = IN_CDATA;
			this._sectionStart = this._index + 1;
		} else {
			this._state = IN_DECLARATION;
			this._index--;
		}
	};

	Tokenizer.prototype._stateInCdata = function(c){
		if(c === "]") this._state = AFTER_CDATA_1;
	};

	Tokenizer.prototype._stateAfterCdata1 = characterState("]", AFTER_CDATA_2);

	Tokenizer.prototype._stateAfterCdata2 = function(c){
		if(c === ">"){
			//remove 2 trailing chars
			this._cbs.oncdata(this._buffer.substring(this._sectionStart, this._index - 2));
			this._state = TEXT;
			this._sectionStart = this._index + 1;
		} else if(c !== "]") {
			this._state = IN_CDATA;
		}
		//else: stay in AFTER_CDATA_2 (`]]]>`)
	};

	Tokenizer.prototype._stateBeforeSpecial = function(c){
		if(c === "c" || c === "C"){
			this._state = BEFORE_SCRIPT_1;
		} else if(c === "t" || c === "T"){
			this._state = BEFORE_STYLE_1;
		} else {
			this._state = IN_TAG_NAME;
			this._index--; //consume the token again
		}
	};

	Tokenizer.prototype._stateBeforeSpecialEnd = function(c){
		if(this._special === SPECIAL_SCRIPT && (c === "c" || c === "C")){
			this._state = AFTER_SCRIPT_1;
		} else if(this._special === SPECIAL_STYLE && (c === "t" || c === "T")){
			this._state = AFTER_STYLE_1;
		}
		else this._state = TEXT;
	};

	Tokenizer.prototype._stateBeforeScript1 = consumeSpecialNameChar("R", BEFORE_SCRIPT_2);
	Tokenizer.prototype._stateBeforeScript2 = consumeSpecialNameChar("I", BEFORE_SCRIPT_3);
	Tokenizer.prototype._stateBeforeScript3 = consumeSpecialNameChar("P", BEFORE_SCRIPT_4);
	Tokenizer.prototype._stateBeforeScript4 = consumeSpecialNameChar("T", BEFORE_SCRIPT_5);

	Tokenizer.prototype._stateBeforeScript5 = function(c){
		if(c === "/" || c === ">" || whitespace(c)){
			this._special = SPECIAL_SCRIPT;
		}
		this._state = IN_TAG_NAME;
		this._index--; //consume the token again
	};

	Tokenizer.prototype._stateAfterScript1 = ifElseState("R", AFTER_SCRIPT_2, TEXT);
	Tokenizer.prototype._stateAfterScript2 = ifElseState("I", AFTER_SCRIPT_3, TEXT);
	Tokenizer.prototype._stateAfterScript3 = ifElseState("P", AFTER_SCRIPT_4, TEXT);
	Tokenizer.prototype._stateAfterScript4 = ifElseState("T", AFTER_SCRIPT_5, TEXT);

	Tokenizer.prototype._stateAfterScript5 = function(c){
		if(c === ">" || whitespace(c)){
			this._special = SPECIAL_NONE;
			this._state = IN_CLOSING_TAG_NAME;
			this._sectionStart = this._index - 6;
			this._index--; //reconsume the token
		}
		else this._state = TEXT;
	};

	Tokenizer.prototype._stateBeforeStyle1 = consumeSpecialNameChar("Y", BEFORE_STYLE_2);
	Tokenizer.prototype._stateBeforeStyle2 = consumeSpecialNameChar("L", BEFORE_STYLE_3);
	Tokenizer.prototype._stateBeforeStyle3 = consumeSpecialNameChar("E", BEFORE_STYLE_4);

	Tokenizer.prototype._stateBeforeStyle4 = function(c){
		if(c === "/" || c === ">" || whitespace(c)){
			this._special = SPECIAL_STYLE;
		}
		this._state = IN_TAG_NAME;
		this._index--; //consume the token again
	};

	Tokenizer.prototype._stateAfterStyle1 = ifElseState("Y", AFTER_STYLE_2, TEXT);
	Tokenizer.prototype._stateAfterStyle2 = ifElseState("L", AFTER_STYLE_3, TEXT);
	Tokenizer.prototype._stateAfterStyle3 = ifElseState("E", AFTER_STYLE_4, TEXT);

	Tokenizer.prototype._stateAfterStyle4 = function(c){
		if(c === ">" || whitespace(c)){
			this._special = SPECIAL_NONE;
			this._state = IN_CLOSING_TAG_NAME;
			this._sectionStart = this._index - 5;
			this._index--; //reconsume the token
		}
		else this._state = TEXT;
	};

	Tokenizer.prototype._stateBeforeEntity = ifElseState("#", BEFORE_NUMERIC_ENTITY, IN_NAMED_ENTITY);
	Tokenizer.prototype._stateBeforeNumericEntity = ifElseState("X", IN_HEX_ENTITY, IN_NUMERIC_ENTITY);

	//for entities terminated with a semicolon
	Tokenizer.prototype._parseNamedEntityStrict = function(){
		//offset = 1
		if(this._sectionStart + 1 < this._index){
			var entity = this._buffer.substring(this._sectionStart + 1, this._index),
			    map = this._xmlMode ? xmlMap : entityMap;

			if(map.hasOwnProperty(entity)){
				this._emitPartial(map[entity]);
				this._sectionStart = this._index + 1;
			}
		}
	};


	//parses legacy entities (without trailing semicolon)
	Tokenizer.prototype._parseLegacyEntity = function(){
		var start = this._sectionStart + 1,
		    limit = this._index - start;

		if(limit > 6) limit = 6; //the max length of legacy entities is 6

		while(limit >= 2){ //the min length of legacy entities is 2
			var entity = this._buffer.substr(start, limit);

			if(legacyMap.hasOwnProperty(entity)){
				this._emitPartial(legacyMap[entity]);
				this._sectionStart += limit + 1;
				return;
			} else {
				limit--;
			}
		}
	};

	Tokenizer.prototype._stateInNamedEntity = function(c){
		if(c === ";"){
			this._parseNamedEntityStrict();
			if(this._sectionStart + 1 < this._index && !this._xmlMode){
				this._parseLegacyEntity();
			}
			this._state = this._baseState;
		} else if((c < "a" || c > "z") && (c < "A" || c > "Z") && (c < "0" || c > "9")){
			if(this._xmlMode);
			else if(this._sectionStart + 1 === this._index);
			else if(this._baseState !== TEXT){
				if(c !== "="){
					this._parseNamedEntityStrict();
				}
			} else {
				this._parseLegacyEntity();
			}

			this._state = this._baseState;
			this._index--;
		}
	};

	Tokenizer.prototype._decodeNumericEntity = function(offset, base){
		var sectionStart = this._sectionStart + offset;

		if(sectionStart !== this._index){
			//parse entity
			var entity = this._buffer.substring(sectionStart, this._index);
			var parsed = parseInt(entity, base);

			this._emitPartial(decodeCodePoint(parsed));
			this._sectionStart = this._index;
		} else {
			this._sectionStart--;
		}

		this._state = this._baseState;
	};

	Tokenizer.prototype._stateInNumericEntity = function(c){
		if(c === ";"){
			this._decodeNumericEntity(2, 10);
			this._sectionStart++;
		} else if(c < "0" || c > "9"){
			if(!this._xmlMode){
				this._decodeNumericEntity(2, 10);
			} else {
				this._state = this._baseState;
			}
			this._index--;
		}
	};

	Tokenizer.prototype._stateInHexEntity = function(c){
		if(c === ";"){
			this._decodeNumericEntity(3, 16);
			this._sectionStart++;
		} else if((c < "a" || c > "f") && (c < "A" || c > "F") && (c < "0" || c > "9")){
			if(!this._xmlMode){
				this._decodeNumericEntity(3, 16);
			} else {
				this._state = this._baseState;
			}
			this._index--;
		}
	};

	Tokenizer.prototype._cleanup = function (){
		if(this._sectionStart < 0){
			this._buffer = "";
			this._index = 0;
			this._bufferOffset += this._index;
		} else if(this._running){
			if(this._state === TEXT){
				if(this._sectionStart !== this._index){
					this._cbs.ontext(this._buffer.substr(this._sectionStart));
				}
				this._buffer = "";
				this._index = 0;
				this._bufferOffset += this._index;
			} else if(this._sectionStart === this._index){
				//the section just started
				this._buffer = "";
				this._index = 0;
				this._bufferOffset += this._index;
			} else {
				//remove everything unnecessary
				this._buffer = this._buffer.substr(this._sectionStart);
				this._index -= this._sectionStart;
				this._bufferOffset += this._sectionStart;
			}

			this._sectionStart = 0;
		}
	};

	//TODO make events conditional
	Tokenizer.prototype.write = function(chunk){
		if(this._ended) this._cbs.onerror(Error(".write() after done!"));

		this._buffer += chunk;
		this._parse();
	};

	Tokenizer.prototype._parse = function(){
		while(this._index < this._buffer.length && this._running){
			var c = this._buffer.charAt(this._index);
			if(this._state === TEXT) {
				this._stateText(c);
			} else if(this._state === BEFORE_TAG_NAME){
				this._stateBeforeTagName(c);
			} else if(this._state === IN_TAG_NAME) {
				this._stateInTagName(c);
			} else if(this._state === BEFORE_CLOSING_TAG_NAME){
				this._stateBeforeCloseingTagName(c);
			} else if(this._state === IN_CLOSING_TAG_NAME){
				this._stateInCloseingTagName(c);
			} else if(this._state === AFTER_CLOSING_TAG_NAME){
				this._stateAfterCloseingTagName(c);
			} else if(this._state === IN_SELF_CLOSING_TAG){
				this._stateInSelfClosingTag(c);
			}

			/*
			*	attributes
			*/
			else if(this._state === BEFORE_ATTRIBUTE_NAME){
				this._stateBeforeAttributeName(c);
			} else if(this._state === IN_ATTRIBUTE_NAME){
				this._stateInAttributeName(c);
			} else if(this._state === AFTER_ATTRIBUTE_NAME){
				this._stateAfterAttributeName(c);
			} else if(this._state === BEFORE_ATTRIBUTE_VALUE){
				this._stateBeforeAttributeValue(c);
			} else if(this._state === IN_ATTRIBUTE_VALUE_DQ){
				this._stateInAttributeValueDoubleQuotes(c);
			} else if(this._state === IN_ATTRIBUTE_VALUE_SQ){
				this._stateInAttributeValueSingleQuotes(c);
			} else if(this._state === IN_ATTRIBUTE_VALUE_NQ){
				this._stateInAttributeValueNoQuotes(c);
			}

			/*
			*	declarations
			*/
			else if(this._state === BEFORE_DECLARATION){
				this._stateBeforeDeclaration(c);
			} else if(this._state === IN_DECLARATION){
				this._stateInDeclaration(c);
			}

			/*
			*	processing instructions
			*/
			else if(this._state === IN_PROCESSING_INSTRUCTION){
				this._stateInProcessingInstruction(c);
			}

			/*
			*	comments
			*/
			else if(this._state === BEFORE_COMMENT){
				this._stateBeforeComment(c);
			} else if(this._state === IN_COMMENT){
				this._stateInComment(c);
			} else if(this._state === AFTER_COMMENT_1){
				this._stateAfterComment1(c);
			} else if(this._state === AFTER_COMMENT_2){
				this._stateAfterComment2(c);
			}

			/*
			*	cdata
			*/
			else if(this._state === BEFORE_CDATA_1){
				this._stateBeforeCdata1(c);
			} else if(this._state === BEFORE_CDATA_2){
				this._stateBeforeCdata2(c);
			} else if(this._state === BEFORE_CDATA_3){
				this._stateBeforeCdata3(c);
			} else if(this._state === BEFORE_CDATA_4){
				this._stateBeforeCdata4(c);
			} else if(this._state === BEFORE_CDATA_5){
				this._stateBeforeCdata5(c);
			} else if(this._state === BEFORE_CDATA_6){
				this._stateBeforeCdata6(c);
			} else if(this._state === IN_CDATA){
				this._stateInCdata(c);
			} else if(this._state === AFTER_CDATA_1){
				this._stateAfterCdata1(c);
			} else if(this._state === AFTER_CDATA_2){
				this._stateAfterCdata2(c);
			}

			/*
			* special tags
			*/
			else if(this._state === BEFORE_SPECIAL){
				this._stateBeforeSpecial(c);
			} else if(this._state === BEFORE_SPECIAL_END){
				this._stateBeforeSpecialEnd(c);
			}

			/*
			* script
			*/
			else if(this._state === BEFORE_SCRIPT_1){
				this._stateBeforeScript1(c);
			} else if(this._state === BEFORE_SCRIPT_2){
				this._stateBeforeScript2(c);
			} else if(this._state === BEFORE_SCRIPT_3){
				this._stateBeforeScript3(c);
			} else if(this._state === BEFORE_SCRIPT_4){
				this._stateBeforeScript4(c);
			} else if(this._state === BEFORE_SCRIPT_5){
				this._stateBeforeScript5(c);
			}

			else if(this._state === AFTER_SCRIPT_1){
				this._stateAfterScript1(c);
			} else if(this._state === AFTER_SCRIPT_2){
				this._stateAfterScript2(c);
			} else if(this._state === AFTER_SCRIPT_3){
				this._stateAfterScript3(c);
			} else if(this._state === AFTER_SCRIPT_4){
				this._stateAfterScript4(c);
			} else if(this._state === AFTER_SCRIPT_5){
				this._stateAfterScript5(c);
			}

			/*
			* style
			*/
			else if(this._state === BEFORE_STYLE_1){
				this._stateBeforeStyle1(c);
			} else if(this._state === BEFORE_STYLE_2){
				this._stateBeforeStyle2(c);
			} else if(this._state === BEFORE_STYLE_3){
				this._stateBeforeStyle3(c);
			} else if(this._state === BEFORE_STYLE_4){
				this._stateBeforeStyle4(c);
			}

			else if(this._state === AFTER_STYLE_1){
				this._stateAfterStyle1(c);
			} else if(this._state === AFTER_STYLE_2){
				this._stateAfterStyle2(c);
			} else if(this._state === AFTER_STYLE_3){
				this._stateAfterStyle3(c);
			} else if(this._state === AFTER_STYLE_4){
				this._stateAfterStyle4(c);
			}

			/*
			* entities
			*/
			else if(this._state === BEFORE_ENTITY){
				this._stateBeforeEntity(c);
			} else if(this._state === BEFORE_NUMERIC_ENTITY){
				this._stateBeforeNumericEntity(c);
			} else if(this._state === IN_NAMED_ENTITY){
				this._stateInNamedEntity(c);
			} else if(this._state === IN_NUMERIC_ENTITY){
				this._stateInNumericEntity(c);
			} else if(this._state === IN_HEX_ENTITY){
				this._stateInHexEntity(c);
			}

			else {
				this._cbs.onerror(Error("unknown _state"), this._state);
			}

			this._index++;
		}

		this._cleanup();
	};

	Tokenizer.prototype.pause = function(){
		this._running = false;
	};
	Tokenizer.prototype.resume = function(){
		this._running = true;

		if(this._index < this._buffer.length){
			this._parse();
		}
		if(this._ended){
			this._finish();
		}
	};

	Tokenizer.prototype.end = function(chunk){
		if(this._ended) this._cbs.onerror(Error(".end() after done!"));
		if(chunk) this.write(chunk);

		this._ended = true;

		if(this._running) this._finish();
	};

	Tokenizer.prototype._finish = function(){
		//if there is remaining data, emit it in a reasonable way
		if(this._sectionStart < this._index){
			this._handleTrailingData();
		}

		this._cbs.onend();
	};

	Tokenizer.prototype._handleTrailingData = function(){
		var data = this._buffer.substr(this._sectionStart);

		if(this._state === IN_CDATA || this._state === AFTER_CDATA_1 || this._state === AFTER_CDATA_2){
			this._cbs.oncdata(data);
		} else if(this._state === IN_COMMENT || this._state === AFTER_COMMENT_1 || this._state === AFTER_COMMENT_2){
			this._cbs.oncomment(data);
		} else if(this._state === IN_NAMED_ENTITY && !this._xmlMode){
			this._parseLegacyEntity();
			if(this._sectionStart < this._index){
				this._state = this._baseState;
				this._handleTrailingData();
			}
		} else if(this._state === IN_NUMERIC_ENTITY && !this._xmlMode){
			this._decodeNumericEntity(2, 10);
			if(this._sectionStart < this._index){
				this._state = this._baseState;
				this._handleTrailingData();
			}
		} else if(this._state === IN_HEX_ENTITY && !this._xmlMode){
			this._decodeNumericEntity(3, 16);
			if(this._sectionStart < this._index){
				this._state = this._baseState;
				this._handleTrailingData();
			}
		} else if(
			this._state !== IN_TAG_NAME &&
			this._state !== BEFORE_ATTRIBUTE_NAME &&
			this._state !== BEFORE_ATTRIBUTE_VALUE &&
			this._state !== AFTER_ATTRIBUTE_NAME &&
			this._state !== IN_ATTRIBUTE_NAME &&
			this._state !== IN_ATTRIBUTE_VALUE_SQ &&
			this._state !== IN_ATTRIBUTE_VALUE_DQ &&
			this._state !== IN_ATTRIBUTE_VALUE_NQ &&
			this._state !== IN_CLOSING_TAG_NAME
		){
			this._cbs.ontext(data);
		}
		//else, ignore remaining data
		//TODO add a way to remove current tag
	};

	Tokenizer.prototype.reset = function(){
		Tokenizer.call(this, {xmlMode: this._xmlMode, decodeEntities: this._decodeEntities}, this._cbs);
	};

	Tokenizer.prototype.getAbsoluteIndex = function(){
		return this._bufferOffset + this._index;
	};

	Tokenizer.prototype._getSection = function(){
		return this._buffer.substring(this._sectionStart, this._index);
	};

	Tokenizer.prototype._emitToken = function(name){
		this._cbs[name](this._getSection());
		this._sectionStart = -1;
	};

	Tokenizer.prototype._emitPartial = function(value){
		if(this._baseState !== TEXT){
			this._cbs.onattribdata(value); //TODO implement the new event
		} else {
			this._cbs.ontext(value);
		}
	};


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var decodeMap = __webpack_require__(41);

	module.exports = decodeCodePoint;

	// modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
	function decodeCodePoint(codePoint){

		if((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF){
			return "\uFFFD";
		}

		if(codePoint in decodeMap){
			codePoint = decodeMap[codePoint];
		}

		var output = "";

		if(codePoint > 0xFFFF){
			codePoint -= 0x10000;
			output += String.fromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
			codePoint = 0xDC00 | codePoint & 0x3FF;
		}

		output += String.fromCharCode(codePoint);
		return output;
	}


/***/ },
/* 41 */
/***/ function(module, exports) {

	module.exports = {
		"0": 65533,
		"128": 8364,
		"130": 8218,
		"131": 402,
		"132": 8222,
		"133": 8230,
		"134": 8224,
		"135": 8225,
		"136": 710,
		"137": 8240,
		"138": 352,
		"139": 8249,
		"140": 338,
		"142": 381,
		"145": 8216,
		"146": 8217,
		"147": 8220,
		"148": 8221,
		"149": 8226,
		"150": 8211,
		"151": 8212,
		"152": 732,
		"153": 8482,
		"154": 353,
		"155": 8250,
		"156": 339,
		"158": 382,
		"159": 376
	};

/***/ },
/* 42 */
/***/ function(module, exports) {

	module.exports = {
		"Aacute": "Á",
		"aacute": "á",
		"Abreve": "Ă",
		"abreve": "ă",
		"ac": "∾",
		"acd": "∿",
		"acE": "∾̳",
		"Acirc": "Â",
		"acirc": "â",
		"acute": "´",
		"Acy": "А",
		"acy": "а",
		"AElig": "Æ",
		"aelig": "æ",
		"af": "⁡",
		"Afr": "𝔄",
		"afr": "𝔞",
		"Agrave": "À",
		"agrave": "à",
		"alefsym": "ℵ",
		"aleph": "ℵ",
		"Alpha": "Α",
		"alpha": "α",
		"Amacr": "Ā",
		"amacr": "ā",
		"amalg": "⨿",
		"amp": "&",
		"AMP": "&",
		"andand": "⩕",
		"And": "⩓",
		"and": "∧",
		"andd": "⩜",
		"andslope": "⩘",
		"andv": "⩚",
		"ang": "∠",
		"ange": "⦤",
		"angle": "∠",
		"angmsdaa": "⦨",
		"angmsdab": "⦩",
		"angmsdac": "⦪",
		"angmsdad": "⦫",
		"angmsdae": "⦬",
		"angmsdaf": "⦭",
		"angmsdag": "⦮",
		"angmsdah": "⦯",
		"angmsd": "∡",
		"angrt": "∟",
		"angrtvb": "⊾",
		"angrtvbd": "⦝",
		"angsph": "∢",
		"angst": "Å",
		"angzarr": "⍼",
		"Aogon": "Ą",
		"aogon": "ą",
		"Aopf": "𝔸",
		"aopf": "𝕒",
		"apacir": "⩯",
		"ap": "≈",
		"apE": "⩰",
		"ape": "≊",
		"apid": "≋",
		"apos": "'",
		"ApplyFunction": "⁡",
		"approx": "≈",
		"approxeq": "≊",
		"Aring": "Å",
		"aring": "å",
		"Ascr": "𝒜",
		"ascr": "𝒶",
		"Assign": "≔",
		"ast": "*",
		"asymp": "≈",
		"asympeq": "≍",
		"Atilde": "Ã",
		"atilde": "ã",
		"Auml": "Ä",
		"auml": "ä",
		"awconint": "∳",
		"awint": "⨑",
		"backcong": "≌",
		"backepsilon": "϶",
		"backprime": "‵",
		"backsim": "∽",
		"backsimeq": "⋍",
		"Backslash": "∖",
		"Barv": "⫧",
		"barvee": "⊽",
		"barwed": "⌅",
		"Barwed": "⌆",
		"barwedge": "⌅",
		"bbrk": "⎵",
		"bbrktbrk": "⎶",
		"bcong": "≌",
		"Bcy": "Б",
		"bcy": "б",
		"bdquo": "„",
		"becaus": "∵",
		"because": "∵",
		"Because": "∵",
		"bemptyv": "⦰",
		"bepsi": "϶",
		"bernou": "ℬ",
		"Bernoullis": "ℬ",
		"Beta": "Β",
		"beta": "β",
		"beth": "ℶ",
		"between": "≬",
		"Bfr": "𝔅",
		"bfr": "𝔟",
		"bigcap": "⋂",
		"bigcirc": "◯",
		"bigcup": "⋃",
		"bigodot": "⨀",
		"bigoplus": "⨁",
		"bigotimes": "⨂",
		"bigsqcup": "⨆",
		"bigstar": "★",
		"bigtriangledown": "▽",
		"bigtriangleup": "△",
		"biguplus": "⨄",
		"bigvee": "⋁",
		"bigwedge": "⋀",
		"bkarow": "⤍",
		"blacklozenge": "⧫",
		"blacksquare": "▪",
		"blacktriangle": "▴",
		"blacktriangledown": "▾",
		"blacktriangleleft": "◂",
		"blacktriangleright": "▸",
		"blank": "␣",
		"blk12": "▒",
		"blk14": "░",
		"blk34": "▓",
		"block": "█",
		"bne": "=⃥",
		"bnequiv": "≡⃥",
		"bNot": "⫭",
		"bnot": "⌐",
		"Bopf": "𝔹",
		"bopf": "𝕓",
		"bot": "⊥",
		"bottom": "⊥",
		"bowtie": "⋈",
		"boxbox": "⧉",
		"boxdl": "┐",
		"boxdL": "╕",
		"boxDl": "╖",
		"boxDL": "╗",
		"boxdr": "┌",
		"boxdR": "╒",
		"boxDr": "╓",
		"boxDR": "╔",
		"boxh": "─",
		"boxH": "═",
		"boxhd": "┬",
		"boxHd": "╤",
		"boxhD": "╥",
		"boxHD": "╦",
		"boxhu": "┴",
		"boxHu": "╧",
		"boxhU": "╨",
		"boxHU": "╩",
		"boxminus": "⊟",
		"boxplus": "⊞",
		"boxtimes": "⊠",
		"boxul": "┘",
		"boxuL": "╛",
		"boxUl": "╜",
		"boxUL": "╝",
		"boxur": "└",
		"boxuR": "╘",
		"boxUr": "╙",
		"boxUR": "╚",
		"boxv": "│",
		"boxV": "║",
		"boxvh": "┼",
		"boxvH": "╪",
		"boxVh": "╫",
		"boxVH": "╬",
		"boxvl": "┤",
		"boxvL": "╡",
		"boxVl": "╢",
		"boxVL": "╣",
		"boxvr": "├",
		"boxvR": "╞",
		"boxVr": "╟",
		"boxVR": "╠",
		"bprime": "‵",
		"breve": "˘",
		"Breve": "˘",
		"brvbar": "¦",
		"bscr": "𝒷",
		"Bscr": "ℬ",
		"bsemi": "⁏",
		"bsim": "∽",
		"bsime": "⋍",
		"bsolb": "⧅",
		"bsol": "\\",
		"bsolhsub": "⟈",
		"bull": "•",
		"bullet": "•",
		"bump": "≎",
		"bumpE": "⪮",
		"bumpe": "≏",
		"Bumpeq": "≎",
		"bumpeq": "≏",
		"Cacute": "Ć",
		"cacute": "ć",
		"capand": "⩄",
		"capbrcup": "⩉",
		"capcap": "⩋",
		"cap": "∩",
		"Cap": "⋒",
		"capcup": "⩇",
		"capdot": "⩀",
		"CapitalDifferentialD": "ⅅ",
		"caps": "∩︀",
		"caret": "⁁",
		"caron": "ˇ",
		"Cayleys": "ℭ",
		"ccaps": "⩍",
		"Ccaron": "Č",
		"ccaron": "č",
		"Ccedil": "Ç",
		"ccedil": "ç",
		"Ccirc": "Ĉ",
		"ccirc": "ĉ",
		"Cconint": "∰",
		"ccups": "⩌",
		"ccupssm": "⩐",
		"Cdot": "Ċ",
		"cdot": "ċ",
		"cedil": "¸",
		"Cedilla": "¸",
		"cemptyv": "⦲",
		"cent": "¢",
		"centerdot": "·",
		"CenterDot": "·",
		"cfr": "𝔠",
		"Cfr": "ℭ",
		"CHcy": "Ч",
		"chcy": "ч",
		"check": "✓",
		"checkmark": "✓",
		"Chi": "Χ",
		"chi": "χ",
		"circ": "ˆ",
		"circeq": "≗",
		"circlearrowleft": "↺",
		"circlearrowright": "↻",
		"circledast": "⊛",
		"circledcirc": "⊚",
		"circleddash": "⊝",
		"CircleDot": "⊙",
		"circledR": "®",
		"circledS": "Ⓢ",
		"CircleMinus": "⊖",
		"CirclePlus": "⊕",
		"CircleTimes": "⊗",
		"cir": "○",
		"cirE": "⧃",
		"cire": "≗",
		"cirfnint": "⨐",
		"cirmid": "⫯",
		"cirscir": "⧂",
		"ClockwiseContourIntegral": "∲",
		"CloseCurlyDoubleQuote": "”",
		"CloseCurlyQuote": "’",
		"clubs": "♣",
		"clubsuit": "♣",
		"colon": ":",
		"Colon": "∷",
		"Colone": "⩴",
		"colone": "≔",
		"coloneq": "≔",
		"comma": ",",
		"commat": "@",
		"comp": "∁",
		"compfn": "∘",
		"complement": "∁",
		"complexes": "ℂ",
		"cong": "≅",
		"congdot": "⩭",
		"Congruent": "≡",
		"conint": "∮",
		"Conint": "∯",
		"ContourIntegral": "∮",
		"copf": "𝕔",
		"Copf": "ℂ",
		"coprod": "∐",
		"Coproduct": "∐",
		"copy": "©",
		"COPY": "©",
		"copysr": "℗",
		"CounterClockwiseContourIntegral": "∳",
		"crarr": "↵",
		"cross": "✗",
		"Cross": "⨯",
		"Cscr": "𝒞",
		"cscr": "𝒸",
		"csub": "⫏",
		"csube": "⫑",
		"csup": "⫐",
		"csupe": "⫒",
		"ctdot": "⋯",
		"cudarrl": "⤸",
		"cudarrr": "⤵",
		"cuepr": "⋞",
		"cuesc": "⋟",
		"cularr": "↶",
		"cularrp": "⤽",
		"cupbrcap": "⩈",
		"cupcap": "⩆",
		"CupCap": "≍",
		"cup": "∪",
		"Cup": "⋓",
		"cupcup": "⩊",
		"cupdot": "⊍",
		"cupor": "⩅",
		"cups": "∪︀",
		"curarr": "↷",
		"curarrm": "⤼",
		"curlyeqprec": "⋞",
		"curlyeqsucc": "⋟",
		"curlyvee": "⋎",
		"curlywedge": "⋏",
		"curren": "¤",
		"curvearrowleft": "↶",
		"curvearrowright": "↷",
		"cuvee": "⋎",
		"cuwed": "⋏",
		"cwconint": "∲",
		"cwint": "∱",
		"cylcty": "⌭",
		"dagger": "†",
		"Dagger": "‡",
		"daleth": "ℸ",
		"darr": "↓",
		"Darr": "↡",
		"dArr": "⇓",
		"dash": "‐",
		"Dashv": "⫤",
		"dashv": "⊣",
		"dbkarow": "⤏",
		"dblac": "˝",
		"Dcaron": "Ď",
		"dcaron": "ď",
		"Dcy": "Д",
		"dcy": "д",
		"ddagger": "‡",
		"ddarr": "⇊",
		"DD": "ⅅ",
		"dd": "ⅆ",
		"DDotrahd": "⤑",
		"ddotseq": "⩷",
		"deg": "°",
		"Del": "∇",
		"Delta": "Δ",
		"delta": "δ",
		"demptyv": "⦱",
		"dfisht": "⥿",
		"Dfr": "𝔇",
		"dfr": "𝔡",
		"dHar": "⥥",
		"dharl": "⇃",
		"dharr": "⇂",
		"DiacriticalAcute": "´",
		"DiacriticalDot": "˙",
		"DiacriticalDoubleAcute": "˝",
		"DiacriticalGrave": "`",
		"DiacriticalTilde": "˜",
		"diam": "⋄",
		"diamond": "⋄",
		"Diamond": "⋄",
		"diamondsuit": "♦",
		"diams": "♦",
		"die": "¨",
		"DifferentialD": "ⅆ",
		"digamma": "ϝ",
		"disin": "⋲",
		"div": "÷",
		"divide": "÷",
		"divideontimes": "⋇",
		"divonx": "⋇",
		"DJcy": "Ђ",
		"djcy": "ђ",
		"dlcorn": "⌞",
		"dlcrop": "⌍",
		"dollar": "$",
		"Dopf": "𝔻",
		"dopf": "𝕕",
		"Dot": "¨",
		"dot": "˙",
		"DotDot": "⃜",
		"doteq": "≐",
		"doteqdot": "≑",
		"DotEqual": "≐",
		"dotminus": "∸",
		"dotplus": "∔",
		"dotsquare": "⊡",
		"doublebarwedge": "⌆",
		"DoubleContourIntegral": "∯",
		"DoubleDot": "¨",
		"DoubleDownArrow": "⇓",
		"DoubleLeftArrow": "⇐",
		"DoubleLeftRightArrow": "⇔",
		"DoubleLeftTee": "⫤",
		"DoubleLongLeftArrow": "⟸",
		"DoubleLongLeftRightArrow": "⟺",
		"DoubleLongRightArrow": "⟹",
		"DoubleRightArrow": "⇒",
		"DoubleRightTee": "⊨",
		"DoubleUpArrow": "⇑",
		"DoubleUpDownArrow": "⇕",
		"DoubleVerticalBar": "∥",
		"DownArrowBar": "⤓",
		"downarrow": "↓",
		"DownArrow": "↓",
		"Downarrow": "⇓",
		"DownArrowUpArrow": "⇵",
		"DownBreve": "̑",
		"downdownarrows": "⇊",
		"downharpoonleft": "⇃",
		"downharpoonright": "⇂",
		"DownLeftRightVector": "⥐",
		"DownLeftTeeVector": "⥞",
		"DownLeftVectorBar": "⥖",
		"DownLeftVector": "↽",
		"DownRightTeeVector": "⥟",
		"DownRightVectorBar": "⥗",
		"DownRightVector": "⇁",
		"DownTeeArrow": "↧",
		"DownTee": "⊤",
		"drbkarow": "⤐",
		"drcorn": "⌟",
		"drcrop": "⌌",
		"Dscr": "𝒟",
		"dscr": "𝒹",
		"DScy": "Ѕ",
		"dscy": "ѕ",
		"dsol": "⧶",
		"Dstrok": "Đ",
		"dstrok": "đ",
		"dtdot": "⋱",
		"dtri": "▿",
		"dtrif": "▾",
		"duarr": "⇵",
		"duhar": "⥯",
		"dwangle": "⦦",
		"DZcy": "Џ",
		"dzcy": "џ",
		"dzigrarr": "⟿",
		"Eacute": "É",
		"eacute": "é",
		"easter": "⩮",
		"Ecaron": "Ě",
		"ecaron": "ě",
		"Ecirc": "Ê",
		"ecirc": "ê",
		"ecir": "≖",
		"ecolon": "≕",
		"Ecy": "Э",
		"ecy": "э",
		"eDDot": "⩷",
		"Edot": "Ė",
		"edot": "ė",
		"eDot": "≑",
		"ee": "ⅇ",
		"efDot": "≒",
		"Efr": "𝔈",
		"efr": "𝔢",
		"eg": "⪚",
		"Egrave": "È",
		"egrave": "è",
		"egs": "⪖",
		"egsdot": "⪘",
		"el": "⪙",
		"Element": "∈",
		"elinters": "⏧",
		"ell": "ℓ",
		"els": "⪕",
		"elsdot": "⪗",
		"Emacr": "Ē",
		"emacr": "ē",
		"empty": "∅",
		"emptyset": "∅",
		"EmptySmallSquare": "◻",
		"emptyv": "∅",
		"EmptyVerySmallSquare": "▫",
		"emsp13": " ",
		"emsp14": " ",
		"emsp": " ",
		"ENG": "Ŋ",
		"eng": "ŋ",
		"ensp": " ",
		"Eogon": "Ę",
		"eogon": "ę",
		"Eopf": "𝔼",
		"eopf": "𝕖",
		"epar": "⋕",
		"eparsl": "⧣",
		"eplus": "⩱",
		"epsi": "ε",
		"Epsilon": "Ε",
		"epsilon": "ε",
		"epsiv": "ϵ",
		"eqcirc": "≖",
		"eqcolon": "≕",
		"eqsim": "≂",
		"eqslantgtr": "⪖",
		"eqslantless": "⪕",
		"Equal": "⩵",
		"equals": "=",
		"EqualTilde": "≂",
		"equest": "≟",
		"Equilibrium": "⇌",
		"equiv": "≡",
		"equivDD": "⩸",
		"eqvparsl": "⧥",
		"erarr": "⥱",
		"erDot": "≓",
		"escr": "ℯ",
		"Escr": "ℰ",
		"esdot": "≐",
		"Esim": "⩳",
		"esim": "≂",
		"Eta": "Η",
		"eta": "η",
		"ETH": "Ð",
		"eth": "ð",
		"Euml": "Ë",
		"euml": "ë",
		"euro": "€",
		"excl": "!",
		"exist": "∃",
		"Exists": "∃",
		"expectation": "ℰ",
		"exponentiale": "ⅇ",
		"ExponentialE": "ⅇ",
		"fallingdotseq": "≒",
		"Fcy": "Ф",
		"fcy": "ф",
		"female": "♀",
		"ffilig": "ﬃ",
		"fflig": "ﬀ",
		"ffllig": "ﬄ",
		"Ffr": "𝔉",
		"ffr": "𝔣",
		"filig": "ﬁ",
		"FilledSmallSquare": "◼",
		"FilledVerySmallSquare": "▪",
		"fjlig": "fj",
		"flat": "♭",
		"fllig": "ﬂ",
		"fltns": "▱",
		"fnof": "ƒ",
		"Fopf": "𝔽",
		"fopf": "𝕗",
		"forall": "∀",
		"ForAll": "∀",
		"fork": "⋔",
		"forkv": "⫙",
		"Fouriertrf": "ℱ",
		"fpartint": "⨍",
		"frac12": "½",
		"frac13": "⅓",
		"frac14": "¼",
		"frac15": "⅕",
		"frac16": "⅙",
		"frac18": "⅛",
		"frac23": "⅔",
		"frac25": "⅖",
		"frac34": "¾",
		"frac35": "⅗",
		"frac38": "⅜",
		"frac45": "⅘",
		"frac56": "⅚",
		"frac58": "⅝",
		"frac78": "⅞",
		"frasl": "⁄",
		"frown": "⌢",
		"fscr": "𝒻",
		"Fscr": "ℱ",
		"gacute": "ǵ",
		"Gamma": "Γ",
		"gamma": "γ",
		"Gammad": "Ϝ",
		"gammad": "ϝ",
		"gap": "⪆",
		"Gbreve": "Ğ",
		"gbreve": "ğ",
		"Gcedil": "Ģ",
		"Gcirc": "Ĝ",
		"gcirc": "ĝ",
		"Gcy": "Г",
		"gcy": "г",
		"Gdot": "Ġ",
		"gdot": "ġ",
		"ge": "≥",
		"gE": "≧",
		"gEl": "⪌",
		"gel": "⋛",
		"geq": "≥",
		"geqq": "≧",
		"geqslant": "⩾",
		"gescc": "⪩",
		"ges": "⩾",
		"gesdot": "⪀",
		"gesdoto": "⪂",
		"gesdotol": "⪄",
		"gesl": "⋛︀",
		"gesles": "⪔",
		"Gfr": "𝔊",
		"gfr": "𝔤",
		"gg": "≫",
		"Gg": "⋙",
		"ggg": "⋙",
		"gimel": "ℷ",
		"GJcy": "Ѓ",
		"gjcy": "ѓ",
		"gla": "⪥",
		"gl": "≷",
		"glE": "⪒",
		"glj": "⪤",
		"gnap": "⪊",
		"gnapprox": "⪊",
		"gne": "⪈",
		"gnE": "≩",
		"gneq": "⪈",
		"gneqq": "≩",
		"gnsim": "⋧",
		"Gopf": "𝔾",
		"gopf": "𝕘",
		"grave": "`",
		"GreaterEqual": "≥",
		"GreaterEqualLess": "⋛",
		"GreaterFullEqual": "≧",
		"GreaterGreater": "⪢",
		"GreaterLess": "≷",
		"GreaterSlantEqual": "⩾",
		"GreaterTilde": "≳",
		"Gscr": "𝒢",
		"gscr": "ℊ",
		"gsim": "≳",
		"gsime": "⪎",
		"gsiml": "⪐",
		"gtcc": "⪧",
		"gtcir": "⩺",
		"gt": ">",
		"GT": ">",
		"Gt": "≫",
		"gtdot": "⋗",
		"gtlPar": "⦕",
		"gtquest": "⩼",
		"gtrapprox": "⪆",
		"gtrarr": "⥸",
		"gtrdot": "⋗",
		"gtreqless": "⋛",
		"gtreqqless": "⪌",
		"gtrless": "≷",
		"gtrsim": "≳",
		"gvertneqq": "≩︀",
		"gvnE": "≩︀",
		"Hacek": "ˇ",
		"hairsp": " ",
		"half": "½",
		"hamilt": "ℋ",
		"HARDcy": "Ъ",
		"hardcy": "ъ",
		"harrcir": "⥈",
		"harr": "↔",
		"hArr": "⇔",
		"harrw": "↭",
		"Hat": "^",
		"hbar": "ℏ",
		"Hcirc": "Ĥ",
		"hcirc": "ĥ",
		"hearts": "♥",
		"heartsuit": "♥",
		"hellip": "…",
		"hercon": "⊹",
		"hfr": "𝔥",
		"Hfr": "ℌ",
		"HilbertSpace": "ℋ",
		"hksearow": "⤥",
		"hkswarow": "⤦",
		"hoarr": "⇿",
		"homtht": "∻",
		"hookleftarrow": "↩",
		"hookrightarrow": "↪",
		"hopf": "𝕙",
		"Hopf": "ℍ",
		"horbar": "―",
		"HorizontalLine": "─",
		"hscr": "𝒽",
		"Hscr": "ℋ",
		"hslash": "ℏ",
		"Hstrok": "Ħ",
		"hstrok": "ħ",
		"HumpDownHump": "≎",
		"HumpEqual": "≏",
		"hybull": "⁃",
		"hyphen": "‐",
		"Iacute": "Í",
		"iacute": "í",
		"ic": "⁣",
		"Icirc": "Î",
		"icirc": "î",
		"Icy": "И",
		"icy": "и",
		"Idot": "İ",
		"IEcy": "Е",
		"iecy": "е",
		"iexcl": "¡",
		"iff": "⇔",
		"ifr": "𝔦",
		"Ifr": "ℑ",
		"Igrave": "Ì",
		"igrave": "ì",
		"ii": "ⅈ",
		"iiiint": "⨌",
		"iiint": "∭",
		"iinfin": "⧜",
		"iiota": "℩",
		"IJlig": "Ĳ",
		"ijlig": "ĳ",
		"Imacr": "Ī",
		"imacr": "ī",
		"image": "ℑ",
		"ImaginaryI": "ⅈ",
		"imagline": "ℐ",
		"imagpart": "ℑ",
		"imath": "ı",
		"Im": "ℑ",
		"imof": "⊷",
		"imped": "Ƶ",
		"Implies": "⇒",
		"incare": "℅",
		"in": "∈",
		"infin": "∞",
		"infintie": "⧝",
		"inodot": "ı",
		"intcal": "⊺",
		"int": "∫",
		"Int": "∬",
		"integers": "ℤ",
		"Integral": "∫",
		"intercal": "⊺",
		"Intersection": "⋂",
		"intlarhk": "⨗",
		"intprod": "⨼",
		"InvisibleComma": "⁣",
		"InvisibleTimes": "⁢",
		"IOcy": "Ё",
		"iocy": "ё",
		"Iogon": "Į",
		"iogon": "į",
		"Iopf": "𝕀",
		"iopf": "𝕚",
		"Iota": "Ι",
		"iota": "ι",
		"iprod": "⨼",
		"iquest": "¿",
		"iscr": "𝒾",
		"Iscr": "ℐ",
		"isin": "∈",
		"isindot": "⋵",
		"isinE": "⋹",
		"isins": "⋴",
		"isinsv": "⋳",
		"isinv": "∈",
		"it": "⁢",
		"Itilde": "Ĩ",
		"itilde": "ĩ",
		"Iukcy": "І",
		"iukcy": "і",
		"Iuml": "Ï",
		"iuml": "ï",
		"Jcirc": "Ĵ",
		"jcirc": "ĵ",
		"Jcy": "Й",
		"jcy": "й",
		"Jfr": "𝔍",
		"jfr": "𝔧",
		"jmath": "ȷ",
		"Jopf": "𝕁",
		"jopf": "𝕛",
		"Jscr": "𝒥",
		"jscr": "𝒿",
		"Jsercy": "Ј",
		"jsercy": "ј",
		"Jukcy": "Є",
		"jukcy": "є",
		"Kappa": "Κ",
		"kappa": "κ",
		"kappav": "ϰ",
		"Kcedil": "Ķ",
		"kcedil": "ķ",
		"Kcy": "К",
		"kcy": "к",
		"Kfr": "𝔎",
		"kfr": "𝔨",
		"kgreen": "ĸ",
		"KHcy": "Х",
		"khcy": "х",
		"KJcy": "Ќ",
		"kjcy": "ќ",
		"Kopf": "𝕂",
		"kopf": "𝕜",
		"Kscr": "𝒦",
		"kscr": "𝓀",
		"lAarr": "⇚",
		"Lacute": "Ĺ",
		"lacute": "ĺ",
		"laemptyv": "⦴",
		"lagran": "ℒ",
		"Lambda": "Λ",
		"lambda": "λ",
		"lang": "⟨",
		"Lang": "⟪",
		"langd": "⦑",
		"langle": "⟨",
		"lap": "⪅",
		"Laplacetrf": "ℒ",
		"laquo": "«",
		"larrb": "⇤",
		"larrbfs": "⤟",
		"larr": "←",
		"Larr": "↞",
		"lArr": "⇐",
		"larrfs": "⤝",
		"larrhk": "↩",
		"larrlp": "↫",
		"larrpl": "⤹",
		"larrsim": "⥳",
		"larrtl": "↢",
		"latail": "⤙",
		"lAtail": "⤛",
		"lat": "⪫",
		"late": "⪭",
		"lates": "⪭︀",
		"lbarr": "⤌",
		"lBarr": "⤎",
		"lbbrk": "❲",
		"lbrace": "{",
		"lbrack": "[",
		"lbrke": "⦋",
		"lbrksld": "⦏",
		"lbrkslu": "⦍",
		"Lcaron": "Ľ",
		"lcaron": "ľ",
		"Lcedil": "Ļ",
		"lcedil": "ļ",
		"lceil": "⌈",
		"lcub": "{",
		"Lcy": "Л",
		"lcy": "л",
		"ldca": "⤶",
		"ldquo": "“",
		"ldquor": "„",
		"ldrdhar": "⥧",
		"ldrushar": "⥋",
		"ldsh": "↲",
		"le": "≤",
		"lE": "≦",
		"LeftAngleBracket": "⟨",
		"LeftArrowBar": "⇤",
		"leftarrow": "←",
		"LeftArrow": "←",
		"Leftarrow": "⇐",
		"LeftArrowRightArrow": "⇆",
		"leftarrowtail": "↢",
		"LeftCeiling": "⌈",
		"LeftDoubleBracket": "⟦",
		"LeftDownTeeVector": "⥡",
		"LeftDownVectorBar": "⥙",
		"LeftDownVector": "⇃",
		"LeftFloor": "⌊",
		"leftharpoondown": "↽",
		"leftharpoonup": "↼",
		"leftleftarrows": "⇇",
		"leftrightarrow": "↔",
		"LeftRightArrow": "↔",
		"Leftrightarrow": "⇔",
		"leftrightarrows": "⇆",
		"leftrightharpoons": "⇋",
		"leftrightsquigarrow": "↭",
		"LeftRightVector": "⥎",
		"LeftTeeArrow": "↤",
		"LeftTee": "⊣",
		"LeftTeeVector": "⥚",
		"leftthreetimes": "⋋",
		"LeftTriangleBar": "⧏",
		"LeftTriangle": "⊲",
		"LeftTriangleEqual": "⊴",
		"LeftUpDownVector": "⥑",
		"LeftUpTeeVector": "⥠",
		"LeftUpVectorBar": "⥘",
		"LeftUpVector": "↿",
		"LeftVectorBar": "⥒",
		"LeftVector": "↼",
		"lEg": "⪋",
		"leg": "⋚",
		"leq": "≤",
		"leqq": "≦",
		"leqslant": "⩽",
		"lescc": "⪨",
		"les": "⩽",
		"lesdot": "⩿",
		"lesdoto": "⪁",
		"lesdotor": "⪃",
		"lesg": "⋚︀",
		"lesges": "⪓",
		"lessapprox": "⪅",
		"lessdot": "⋖",
		"lesseqgtr": "⋚",
		"lesseqqgtr": "⪋",
		"LessEqualGreater": "⋚",
		"LessFullEqual": "≦",
		"LessGreater": "≶",
		"lessgtr": "≶",
		"LessLess": "⪡",
		"lesssim": "≲",
		"LessSlantEqual": "⩽",
		"LessTilde": "≲",
		"lfisht": "⥼",
		"lfloor": "⌊",
		"Lfr": "𝔏",
		"lfr": "𝔩",
		"lg": "≶",
		"lgE": "⪑",
		"lHar": "⥢",
		"lhard": "↽",
		"lharu": "↼",
		"lharul": "⥪",
		"lhblk": "▄",
		"LJcy": "Љ",
		"ljcy": "љ",
		"llarr": "⇇",
		"ll": "≪",
		"Ll": "⋘",
		"llcorner": "⌞",
		"Lleftarrow": "⇚",
		"llhard": "⥫",
		"lltri": "◺",
		"Lmidot": "Ŀ",
		"lmidot": "ŀ",
		"lmoustache": "⎰",
		"lmoust": "⎰",
		"lnap": "⪉",
		"lnapprox": "⪉",
		"lne": "⪇",
		"lnE": "≨",
		"lneq": "⪇",
		"lneqq": "≨",
		"lnsim": "⋦",
		"loang": "⟬",
		"loarr": "⇽",
		"lobrk": "⟦",
		"longleftarrow": "⟵",
		"LongLeftArrow": "⟵",
		"Longleftarrow": "⟸",
		"longleftrightarrow": "⟷",
		"LongLeftRightArrow": "⟷",
		"Longleftrightarrow": "⟺",
		"longmapsto": "⟼",
		"longrightarrow": "⟶",
		"LongRightArrow": "⟶",
		"Longrightarrow": "⟹",
		"looparrowleft": "↫",
		"looparrowright": "↬",
		"lopar": "⦅",
		"Lopf": "𝕃",
		"lopf": "𝕝",
		"loplus": "⨭",
		"lotimes": "⨴",
		"lowast": "∗",
		"lowbar": "_",
		"LowerLeftArrow": "↙",
		"LowerRightArrow": "↘",
		"loz": "◊",
		"lozenge": "◊",
		"lozf": "⧫",
		"lpar": "(",
		"lparlt": "⦓",
		"lrarr": "⇆",
		"lrcorner": "⌟",
		"lrhar": "⇋",
		"lrhard": "⥭",
		"lrm": "‎",
		"lrtri": "⊿",
		"lsaquo": "‹",
		"lscr": "𝓁",
		"Lscr": "ℒ",
		"lsh": "↰",
		"Lsh": "↰",
		"lsim": "≲",
		"lsime": "⪍",
		"lsimg": "⪏",
		"lsqb": "[",
		"lsquo": "‘",
		"lsquor": "‚",
		"Lstrok": "Ł",
		"lstrok": "ł",
		"ltcc": "⪦",
		"ltcir": "⩹",
		"lt": "<",
		"LT": "<",
		"Lt": "≪",
		"ltdot": "⋖",
		"lthree": "⋋",
		"ltimes": "⋉",
		"ltlarr": "⥶",
		"ltquest": "⩻",
		"ltri": "◃",
		"ltrie": "⊴",
		"ltrif": "◂",
		"ltrPar": "⦖",
		"lurdshar": "⥊",
		"luruhar": "⥦",
		"lvertneqq": "≨︀",
		"lvnE": "≨︀",
		"macr": "¯",
		"male": "♂",
		"malt": "✠",
		"maltese": "✠",
		"Map": "⤅",
		"map": "↦",
		"mapsto": "↦",
		"mapstodown": "↧",
		"mapstoleft": "↤",
		"mapstoup": "↥",
		"marker": "▮",
		"mcomma": "⨩",
		"Mcy": "М",
		"mcy": "м",
		"mdash": "—",
		"mDDot": "∺",
		"measuredangle": "∡",
		"MediumSpace": " ",
		"Mellintrf": "ℳ",
		"Mfr": "𝔐",
		"mfr": "𝔪",
		"mho": "℧",
		"micro": "µ",
		"midast": "*",
		"midcir": "⫰",
		"mid": "∣",
		"middot": "·",
		"minusb": "⊟",
		"minus": "−",
		"minusd": "∸",
		"minusdu": "⨪",
		"MinusPlus": "∓",
		"mlcp": "⫛",
		"mldr": "…",
		"mnplus": "∓",
		"models": "⊧",
		"Mopf": "𝕄",
		"mopf": "𝕞",
		"mp": "∓",
		"mscr": "𝓂",
		"Mscr": "ℳ",
		"mstpos": "∾",
		"Mu": "Μ",
		"mu": "μ",
		"multimap": "⊸",
		"mumap": "⊸",
		"nabla": "∇",
		"Nacute": "Ń",
		"nacute": "ń",
		"nang": "∠⃒",
		"nap": "≉",
		"napE": "⩰̸",
		"napid": "≋̸",
		"napos": "ŉ",
		"napprox": "≉",
		"natural": "♮",
		"naturals": "ℕ",
		"natur": "♮",
		"nbsp": " ",
		"nbump": "≎̸",
		"nbumpe": "≏̸",
		"ncap": "⩃",
		"Ncaron": "Ň",
		"ncaron": "ň",
		"Ncedil": "Ņ",
		"ncedil": "ņ",
		"ncong": "≇",
		"ncongdot": "⩭̸",
		"ncup": "⩂",
		"Ncy": "Н",
		"ncy": "н",
		"ndash": "–",
		"nearhk": "⤤",
		"nearr": "↗",
		"neArr": "⇗",
		"nearrow": "↗",
		"ne": "≠",
		"nedot": "≐̸",
		"NegativeMediumSpace": "​",
		"NegativeThickSpace": "​",
		"NegativeThinSpace": "​",
		"NegativeVeryThinSpace": "​",
		"nequiv": "≢",
		"nesear": "⤨",
		"nesim": "≂̸",
		"NestedGreaterGreater": "≫",
		"NestedLessLess": "≪",
		"NewLine": "\n",
		"nexist": "∄",
		"nexists": "∄",
		"Nfr": "𝔑",
		"nfr": "𝔫",
		"ngE": "≧̸",
		"nge": "≱",
		"ngeq": "≱",
		"ngeqq": "≧̸",
		"ngeqslant": "⩾̸",
		"nges": "⩾̸",
		"nGg": "⋙̸",
		"ngsim": "≵",
		"nGt": "≫⃒",
		"ngt": "≯",
		"ngtr": "≯",
		"nGtv": "≫̸",
		"nharr": "↮",
		"nhArr": "⇎",
		"nhpar": "⫲",
		"ni": "∋",
		"nis": "⋼",
		"nisd": "⋺",
		"niv": "∋",
		"NJcy": "Њ",
		"njcy": "њ",
		"nlarr": "↚",
		"nlArr": "⇍",
		"nldr": "‥",
		"nlE": "≦̸",
		"nle": "≰",
		"nleftarrow": "↚",
		"nLeftarrow": "⇍",
		"nleftrightarrow": "↮",
		"nLeftrightarrow": "⇎",
		"nleq": "≰",
		"nleqq": "≦̸",
		"nleqslant": "⩽̸",
		"nles": "⩽̸",
		"nless": "≮",
		"nLl": "⋘̸",
		"nlsim": "≴",
		"nLt": "≪⃒",
		"nlt": "≮",
		"nltri": "⋪",
		"nltrie": "⋬",
		"nLtv": "≪̸",
		"nmid": "∤",
		"NoBreak": "⁠",
		"NonBreakingSpace": " ",
		"nopf": "𝕟",
		"Nopf": "ℕ",
		"Not": "⫬",
		"not": "¬",
		"NotCongruent": "≢",
		"NotCupCap": "≭",
		"NotDoubleVerticalBar": "∦",
		"NotElement": "∉",
		"NotEqual": "≠",
		"NotEqualTilde": "≂̸",
		"NotExists": "∄",
		"NotGreater": "≯",
		"NotGreaterEqual": "≱",
		"NotGreaterFullEqual": "≧̸",
		"NotGreaterGreater": "≫̸",
		"NotGreaterLess": "≹",
		"NotGreaterSlantEqual": "⩾̸",
		"NotGreaterTilde": "≵",
		"NotHumpDownHump": "≎̸",
		"NotHumpEqual": "≏̸",
		"notin": "∉",
		"notindot": "⋵̸",
		"notinE": "⋹̸",
		"notinva": "∉",
		"notinvb": "⋷",
		"notinvc": "⋶",
		"NotLeftTriangleBar": "⧏̸",
		"NotLeftTriangle": "⋪",
		"NotLeftTriangleEqual": "⋬",
		"NotLess": "≮",
		"NotLessEqual": "≰",
		"NotLessGreater": "≸",
		"NotLessLess": "≪̸",
		"NotLessSlantEqual": "⩽̸",
		"NotLessTilde": "≴",
		"NotNestedGreaterGreater": "⪢̸",
		"NotNestedLessLess": "⪡̸",
		"notni": "∌",
		"notniva": "∌",
		"notnivb": "⋾",
		"notnivc": "⋽",
		"NotPrecedes": "⊀",
		"NotPrecedesEqual": "⪯̸",
		"NotPrecedesSlantEqual": "⋠",
		"NotReverseElement": "∌",
		"NotRightTriangleBar": "⧐̸",
		"NotRightTriangle": "⋫",
		"NotRightTriangleEqual": "⋭",
		"NotSquareSubset": "⊏̸",
		"NotSquareSubsetEqual": "⋢",
		"NotSquareSuperset": "⊐̸",
		"NotSquareSupersetEqual": "⋣",
		"NotSubset": "⊂⃒",
		"NotSubsetEqual": "⊈",
		"NotSucceeds": "⊁",
		"NotSucceedsEqual": "⪰̸",
		"NotSucceedsSlantEqual": "⋡",
		"NotSucceedsTilde": "≿̸",
		"NotSuperset": "⊃⃒",
		"NotSupersetEqual": "⊉",
		"NotTilde": "≁",
		"NotTildeEqual": "≄",
		"NotTildeFullEqual": "≇",
		"NotTildeTilde": "≉",
		"NotVerticalBar": "∤",
		"nparallel": "∦",
		"npar": "∦",
		"nparsl": "⫽⃥",
		"npart": "∂̸",
		"npolint": "⨔",
		"npr": "⊀",
		"nprcue": "⋠",
		"nprec": "⊀",
		"npreceq": "⪯̸",
		"npre": "⪯̸",
		"nrarrc": "⤳̸",
		"nrarr": "↛",
		"nrArr": "⇏",
		"nrarrw": "↝̸",
		"nrightarrow": "↛",
		"nRightarrow": "⇏",
		"nrtri": "⋫",
		"nrtrie": "⋭",
		"nsc": "⊁",
		"nsccue": "⋡",
		"nsce": "⪰̸",
		"Nscr": "𝒩",
		"nscr": "𝓃",
		"nshortmid": "∤",
		"nshortparallel": "∦",
		"nsim": "≁",
		"nsime": "≄",
		"nsimeq": "≄",
		"nsmid": "∤",
		"nspar": "∦",
		"nsqsube": "⋢",
		"nsqsupe": "⋣",
		"nsub": "⊄",
		"nsubE": "⫅̸",
		"nsube": "⊈",
		"nsubset": "⊂⃒",
		"nsubseteq": "⊈",
		"nsubseteqq": "⫅̸",
		"nsucc": "⊁",
		"nsucceq": "⪰̸",
		"nsup": "⊅",
		"nsupE": "⫆̸",
		"nsupe": "⊉",
		"nsupset": "⊃⃒",
		"nsupseteq": "⊉",
		"nsupseteqq": "⫆̸",
		"ntgl": "≹",
		"Ntilde": "Ñ",
		"ntilde": "ñ",
		"ntlg": "≸",
		"ntriangleleft": "⋪",
		"ntrianglelefteq": "⋬",
		"ntriangleright": "⋫",
		"ntrianglerighteq": "⋭",
		"Nu": "Ν",
		"nu": "ν",
		"num": "#",
		"numero": "№",
		"numsp": " ",
		"nvap": "≍⃒",
		"nvdash": "⊬",
		"nvDash": "⊭",
		"nVdash": "⊮",
		"nVDash": "⊯",
		"nvge": "≥⃒",
		"nvgt": ">⃒",
		"nvHarr": "⤄",
		"nvinfin": "⧞",
		"nvlArr": "⤂",
		"nvle": "≤⃒",
		"nvlt": "<⃒",
		"nvltrie": "⊴⃒",
		"nvrArr": "⤃",
		"nvrtrie": "⊵⃒",
		"nvsim": "∼⃒",
		"nwarhk": "⤣",
		"nwarr": "↖",
		"nwArr": "⇖",
		"nwarrow": "↖",
		"nwnear": "⤧",
		"Oacute": "Ó",
		"oacute": "ó",
		"oast": "⊛",
		"Ocirc": "Ô",
		"ocirc": "ô",
		"ocir": "⊚",
		"Ocy": "О",
		"ocy": "о",
		"odash": "⊝",
		"Odblac": "Ő",
		"odblac": "ő",
		"odiv": "⨸",
		"odot": "⊙",
		"odsold": "⦼",
		"OElig": "Œ",
		"oelig": "œ",
		"ofcir": "⦿",
		"Ofr": "𝔒",
		"ofr": "𝔬",
		"ogon": "˛",
		"Ograve": "Ò",
		"ograve": "ò",
		"ogt": "⧁",
		"ohbar": "⦵",
		"ohm": "Ω",
		"oint": "∮",
		"olarr": "↺",
		"olcir": "⦾",
		"olcross": "⦻",
		"oline": "‾",
		"olt": "⧀",
		"Omacr": "Ō",
		"omacr": "ō",
		"Omega": "Ω",
		"omega": "ω",
		"Omicron": "Ο",
		"omicron": "ο",
		"omid": "⦶",
		"ominus": "⊖",
		"Oopf": "𝕆",
		"oopf": "𝕠",
		"opar": "⦷",
		"OpenCurlyDoubleQuote": "“",
		"OpenCurlyQuote": "‘",
		"operp": "⦹",
		"oplus": "⊕",
		"orarr": "↻",
		"Or": "⩔",
		"or": "∨",
		"ord": "⩝",
		"order": "ℴ",
		"orderof": "ℴ",
		"ordf": "ª",
		"ordm": "º",
		"origof": "⊶",
		"oror": "⩖",
		"orslope": "⩗",
		"orv": "⩛",
		"oS": "Ⓢ",
		"Oscr": "𝒪",
		"oscr": "ℴ",
		"Oslash": "Ø",
		"oslash": "ø",
		"osol": "⊘",
		"Otilde": "Õ",
		"otilde": "õ",
		"otimesas": "⨶",
		"Otimes": "⨷",
		"otimes": "⊗",
		"Ouml": "Ö",
		"ouml": "ö",
		"ovbar": "⌽",
		"OverBar": "‾",
		"OverBrace": "⏞",
		"OverBracket": "⎴",
		"OverParenthesis": "⏜",
		"para": "¶",
		"parallel": "∥",
		"par": "∥",
		"parsim": "⫳",
		"parsl": "⫽",
		"part": "∂",
		"PartialD": "∂",
		"Pcy": "П",
		"pcy": "п",
		"percnt": "%",
		"period": ".",
		"permil": "‰",
		"perp": "⊥",
		"pertenk": "‱",
		"Pfr": "𝔓",
		"pfr": "𝔭",
		"Phi": "Φ",
		"phi": "φ",
		"phiv": "ϕ",
		"phmmat": "ℳ",
		"phone": "☎",
		"Pi": "Π",
		"pi": "π",
		"pitchfork": "⋔",
		"piv": "ϖ",
		"planck": "ℏ",
		"planckh": "ℎ",
		"plankv": "ℏ",
		"plusacir": "⨣",
		"plusb": "⊞",
		"pluscir": "⨢",
		"plus": "+",
		"plusdo": "∔",
		"plusdu": "⨥",
		"pluse": "⩲",
		"PlusMinus": "±",
		"plusmn": "±",
		"plussim": "⨦",
		"plustwo": "⨧",
		"pm": "±",
		"Poincareplane": "ℌ",
		"pointint": "⨕",
		"popf": "𝕡",
		"Popf": "ℙ",
		"pound": "£",
		"prap": "⪷",
		"Pr": "⪻",
		"pr": "≺",
		"prcue": "≼",
		"precapprox": "⪷",
		"prec": "≺",
		"preccurlyeq": "≼",
		"Precedes": "≺",
		"PrecedesEqual": "⪯",
		"PrecedesSlantEqual": "≼",
		"PrecedesTilde": "≾",
		"preceq": "⪯",
		"precnapprox": "⪹",
		"precneqq": "⪵",
		"precnsim": "⋨",
		"pre": "⪯",
		"prE": "⪳",
		"precsim": "≾",
		"prime": "′",
		"Prime": "″",
		"primes": "ℙ",
		"prnap": "⪹",
		"prnE": "⪵",
		"prnsim": "⋨",
		"prod": "∏",
		"Product": "∏",
		"profalar": "⌮",
		"profline": "⌒",
		"profsurf": "⌓",
		"prop": "∝",
		"Proportional": "∝",
		"Proportion": "∷",
		"propto": "∝",
		"prsim": "≾",
		"prurel": "⊰",
		"Pscr": "𝒫",
		"pscr": "𝓅",
		"Psi": "Ψ",
		"psi": "ψ",
		"puncsp": " ",
		"Qfr": "𝔔",
		"qfr": "𝔮",
		"qint": "⨌",
		"qopf": "𝕢",
		"Qopf": "ℚ",
		"qprime": "⁗",
		"Qscr": "𝒬",
		"qscr": "𝓆",
		"quaternions": "ℍ",
		"quatint": "⨖",
		"quest": "?",
		"questeq": "≟",
		"quot": "\"",
		"QUOT": "\"",
		"rAarr": "⇛",
		"race": "∽̱",
		"Racute": "Ŕ",
		"racute": "ŕ",
		"radic": "√",
		"raemptyv": "⦳",
		"rang": "⟩",
		"Rang": "⟫",
		"rangd": "⦒",
		"range": "⦥",
		"rangle": "⟩",
		"raquo": "»",
		"rarrap": "⥵",
		"rarrb": "⇥",
		"rarrbfs": "⤠",
		"rarrc": "⤳",
		"rarr": "→",
		"Rarr": "↠",
		"rArr": "⇒",
		"rarrfs": "⤞",
		"rarrhk": "↪",
		"rarrlp": "↬",
		"rarrpl": "⥅",
		"rarrsim": "⥴",
		"Rarrtl": "⤖",
		"rarrtl": "↣",
		"rarrw": "↝",
		"ratail": "⤚",
		"rAtail": "⤜",
		"ratio": "∶",
		"rationals": "ℚ",
		"rbarr": "⤍",
		"rBarr": "⤏",
		"RBarr": "⤐",
		"rbbrk": "❳",
		"rbrace": "}",
		"rbrack": "]",
		"rbrke": "⦌",
		"rbrksld": "⦎",
		"rbrkslu": "⦐",
		"Rcaron": "Ř",
		"rcaron": "ř",
		"Rcedil": "Ŗ",
		"rcedil": "ŗ",
		"rceil": "⌉",
		"rcub": "}",
		"Rcy": "Р",
		"rcy": "р",
		"rdca": "⤷",
		"rdldhar": "⥩",
		"rdquo": "”",
		"rdquor": "”",
		"rdsh": "↳",
		"real": "ℜ",
		"realine": "ℛ",
		"realpart": "ℜ",
		"reals": "ℝ",
		"Re": "ℜ",
		"rect": "▭",
		"reg": "®",
		"REG": "®",
		"ReverseElement": "∋",
		"ReverseEquilibrium": "⇋",
		"ReverseUpEquilibrium": "⥯",
		"rfisht": "⥽",
		"rfloor": "⌋",
		"rfr": "𝔯",
		"Rfr": "ℜ",
		"rHar": "⥤",
		"rhard": "⇁",
		"rharu": "⇀",
		"rharul": "⥬",
		"Rho": "Ρ",
		"rho": "ρ",
		"rhov": "ϱ",
		"RightAngleBracket": "⟩",
		"RightArrowBar": "⇥",
		"rightarrow": "→",
		"RightArrow": "→",
		"Rightarrow": "⇒",
		"RightArrowLeftArrow": "⇄",
		"rightarrowtail": "↣",
		"RightCeiling": "⌉",
		"RightDoubleBracket": "⟧",
		"RightDownTeeVector": "⥝",
		"RightDownVectorBar": "⥕",
		"RightDownVector": "⇂",
		"RightFloor": "⌋",
		"rightharpoondown": "⇁",
		"rightharpoonup": "⇀",
		"rightleftarrows": "⇄",
		"rightleftharpoons": "⇌",
		"rightrightarrows": "⇉",
		"rightsquigarrow": "↝",
		"RightTeeArrow": "↦",
		"RightTee": "⊢",
		"RightTeeVector": "⥛",
		"rightthreetimes": "⋌",
		"RightTriangleBar": "⧐",
		"RightTriangle": "⊳",
		"RightTriangleEqual": "⊵",
		"RightUpDownVector": "⥏",
		"RightUpTeeVector": "⥜",
		"RightUpVectorBar": "⥔",
		"RightUpVector": "↾",
		"RightVectorBar": "⥓",
		"RightVector": "⇀",
		"ring": "˚",
		"risingdotseq": "≓",
		"rlarr": "⇄",
		"rlhar": "⇌",
		"rlm": "‏",
		"rmoustache": "⎱",
		"rmoust": "⎱",
		"rnmid": "⫮",
		"roang": "⟭",
		"roarr": "⇾",
		"robrk": "⟧",
		"ropar": "⦆",
		"ropf": "𝕣",
		"Ropf": "ℝ",
		"roplus": "⨮",
		"rotimes": "⨵",
		"RoundImplies": "⥰",
		"rpar": ")",
		"rpargt": "⦔",
		"rppolint": "⨒",
		"rrarr": "⇉",
		"Rrightarrow": "⇛",
		"rsaquo": "›",
		"rscr": "𝓇",
		"Rscr": "ℛ",
		"rsh": "↱",
		"Rsh": "↱",
		"rsqb": "]",
		"rsquo": "’",
		"rsquor": "’",
		"rthree": "⋌",
		"rtimes": "⋊",
		"rtri": "▹",
		"rtrie": "⊵",
		"rtrif": "▸",
		"rtriltri": "⧎",
		"RuleDelayed": "⧴",
		"ruluhar": "⥨",
		"rx": "℞",
		"Sacute": "Ś",
		"sacute": "ś",
		"sbquo": "‚",
		"scap": "⪸",
		"Scaron": "Š",
		"scaron": "š",
		"Sc": "⪼",
		"sc": "≻",
		"sccue": "≽",
		"sce": "⪰",
		"scE": "⪴",
		"Scedil": "Ş",
		"scedil": "ş",
		"Scirc": "Ŝ",
		"scirc": "ŝ",
		"scnap": "⪺",
		"scnE": "⪶",
		"scnsim": "⋩",
		"scpolint": "⨓",
		"scsim": "≿",
		"Scy": "С",
		"scy": "с",
		"sdotb": "⊡",
		"sdot": "⋅",
		"sdote": "⩦",
		"searhk": "⤥",
		"searr": "↘",
		"seArr": "⇘",
		"searrow": "↘",
		"sect": "§",
		"semi": ";",
		"seswar": "⤩",
		"setminus": "∖",
		"setmn": "∖",
		"sext": "✶",
		"Sfr": "𝔖",
		"sfr": "𝔰",
		"sfrown": "⌢",
		"sharp": "♯",
		"SHCHcy": "Щ",
		"shchcy": "щ",
		"SHcy": "Ш",
		"shcy": "ш",
		"ShortDownArrow": "↓",
		"ShortLeftArrow": "←",
		"shortmid": "∣",
		"shortparallel": "∥",
		"ShortRightArrow": "→",
		"ShortUpArrow": "↑",
		"shy": "­",
		"Sigma": "Σ",
		"sigma": "σ",
		"sigmaf": "ς",
		"sigmav": "ς",
		"sim": "∼",
		"simdot": "⩪",
		"sime": "≃",
		"simeq": "≃",
		"simg": "⪞",
		"simgE": "⪠",
		"siml": "⪝",
		"simlE": "⪟",
		"simne": "≆",
		"simplus": "⨤",
		"simrarr": "⥲",
		"slarr": "←",
		"SmallCircle": "∘",
		"smallsetminus": "∖",
		"smashp": "⨳",
		"smeparsl": "⧤",
		"smid": "∣",
		"smile": "⌣",
		"smt": "⪪",
		"smte": "⪬",
		"smtes": "⪬︀",
		"SOFTcy": "Ь",
		"softcy": "ь",
		"solbar": "⌿",
		"solb": "⧄",
		"sol": "/",
		"Sopf": "𝕊",
		"sopf": "𝕤",
		"spades": "♠",
		"spadesuit": "♠",
		"spar": "∥",
		"sqcap": "⊓",
		"sqcaps": "⊓︀",
		"sqcup": "⊔",
		"sqcups": "⊔︀",
		"Sqrt": "√",
		"sqsub": "⊏",
		"sqsube": "⊑",
		"sqsubset": "⊏",
		"sqsubseteq": "⊑",
		"sqsup": "⊐",
		"sqsupe": "⊒",
		"sqsupset": "⊐",
		"sqsupseteq": "⊒",
		"square": "□",
		"Square": "□",
		"SquareIntersection": "⊓",
		"SquareSubset": "⊏",
		"SquareSubsetEqual": "⊑",
		"SquareSuperset": "⊐",
		"SquareSupersetEqual": "⊒",
		"SquareUnion": "⊔",
		"squarf": "▪",
		"squ": "□",
		"squf": "▪",
		"srarr": "→",
		"Sscr": "𝒮",
		"sscr": "𝓈",
		"ssetmn": "∖",
		"ssmile": "⌣",
		"sstarf": "⋆",
		"Star": "⋆",
		"star": "☆",
		"starf": "★",
		"straightepsilon": "ϵ",
		"straightphi": "ϕ",
		"strns": "¯",
		"sub": "⊂",
		"Sub": "⋐",
		"subdot": "⪽",
		"subE": "⫅",
		"sube": "⊆",
		"subedot": "⫃",
		"submult": "⫁",
		"subnE": "⫋",
		"subne": "⊊",
		"subplus": "⪿",
		"subrarr": "⥹",
		"subset": "⊂",
		"Subset": "⋐",
		"subseteq": "⊆",
		"subseteqq": "⫅",
		"SubsetEqual": "⊆",
		"subsetneq": "⊊",
		"subsetneqq": "⫋",
		"subsim": "⫇",
		"subsub": "⫕",
		"subsup": "⫓",
		"succapprox": "⪸",
		"succ": "≻",
		"succcurlyeq": "≽",
		"Succeeds": "≻",
		"SucceedsEqual": "⪰",
		"SucceedsSlantEqual": "≽",
		"SucceedsTilde": "≿",
		"succeq": "⪰",
		"succnapprox": "⪺",
		"succneqq": "⪶",
		"succnsim": "⋩",
		"succsim": "≿",
		"SuchThat": "∋",
		"sum": "∑",
		"Sum": "∑",
		"sung": "♪",
		"sup1": "¹",
		"sup2": "²",
		"sup3": "³",
		"sup": "⊃",
		"Sup": "⋑",
		"supdot": "⪾",
		"supdsub": "⫘",
		"supE": "⫆",
		"supe": "⊇",
		"supedot": "⫄",
		"Superset": "⊃",
		"SupersetEqual": "⊇",
		"suphsol": "⟉",
		"suphsub": "⫗",
		"suplarr": "⥻",
		"supmult": "⫂",
		"supnE": "⫌",
		"supne": "⊋",
		"supplus": "⫀",
		"supset": "⊃",
		"Supset": "⋑",
		"supseteq": "⊇",
		"supseteqq": "⫆",
		"supsetneq": "⊋",
		"supsetneqq": "⫌",
		"supsim": "⫈",
		"supsub": "⫔",
		"supsup": "⫖",
		"swarhk": "⤦",
		"swarr": "↙",
		"swArr": "⇙",
		"swarrow": "↙",
		"swnwar": "⤪",
		"szlig": "ß",
		"Tab": "\t",
		"target": "⌖",
		"Tau": "Τ",
		"tau": "τ",
		"tbrk": "⎴",
		"Tcaron": "Ť",
		"tcaron": "ť",
		"Tcedil": "Ţ",
		"tcedil": "ţ",
		"Tcy": "Т",
		"tcy": "т",
		"tdot": "⃛",
		"telrec": "⌕",
		"Tfr": "𝔗",
		"tfr": "𝔱",
		"there4": "∴",
		"therefore": "∴",
		"Therefore": "∴",
		"Theta": "Θ",
		"theta": "θ",
		"thetasym": "ϑ",
		"thetav": "ϑ",
		"thickapprox": "≈",
		"thicksim": "∼",
		"ThickSpace": "  ",
		"ThinSpace": " ",
		"thinsp": " ",
		"thkap": "≈",
		"thksim": "∼",
		"THORN": "Þ",
		"thorn": "þ",
		"tilde": "˜",
		"Tilde": "∼",
		"TildeEqual": "≃",
		"TildeFullEqual": "≅",
		"TildeTilde": "≈",
		"timesbar": "⨱",
		"timesb": "⊠",
		"times": "×",
		"timesd": "⨰",
		"tint": "∭",
		"toea": "⤨",
		"topbot": "⌶",
		"topcir": "⫱",
		"top": "⊤",
		"Topf": "𝕋",
		"topf": "𝕥",
		"topfork": "⫚",
		"tosa": "⤩",
		"tprime": "‴",
		"trade": "™",
		"TRADE": "™",
		"triangle": "▵",
		"triangledown": "▿",
		"triangleleft": "◃",
		"trianglelefteq": "⊴",
		"triangleq": "≜",
		"triangleright": "▹",
		"trianglerighteq": "⊵",
		"tridot": "◬",
		"trie": "≜",
		"triminus": "⨺",
		"TripleDot": "⃛",
		"triplus": "⨹",
		"trisb": "⧍",
		"tritime": "⨻",
		"trpezium": "⏢",
		"Tscr": "𝒯",
		"tscr": "𝓉",
		"TScy": "Ц",
		"tscy": "ц",
		"TSHcy": "Ћ",
		"tshcy": "ћ",
		"Tstrok": "Ŧ",
		"tstrok": "ŧ",
		"twixt": "≬",
		"twoheadleftarrow": "↞",
		"twoheadrightarrow": "↠",
		"Uacute": "Ú",
		"uacute": "ú",
		"uarr": "↑",
		"Uarr": "↟",
		"uArr": "⇑",
		"Uarrocir": "⥉",
		"Ubrcy": "Ў",
		"ubrcy": "ў",
		"Ubreve": "Ŭ",
		"ubreve": "ŭ",
		"Ucirc": "Û",
		"ucirc": "û",
		"Ucy": "У",
		"ucy": "у",
		"udarr": "⇅",
		"Udblac": "Ű",
		"udblac": "ű",
		"udhar": "⥮",
		"ufisht": "⥾",
		"Ufr": "𝔘",
		"ufr": "𝔲",
		"Ugrave": "Ù",
		"ugrave": "ù",
		"uHar": "⥣",
		"uharl": "↿",
		"uharr": "↾",
		"uhblk": "▀",
		"ulcorn": "⌜",
		"ulcorner": "⌜",
		"ulcrop": "⌏",
		"ultri": "◸",
		"Umacr": "Ū",
		"umacr": "ū",
		"uml": "¨",
		"UnderBar": "_",
		"UnderBrace": "⏟",
		"UnderBracket": "⎵",
		"UnderParenthesis": "⏝",
		"Union": "⋃",
		"UnionPlus": "⊎",
		"Uogon": "Ų",
		"uogon": "ų",
		"Uopf": "𝕌",
		"uopf": "𝕦",
		"UpArrowBar": "⤒",
		"uparrow": "↑",
		"UpArrow": "↑",
		"Uparrow": "⇑",
		"UpArrowDownArrow": "⇅",
		"updownarrow": "↕",
		"UpDownArrow": "↕",
		"Updownarrow": "⇕",
		"UpEquilibrium": "⥮",
		"upharpoonleft": "↿",
		"upharpoonright": "↾",
		"uplus": "⊎",
		"UpperLeftArrow": "↖",
		"UpperRightArrow": "↗",
		"upsi": "υ",
		"Upsi": "ϒ",
		"upsih": "ϒ",
		"Upsilon": "Υ",
		"upsilon": "υ",
		"UpTeeArrow": "↥",
		"UpTee": "⊥",
		"upuparrows": "⇈",
		"urcorn": "⌝",
		"urcorner": "⌝",
		"urcrop": "⌎",
		"Uring": "Ů",
		"uring": "ů",
		"urtri": "◹",
		"Uscr": "𝒰",
		"uscr": "𝓊",
		"utdot": "⋰",
		"Utilde": "Ũ",
		"utilde": "ũ",
		"utri": "▵",
		"utrif": "▴",
		"uuarr": "⇈",
		"Uuml": "Ü",
		"uuml": "ü",
		"uwangle": "⦧",
		"vangrt": "⦜",
		"varepsilon": "ϵ",
		"varkappa": "ϰ",
		"varnothing": "∅",
		"varphi": "ϕ",
		"varpi": "ϖ",
		"varpropto": "∝",
		"varr": "↕",
		"vArr": "⇕",
		"varrho": "ϱ",
		"varsigma": "ς",
		"varsubsetneq": "⊊︀",
		"varsubsetneqq": "⫋︀",
		"varsupsetneq": "⊋︀",
		"varsupsetneqq": "⫌︀",
		"vartheta": "ϑ",
		"vartriangleleft": "⊲",
		"vartriangleright": "⊳",
		"vBar": "⫨",
		"Vbar": "⫫",
		"vBarv": "⫩",
		"Vcy": "В",
		"vcy": "в",
		"vdash": "⊢",
		"vDash": "⊨",
		"Vdash": "⊩",
		"VDash": "⊫",
		"Vdashl": "⫦",
		"veebar": "⊻",
		"vee": "∨",
		"Vee": "⋁",
		"veeeq": "≚",
		"vellip": "⋮",
		"verbar": "|",
		"Verbar": "‖",
		"vert": "|",
		"Vert": "‖",
		"VerticalBar": "∣",
		"VerticalLine": "|",
		"VerticalSeparator": "❘",
		"VerticalTilde": "≀",
		"VeryThinSpace": " ",
		"Vfr": "𝔙",
		"vfr": "𝔳",
		"vltri": "⊲",
		"vnsub": "⊂⃒",
		"vnsup": "⊃⃒",
		"Vopf": "𝕍",
		"vopf": "𝕧",
		"vprop": "∝",
		"vrtri": "⊳",
		"Vscr": "𝒱",
		"vscr": "𝓋",
		"vsubnE": "⫋︀",
		"vsubne": "⊊︀",
		"vsupnE": "⫌︀",
		"vsupne": "⊋︀",
		"Vvdash": "⊪",
		"vzigzag": "⦚",
		"Wcirc": "Ŵ",
		"wcirc": "ŵ",
		"wedbar": "⩟",
		"wedge": "∧",
		"Wedge": "⋀",
		"wedgeq": "≙",
		"weierp": "℘",
		"Wfr": "𝔚",
		"wfr": "𝔴",
		"Wopf": "𝕎",
		"wopf": "𝕨",
		"wp": "℘",
		"wr": "≀",
		"wreath": "≀",
		"Wscr": "𝒲",
		"wscr": "𝓌",
		"xcap": "⋂",
		"xcirc": "◯",
		"xcup": "⋃",
		"xdtri": "▽",
		"Xfr": "𝔛",
		"xfr": "𝔵",
		"xharr": "⟷",
		"xhArr": "⟺",
		"Xi": "Ξ",
		"xi": "ξ",
		"xlarr": "⟵",
		"xlArr": "⟸",
		"xmap": "⟼",
		"xnis": "⋻",
		"xodot": "⨀",
		"Xopf": "𝕏",
		"xopf": "𝕩",
		"xoplus": "⨁",
		"xotime": "⨂",
		"xrarr": "⟶",
		"xrArr": "⟹",
		"Xscr": "𝒳",
		"xscr": "𝓍",
		"xsqcup": "⨆",
		"xuplus": "⨄",
		"xutri": "△",
		"xvee": "⋁",
		"xwedge": "⋀",
		"Yacute": "Ý",
		"yacute": "ý",
		"YAcy": "Я",
		"yacy": "я",
		"Ycirc": "Ŷ",
		"ycirc": "ŷ",
		"Ycy": "Ы",
		"ycy": "ы",
		"yen": "¥",
		"Yfr": "𝔜",
		"yfr": "𝔶",
		"YIcy": "Ї",
		"yicy": "ї",
		"Yopf": "𝕐",
		"yopf": "𝕪",
		"Yscr": "𝒴",
		"yscr": "𝓎",
		"YUcy": "Ю",
		"yucy": "ю",
		"yuml": "ÿ",
		"Yuml": "Ÿ",
		"Zacute": "Ź",
		"zacute": "ź",
		"Zcaron": "Ž",
		"zcaron": "ž",
		"Zcy": "З",
		"zcy": "з",
		"Zdot": "Ż",
		"zdot": "ż",
		"zeetrf": "ℨ",
		"ZeroWidthSpace": "​",
		"Zeta": "Ζ",
		"zeta": "ζ",
		"zfr": "𝔷",
		"Zfr": "ℨ",
		"ZHcy": "Ж",
		"zhcy": "ж",
		"zigrarr": "⇝",
		"zopf": "𝕫",
		"Zopf": "ℤ",
		"Zscr": "𝒵",
		"zscr": "𝓏",
		"zwj": "‍",
		"zwnj": "‌"
	};

/***/ },
/* 43 */
/***/ function(module, exports) {

	module.exports = {
		"Aacute": "Á",
		"aacute": "á",
		"Acirc": "Â",
		"acirc": "â",
		"acute": "´",
		"AElig": "Æ",
		"aelig": "æ",
		"Agrave": "À",
		"agrave": "à",
		"amp": "&",
		"AMP": "&",
		"Aring": "Å",
		"aring": "å",
		"Atilde": "Ã",
		"atilde": "ã",
		"Auml": "Ä",
		"auml": "ä",
		"brvbar": "¦",
		"Ccedil": "Ç",
		"ccedil": "ç",
		"cedil": "¸",
		"cent": "¢",
		"copy": "©",
		"COPY": "©",
		"curren": "¤",
		"deg": "°",
		"divide": "÷",
		"Eacute": "É",
		"eacute": "é",
		"Ecirc": "Ê",
		"ecirc": "ê",
		"Egrave": "È",
		"egrave": "è",
		"ETH": "Ð",
		"eth": "ð",
		"Euml": "Ë",
		"euml": "ë",
		"frac12": "½",
		"frac14": "¼",
		"frac34": "¾",
		"gt": ">",
		"GT": ">",
		"Iacute": "Í",
		"iacute": "í",
		"Icirc": "Î",
		"icirc": "î",
		"iexcl": "¡",
		"Igrave": "Ì",
		"igrave": "ì",
		"iquest": "¿",
		"Iuml": "Ï",
		"iuml": "ï",
		"laquo": "«",
		"lt": "<",
		"LT": "<",
		"macr": "¯",
		"micro": "µ",
		"middot": "·",
		"nbsp": " ",
		"not": "¬",
		"Ntilde": "Ñ",
		"ntilde": "ñ",
		"Oacute": "Ó",
		"oacute": "ó",
		"Ocirc": "Ô",
		"ocirc": "ô",
		"Ograve": "Ò",
		"ograve": "ò",
		"ordf": "ª",
		"ordm": "º",
		"Oslash": "Ø",
		"oslash": "ø",
		"Otilde": "Õ",
		"otilde": "õ",
		"Ouml": "Ö",
		"ouml": "ö",
		"para": "¶",
		"plusmn": "±",
		"pound": "£",
		"quot": "\"",
		"QUOT": "\"",
		"raquo": "»",
		"reg": "®",
		"REG": "®",
		"sect": "§",
		"shy": "­",
		"sup1": "¹",
		"sup2": "²",
		"sup3": "³",
		"szlig": "ß",
		"THORN": "Þ",
		"thorn": "þ",
		"times": "×",
		"Uacute": "Ú",
		"uacute": "ú",
		"Ucirc": "Û",
		"ucirc": "û",
		"Ugrave": "Ù",
		"ugrave": "ù",
		"uml": "¨",
		"Uuml": "Ü",
		"uuml": "ü",
		"Yacute": "Ý",
		"yacute": "ý",
		"yen": "¥",
		"yuml": "ÿ"
	};

/***/ },
/* 44 */
/***/ function(module, exports) {

	module.exports = {
		"amp": "&",
		"apos": "'",
		"gt": ">",
		"lt": "<",
		"quot": "\""
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var ElementType = __webpack_require__(46);

	var re_whitespace = /\s+/g;
	var NodePrototype = __webpack_require__(47);
	var ElementPrototype = __webpack_require__(48);

	function DomHandler(callback, options, elementCB){
		if(typeof callback === "object"){
			elementCB = options;
			options = callback;
			callback = null;
		} else if(typeof options === "function"){
			elementCB = options;
			options = defaultOpts;
		}
		this._callback = callback;
		this._options = options || defaultOpts;
		this._elementCB = elementCB;
		this.dom = [];
		this._done = false;
		this._tagStack = [];
		this._parser = this._parser || null;
	}

	//default options
	var defaultOpts = {
		normalizeWhitespace: false, //Replace all whitespace with single spaces
		withStartIndices: false, //Add startIndex properties to nodes
	};

	DomHandler.prototype.onparserinit = function(parser){
		this._parser = parser;
	};

	//Resets the handler back to starting state
	DomHandler.prototype.onreset = function(){
		DomHandler.call(this, this._callback, this._options, this._elementCB);
	};

	//Signals the handler that parsing is done
	DomHandler.prototype.onend = function(){
		if(this._done) return;
		this._done = true;
		this._parser = null;
		this._handleCallback(null);
	};

	DomHandler.prototype._handleCallback =
	DomHandler.prototype.onerror = function(error){
		if(typeof this._callback === "function"){
			this._callback(error, this.dom);
		} else {
			if(error) throw error;
		}
	};

	DomHandler.prototype.onclosetag = function(){
		//if(this._tagStack.pop().name !== name) this._handleCallback(Error("Tagname didn't match!"));
		var elem = this._tagStack.pop();
		if(this._elementCB) this._elementCB(elem);
	};

	DomHandler.prototype._addDomElement = function(element){
		var parent = this._tagStack[this._tagStack.length - 1];
		var siblings = parent ? parent.children : this.dom;
		var previousSibling = siblings[siblings.length - 1];

		element.next = null;

		if(this._options.withStartIndices){
			element.startIndex = this._parser.startIndex;
		}

		if (this._options.withDomLvl1) {
			element.__proto__ = element.type === "tag" ? ElementPrototype : NodePrototype;
		}

		if(previousSibling){
			element.prev = previousSibling;
			previousSibling.next = element;
		} else {
			element.prev = null;
		}

		siblings.push(element);
		element.parent = parent || null;
	};

	DomHandler.prototype.onopentag = function(name, attribs){
		var element = {
			type: name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag,
			name: name,
			attribs: attribs,
			children: []
		};

		this._addDomElement(element);

		this._tagStack.push(element);
	};

	DomHandler.prototype.ontext = function(data){
		//the ignoreWhitespace is officially dropped, but for now,
		//it's an alias for normalizeWhitespace
		var normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

		var lastTag;

		if(!this._tagStack.length && this.dom.length && (lastTag = this.dom[this.dom.length-1]).type === ElementType.Text){
			if(normalize){
				lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
			} else {
				lastTag.data += data;
			}
		} else {
			if(
				this._tagStack.length &&
				(lastTag = this._tagStack[this._tagStack.length - 1]) &&
				(lastTag = lastTag.children[lastTag.children.length - 1]) &&
				lastTag.type === ElementType.Text
			){
				if(normalize){
					lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
				} else {
					lastTag.data += data;
				}
			} else {
				if(normalize){
					data = data.replace(re_whitespace, " ");
				}

				this._addDomElement({
					data: data,
					type: ElementType.Text
				});
			}
		}
	};

	DomHandler.prototype.oncomment = function(data){
		var lastTag = this._tagStack[this._tagStack.length - 1];

		if(lastTag && lastTag.type === ElementType.Comment){
			lastTag.data += data;
			return;
		}

		var element = {
			data: data,
			type: ElementType.Comment
		};

		this._addDomElement(element);
		this._tagStack.push(element);
	};

	DomHandler.prototype.oncdatastart = function(){
		var element = {
			children: [{
				data: "",
				type: ElementType.Text
			}],
			type: ElementType.CDATA
		};

		this._addDomElement(element);
		this._tagStack.push(element);
	};

	DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function(){
		this._tagStack.pop();
	};

	DomHandler.prototype.onprocessinginstruction = function(name, data){
		this._addDomElement({
			name: name,
			data: data,
			type: ElementType.Directive
		});
	};

	module.exports = DomHandler;


/***/ },
/* 46 */
/***/ function(module, exports) {

	//Types of elements found in the DOM
	module.exports = {
		Text: "text", //Text
		Directive: "directive", //<? ... ?>
		Comment: "comment", //<!-- ... -->
		Script: "script", //<script> tags
		Style: "style", //<style> tags
		Tag: "tag", //Any tag
		CDATA: "cdata", //<![CDATA[ ... ]]>
		Doctype: "doctype",

		isTag: function(elem){
			return elem.type === "tag" || elem.type === "script" || elem.type === "style";
		}
	};


/***/ },
/* 47 */
/***/ function(module, exports) {

	// This object will be used as the prototype for Nodes when creating a
	// DOM-Level-1-compliant structure.
	var NodePrototype = module.exports = {
		get firstChild() {
			var children = this.children;
			return children && children[0] || null;
		},
		get lastChild() {
			var children = this.children;
			return children && children[children.length - 1] || null;
		},
		get nodeType() {
			return nodeTypes[this.type] || nodeTypes.element;
		}
	};

	var domLvl1 = {
		tagName: "name",
		childNodes: "children",
		parentNode: "parent",
		previousSibling: "prev",
		nextSibling: "next",
		nodeValue: "data"
	};

	var nodeTypes = {
		element: 1,
		text: 3,
		cdata: 4,
		comment: 8
	};

	Object.keys(domLvl1).forEach(function(key) {
		var shorthand = domLvl1[key];
		Object.defineProperty(NodePrototype, key, {
			get: function() {
				return this[shorthand] || null;
			},
			set: function(val) {
				this[shorthand] = val;
				return val;
			}
		});
	});


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	// DOM-Level-1-compliant structure
	var NodePrototype = __webpack_require__(47);
	var ElementPrototype = module.exports = Object.create(NodePrototype);

	var domLvl1 = {
		tagName: "name"
	};

	Object.keys(domLvl1).forEach(function(key) {
		var shorthand = domLvl1[key];
		Object.defineProperty(ElementPrototype, key, {
			get: function() {
				return this[shorthand] || null;
			},
			set: function(val) {
				this[shorthand] = val;
				return val;
			}
		});
	});


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var index = __webpack_require__(37),
	    DomHandler = index.DomHandler,
		DomUtils = index.DomUtils;

	//TODO: make this a streamable handler
	function FeedHandler(callback, options){
		this.init(callback, options);
	}

	__webpack_require__(12).inherits(FeedHandler, DomHandler);

	FeedHandler.prototype.init = DomHandler;

	function getElements(what, where){
		return DomUtils.getElementsByTagName(what, where, true);
	}
	function getOneElement(what, where){
		return DomUtils.getElementsByTagName(what, where, true, 1)[0];
	}
	function fetch(what, where, recurse){
		return DomUtils.getText(
			DomUtils.getElementsByTagName(what, where, recurse, 1)
		).trim();
	}

	function addConditionally(obj, prop, what, where, recurse){
		var tmp = fetch(what, where, recurse);
		if(tmp) obj[prop] = tmp;
	}

	var isValidFeed = function(value){
		return value === "rss" || value === "feed" || value === "rdf:RDF";
	};

	FeedHandler.prototype.onend = function(){
		var feed = {},
			feedRoot = getOneElement(isValidFeed, this.dom),
			tmp, childs;

		if(feedRoot){
			if(feedRoot.name === "feed"){
				childs = feedRoot.children;

				feed.type = "atom";
				addConditionally(feed, "id", "id", childs);
				addConditionally(feed, "title", "title", childs);
				if((tmp = getOneElement("link", childs)) && (tmp = tmp.attribs) && (tmp = tmp.href)) feed.link = tmp;
				addConditionally(feed, "description", "subtitle", childs);
				if((tmp = fetch("updated", childs))) feed.updated = new Date(tmp);
				addConditionally(feed, "author", "email", childs, true);

				feed.items = getElements("entry", childs).map(function(item){
					var entry = {}, tmp;

					item = item.children;

					addConditionally(entry, "id", "id", item);
					addConditionally(entry, "title", "title", item);
					if((tmp = getOneElement("link", item)) && (tmp = tmp.attribs) && (tmp = tmp.href)) entry.link = tmp;
					if((tmp = fetch("summary", item) || fetch("content", item))) entry.description = tmp;
					if((tmp = fetch("updated", item))) entry.pubDate = new Date(tmp);
					return entry;
				});
			} else {
				childs = getOneElement("channel", feedRoot.children).children;

				feed.type = feedRoot.name.substr(0, 3);
				feed.id = "";
				addConditionally(feed, "title", "title", childs);
				addConditionally(feed, "link", "link", childs);
				addConditionally(feed, "description", "description", childs);
				if((tmp = fetch("lastBuildDate", childs))) feed.updated = new Date(tmp);
				addConditionally(feed, "author", "managingEditor", childs, true);

				feed.items = getElements("item", feedRoot.children).map(function(item){
					var entry = {}, tmp;

					item = item.children;

					addConditionally(entry, "id", "guid", item);
					addConditionally(entry, "title", "title", item);
					addConditionally(entry, "link", "link", item);
					addConditionally(entry, "description", "description", item);
					if((tmp = fetch("pubDate", item))) entry.pubDate = new Date(tmp);
					return entry;
				});
			}
		}
		this.dom = feed;
		DomHandler.prototype._handleCallback.call(
			this, feedRoot ? null : Error("couldn't find root of feed")
		);
	};

	module.exports = FeedHandler;


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Stream;

	var Parser = __webpack_require__(51);

	function Stream(options){
		Parser.call(this, new Cbs(this), options);
	}

	__webpack_require__(12).inherits(Stream, Parser);

	Stream.prototype.readable = true;

	function Cbs(scope){
		this.scope = scope;
	}

	var EVENTS = __webpack_require__(37).EVENTS;

	Object.keys(EVENTS).forEach(function(name){
		if(EVENTS[name] === 0){
			Cbs.prototype["on" + name] = function(){
				this.scope.emit(name);
			};
		} else if(EVENTS[name] === 1){
			Cbs.prototype["on" + name] = function(a){
				this.scope.emit(name, a);
			};
		} else if(EVENTS[name] === 2){
			Cbs.prototype["on" + name] = function(a, b){
				this.scope.emit(name, a, b);
			};
		} else {
			throw Error("wrong number of arguments!");
		}
	});

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Stream;

	var Parser = __webpack_require__(38),
	    WritableStream = __webpack_require__(52).Writable || __webpack_require__(73).Writable;

	function Stream(cbs, options){
		var parser = this._parser = new Parser(cbs, options);

		WritableStream.call(this, {decodeStrings: false});

		this.once("finish", function(){
			parser.end();
		});
	}

	__webpack_require__(12).inherits(Stream, WritableStream);

	WritableStream.prototype._write = function(chunk, encoding, cb){
		this._parser.write(chunk);
		cb();
	};

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Stream;

	var EE = __webpack_require__(11).EventEmitter;
	var inherits = __webpack_require__(53);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(54);
	Stream.Writable = __webpack_require__(69);
	Stream.Duplex = __webpack_require__(70);
	Stream.Transform = __webpack_require__(71);
	Stream.PassThrough = __webpack_require__(72);

	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;



	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.

	function Stream() {
	  EE.call(this);
	}

	Stream.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }

	  source.on('data', ondata);

	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    dest.end();
	  }


	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    if (typeof dest.destroy === 'function') dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);

	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);

	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);

	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);

	    dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ },
/* 53 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {exports = module.exports = __webpack_require__(55);
	exports.Stream = __webpack_require__(52);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(65);
	exports.Duplex = __webpack_require__(64);
	exports.Transform = __webpack_require__(67);
	exports.PassThrough = __webpack_require__(68);
	if (!process.browser && process.env.READABLE_STREAM === 'disable') {
	  module.exports = __webpack_require__(52);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Readable;

	/*<replacement>*/
	var isArray = __webpack_require__(56);
	/*</replacement>*/


	/*<replacement>*/
	var Buffer = __webpack_require__(57).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(11).EventEmitter;

	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	var Stream = __webpack_require__(52);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(62);
	/*</replacement>*/

	var StringDecoder;


	/*<replacement>*/
	var debug = __webpack_require__(63);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/


	util.inherits(Readable, Stream);

	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(64);

	  options = options || {};

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  this.buffer = [];
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;


	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder)
	      StringDecoder = __webpack_require__(66).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  var Duplex = __webpack_require__(64);

	  if (!(this instanceof Readable))
	    return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  Stream.call(this);
	}

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function(chunk, encoding) {
	  var state = this._readableState;

	  if (util.isString(chunk) && !state.objectMode) {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = new Buffer(chunk, encoding);
	      encoding = '';
	    }
	  }

	  return readableAddChunk(this, state, chunk, encoding, false);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function(chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};

	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (util.isNullOrUndefined(chunk)) {
	    state.reading = false;
	    if (!state.ended)
	      onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var e = new Error('stream.unshift() after end event');
	      stream.emit('error', e);
	    } else {
	      if (state.decoder && !addToFront && !encoding)
	        chunk = state.decoder.write(chunk);

	      if (!addToFront)
	        state.reading = false;

	      // if we want the data now, just emit it.
	      if (state.flowing && state.length === 0 && !state.sync) {
	        stream.emit('data', chunk);
	        stream.read(0);
	      } else {
	        // update the buffer info.
	        state.length += state.objectMode ? 1 : chunk.length;
	        if (addToFront)
	          state.buffer.unshift(chunk);
	        else
	          state.buffer.push(chunk);

	        if (state.needReadable)
	          emitReadable(stream);
	      }

	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }

	  return needMoreData(state);
	}



	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended &&
	         (state.needReadable ||
	          state.length < state.highWaterMark ||
	          state.length === 0);
	}

	// backwards compatibility.
	Readable.prototype.setEncoding = function(enc) {
	  if (!StringDecoder)
	    StringDecoder = __webpack_require__(66).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 128MB
	var MAX_HWM = 0x800000;
	function roundUpToNextPowerOf2(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2
	    n--;
	    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
	    n++;
	  }
	  return n;
	}

	function howMuchToRead(n, state) {
	  if (state.length === 0 && state.ended)
	    return 0;

	  if (state.objectMode)
	    return n === 0 ? 0 : 1;

	  if (isNaN(n) || util.isNull(n)) {
	    // only flow one buffer at a time
	    if (state.flowing && state.buffer.length)
	      return state.buffer[0].length;
	    else
	      return state.length;
	  }

	  if (n <= 0)
	    return 0;

	  // If we're asking for more than the target buffer level,
	  // then raise the water mark.  Bump up to the next highest
	  // power of 2, to prevent increasing it excessively in tiny
	  // amounts.
	  if (n > state.highWaterMark)
	    state.highWaterMark = roundUpToNextPowerOf2(n);

	  // don't have that much.  return null, unless we've ended.
	  if (n > state.length) {
	    if (!state.ended) {
	      state.needReadable = true;
	      return 0;
	    } else
	      return state.length;
	  }

	  return n;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function(n) {
	  debug('read', n);
	  var state = this._readableState;
	  var nOrig = n;

	  if (!util.isNumber(n) || n > 0)
	    state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 &&
	      state.needReadable &&
	      (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended)
	      endReadable(this);
	    else
	      emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0)
	      endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  }

	  if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0)
	      state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	  }

	  // If _read pushed data synchronously, then `reading` will be false,
	  // and we need to re-evaluate how much data we can return to the user.
	  if (doRead && !state.reading)
	    n = howMuchToRead(nOrig, state);

	  var ret;
	  if (n > 0)
	    ret = fromList(n, state);
	  else
	    ret = null;

	  if (util.isNull(ret)) {
	    state.needReadable = true;
	    n = 0;
	  }

	  state.length -= n;

	  // If we have nothing in the buffer, then we want to know
	  // as soon as we *do* get something into the buffer.
	  if (state.length === 0 && !state.ended)
	    state.needReadable = true;

	  // If we tried to read() past the EOF, then emit end on the next tick.
	  if (nOrig !== n && state.ended && state.length === 0)
	    endReadable(this);

	  if (!util.isNull(ret))
	    this.emit('data', ret);

	  return ret;
	};

	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}


	function onEofChunk(stream, state) {
	  if (state.decoder && !state.ended) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync)
	      process.nextTick(function() {
	        emitReadable_(stream);
	      });
	    else
	      emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}


	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    process.nextTick(function() {
	      maybeReadMore_(stream, state);
	    });
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended &&
	         state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;
	    else
	      len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function(n) {
	  this.emit('error', new Error('not implemented'));
	};

	Readable.prototype.pipe = function(dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
	              dest !== process.stdout &&
	              dest !== process.stderr;

	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted)
	    process.nextTick(endFn);
	  else
	    src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain &&
	        (!dest._writableState || dest._writableState.needDrain))
	      ondrain();
	  }

	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    var ret = dest.write(chunk);
	    if (false === ret) {
	      debug('false write response, pause',
	            src._readableState.awaitDrain);
	      src._readableState.awaitDrain++;
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EE.listenerCount(dest, 'error') === 0)
	      dest.emit('error', er);
	  }
	  // This is a brutally ugly hack to make sure that our error handler
	  // is attached before any userland ones.  NEVER DO THIS.
	  if (!dest._events || !dest._events.error)
	    dest.on('error', onerror);
	  else if (isArray(dest._events.error))
	    dest._events.error.unshift(onerror);
	  else
	    dest._events.error = [onerror, dest._events.error];



	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function() {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain)
	      state.awaitDrain--;
	    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}


	Readable.prototype.unpipe = function(dest) {
	  var state = this._readableState;

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0)
	    return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes)
	      return this;

	    if (!dest)
	      dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest)
	      dest.emit('unpipe', this);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++)
	      dests[i].emit('unpipe', this);
	    return this;
	  }

	  // try to find the right one.
	  var i = indexOf(state.pipes, dest);
	  if (i === -1)
	    return this;

	  state.pipes.splice(i, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1)
	    state.pipes = state.pipes[0];

	  dest.emit('unpipe', this);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function(ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  // If listening to data, and it has not explicitly been paused,
	  // then call resume to start the flow of data on the next tick.
	  if (ev === 'data' && false !== this._readableState.flowing) {
	    this.resume();
	  }

	  if (ev === 'readable' && this.readable) {
	    var state = this._readableState;
	    if (!state.readableListening) {
	      state.readableListening = true;
	      state.emittedReadable = false;
	      state.needReadable = true;
	      if (!state.reading) {
	        var self = this;
	        process.nextTick(function() {
	          debug('readable nexttick read 0');
	          self.read(0);
	        });
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function() {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    if (!state.reading) {
	      debug('resume read 0');
	      this.read(0);
	    }
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    process.nextTick(function() {
	      resume_(stream, state);
	    });
	  }
	}

	function resume_(stream, state) {
	  state.resumeScheduled = false;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading)
	    stream.read(0);
	}

	Readable.prototype.pause = function() {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  if (state.flowing) {
	    do {
	      var chunk = stream.read();
	    } while (null !== chunk && state.flowing);
	  }
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function(stream) {
	  var state = this._readableState;
	  var paused = false;

	  var self = this;
	  stream.on('end', function() {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length)
	        self.push(chunk);
	    }

	    self.push(null);
	  });

	  stream.on('data', function(chunk) {
	    debug('wrapped data');
	    if (state.decoder)
	      chunk = state.decoder.write(chunk);
	    if (!chunk || !state.objectMode && !chunk.length)
	      return;

	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
	      this[i] = function(method) { return function() {
	        return stream[method].apply(stream, arguments);
	      }}(i);
	    }
	  }

	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function(ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function(n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return self;
	};



	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	function fromList(n, state) {
	  var list = state.buffer;
	  var length = state.length;
	  var stringMode = !!state.decoder;
	  var objectMode = !!state.objectMode;
	  var ret;

	  // nothing in the list, definitely empty.
	  if (list.length === 0)
	    return null;

	  if (length === 0)
	    ret = null;
	  else if (objectMode)
	    ret = list.shift();
	  else if (!n || n >= length) {
	    // read it all, truncate the array.
	    if (stringMode)
	      ret = list.join('');
	    else
	      ret = Buffer.concat(list, length);
	    list.length = 0;
	  } else {
	    // read just some of it.
	    if (n < list[0].length) {
	      // just take a part of the first list item.
	      // slice is the same for buffers and strings.
	      var buf = list[0];
	      ret = buf.slice(0, n);
	      list[0] = buf.slice(n);
	    } else if (n === list[0].length) {
	      // first list is a perfect match
	      ret = list.shift();
	    } else {
	      // complex case.
	      // we have enough to cover it, but it spans past the first buffer.
	      if (stringMode)
	        ret = '';
	      else
	        ret = new Buffer(n);

	      var c = 0;
	      for (var i = 0, l = list.length; i < l && c < n; i++) {
	        var buf = list[0];
	        var cpy = Math.min(n - c, buf.length);

	        if (stringMode)
	          ret += buf.slice(0, cpy);
	        else
	          buf.copy(ret, c, 0, cpy);

	        if (cpy < buf.length)
	          list[0] = buf.slice(cpy);
	        else
	          list.shift();

	        c += cpy;
	      }
	    }
	  }

	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0)
	    throw new Error('endReadable called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    process.nextTick(function() {
	      // Check that we didn't get one last unshift.
	      if (!state.endEmitted && state.length === 0) {
	        state.endEmitted = true;
	        stream.readable = false;
	        stream.emit('end');
	      }
	    });
	  }
	}

	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	function indexOf (xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ },
/* 56 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(58)
	var ieee754 = __webpack_require__(59)
	var isArray = __webpack_require__(60)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	exports.kMaxLength = kMaxLength()

	function typedArraySupport () {
	  try {
	    var arr = new Uint8Array(1)
	    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
	    return arr.foo() === 42 && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length)
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length)
	    }
	    that.length = length
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192 // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype
	  return arr
	}

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	  if (typeof Symbol !== 'undefined' && Symbol.species &&
	      Buffer[Symbol.species] === Buffer) {
	    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	    Object.defineProperty(Buffer, Symbol.species, {
	      value: null,
	      configurable: true
	    })
	  }
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size)
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	}

	function allocUnsafe (that, size) {
	  assertSize(size)
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	}
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8'
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0
	  that = createBuffer(that, length)

	  var actual = that.write(string, encoding)

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual)
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0
	  that = createBuffer(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array)
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset)
	  } else {
	    array = new Uint8Array(array, byteOffset, length)
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array)
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (Buffer.isBuffer(obj)) {
	    var len = checked(obj.length) | 0
	    that = createBuffer(that, len)

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len)
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0
	  }
	  return Buffer.alloc(+length)
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i]
	      y = b[i]
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length)
	  var pos = 0
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i]
	    if (!Buffer.isBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos)
	    pos += buf.length
	  }
	  return buffer
	}

	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string
	  }

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0
	  start >>>= 0

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8'

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true

	function swap (b, n, m) {
	  var i = b[n]
	  b[n] = b[m]
	  b[m] = i
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1)
	  }
	  return this
	}

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3)
	    swap(this, i + 1, i + 2)
	  }
	  return this
	}

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7)
	    swap(this, i + 1, i + 6)
	    swap(this, i + 2, i + 5)
	    swap(this, i + 3, i + 4)
	  }
	  return this
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!Buffer.isBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0
	  }
	  if (thisStart === undefined) {
	    thisStart = 0
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0
	  end >>>= 0
	  thisStart >>>= 0
	  thisEnd >>>= 0

	  if (this === target) return 0

	  var x = thisEnd - thisStart
	  var y = end - start
	  var len = Math.min(x, y)

	  var thisCopy = this.slice(thisStart, thisEnd)
	  var targetCopy = target.slice(start, end)

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i]
	      y = targetCopy[i]
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset
	    byteOffset = 0
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000
	  }
	  byteOffset = +byteOffset  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1)
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding)
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1
	  var arrLength = arr.length
	  var valLength = val.length

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase()
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2
	      arrLength /= 2
	      valLength /= 2
	      byteOffset /= 2
	    }
	  }

	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i
	  if (dir) {
	    var foundIndex = -1
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex
	        foundIndex = -1
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	}

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end)
	    newBuf.__proto__ = Buffer.prototype
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    )
	  }

	  return len
	}

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start
	      start = 0
	      end = this.length
	    } else if (typeof end === 'string') {
	      encoding = end
	      end = this.length
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0)
	      if (code < 256) {
	        val = code
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0
	  end = end === undefined ? this.length : end >>> 0

	  if (!val) val = 0

	  var i
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val
	    }
	  } else {
	    var bytes = Buffer.isBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString())
	    var len = bytes.length
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len]
	    }
	  }

	  return this
	}

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(57).Buffer, (function() { return this; }())))

/***/ },
/* 58 */
/***/ function(module, exports) {

	'use strict'

	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray

	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}

	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63

	function placeHoldersCount (b64) {
	  var len = b64.length
	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
	}

	function byteLength (b64) {
	  // base64 is 4/3 + up to two characters of the original data
	  return b64.length * 3 / 4 - placeHoldersCount(b64)
	}

	function toByteArray (b64) {
	  var i, j, l, tmp, placeHolders, arr
	  var len = b64.length
	  placeHolders = placeHoldersCount(b64)

	  arr = new Arr(len * 3 / 4 - placeHolders)

	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len

	  var L = 0

	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
	    arr[L++] = (tmp >> 16) & 0xFF
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }

	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
	    arr[L++] = tmp & 0xFF
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
	    output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var output = ''
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1]
	    output += lookup[tmp >> 2]
	    output += lookup[(tmp << 4) & 0x3F]
	    output += '=='
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
	    output += lookup[tmp >> 10]
	    output += lookup[(tmp >> 4) & 0x3F]
	    output += lookup[(tmp << 2) & 0x3F]
	    output += '='
	  }

	  parts.push(output)

	  return parts.join('')
	}


/***/ },
/* 59 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 60 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.

	function isArray(arg) {
	  if (Array.isArray) {
	    return Array.isArray(arg);
	  }
	  return objectToString(arg) === '[object Array]';
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = Buffer.isBuffer;

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(57).Buffer))

/***/ },
/* 62 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 63 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	module.exports = Duplex;

	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) keys.push(key);
	  return keys;
	}
	/*</replacement>*/


	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(62);
	/*</replacement>*/

	var Readable = __webpack_require__(55);
	var Writable = __webpack_require__(65);

	util.inherits(Duplex, Readable);

	forEach(objectKeys(Writable.prototype), function(method) {
	  if (!Duplex.prototype[method])
	    Duplex.prototype[method] = Writable.prototype[method];
	});

	function Duplex(options) {
	  if (!(this instanceof Duplex))
	    return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false)
	    this.readable = false;

	  if (options && options.writable === false)
	    this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false)
	    this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended)
	    return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  process.nextTick(this.end.bind(this));
	}

	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, cb), and it'll handle all
	// the drain event emission and buffering.

	module.exports = Writable;

	/*<replacement>*/
	var Buffer = __webpack_require__(57).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;


	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(62);
	/*</replacement>*/

	var Stream = __webpack_require__(52);

	util.inherits(Writable, Stream);

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}

	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(64);

	  options = options || {};

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function(er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.buffer = [];

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;
	}

	function Writable(options) {
	  var Duplex = __webpack_require__(64);

	  // Writable ctor is applied to Duplexes, though they're not
	  // instanceof Writable, they're instanceof Readable.
	  if (!(this instanceof Writable) && !(this instanceof Duplex))
	    return new Writable(options);

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function() {
	  this.emit('error', new Error('Cannot pipe. Not readable.'));
	};


	function writeAfterEnd(stream, state, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  process.nextTick(function() {
	    cb(er);
	  });
	}

	// If we get something that is not a buffer, string, null, or undefined,
	// and we're not in objectMode, then that's an error.
	// Otherwise stream chunks are all considered to be of length=1, and the
	// watermarks determine how many objects to keep in the buffer, rather than
	// how many bytes or characters.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    var er = new TypeError('Invalid non-string/buffer chunk');
	    stream.emit('error', er);
	    process.nextTick(function() {
	      cb(er);
	    });
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function(chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;

	  if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }

	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  else if (!encoding)
	    encoding = state.defaultEncoding;

	  if (!util.isFunction(cb))
	    cb = function() {};

	  if (state.ended)
	    writeAfterEnd(this, state, cb);
	  else if (validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function() {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function() {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing &&
	        !state.corked &&
	        !state.finished &&
	        !state.bufferProcessing &&
	        state.buffer.length)
	      clearBuffer(this, state);
	  }
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode &&
	      state.decodeStrings !== false &&
	      util.isString(chunk)) {
	    chunk = new Buffer(chunk, encoding);
	  }
	  return chunk;
	}

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, cb) {
	  chunk = decodeChunk(state, chunk, encoding);
	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret)
	    state.needDrain = true;

	  if (state.writing || state.corked)
	    state.buffer.push(new WriteReq(chunk, encoding, cb));
	  else
	    doWrite(stream, state, false, len, chunk, encoding, cb);

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev)
	    stream._writev(chunk, state.onwrite);
	  else
	    stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  if (sync)
	    process.nextTick(function() {
	      state.pendingcb--;
	      cb(er);
	    });
	  else {
	    state.pendingcb--;
	    cb(er);
	  }

	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er)
	    onwriteError(stream, state, sync, er, cb);
	  else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(stream, state);

	    if (!finished &&
	        !state.corked &&
	        !state.bufferProcessing &&
	        state.buffer.length) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      process.nextTick(function() {
	        afterWrite(stream, state, finished, cb);
	      });
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished)
	    onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}


	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;

	  if (stream._writev && state.buffer.length > 1) {
	    // Fast case, write everything using _writev()
	    var cbs = [];
	    for (var c = 0; c < state.buffer.length; c++)
	      cbs.push(state.buffer[c].callback);

	    // count the one we are adding, as well.
	    // TODO(isaacs) clean this up
	    state.pendingcb++;
	    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
	      for (var i = 0; i < cbs.length; i++) {
	        state.pendingcb--;
	        cbs[i](err);
	      }
	    });

	    // Clear buffer
	    state.buffer = [];
	  } else {
	    // Slow case, write chunks one-by-one
	    for (var c = 0; c < state.buffer.length; c++) {
	      var entry = state.buffer[c];
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);

	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        c++;
	        break;
	      }
	    }

	    if (c < state.buffer.length)
	      state.buffer = state.buffer.slice(c);
	    else
	      state.buffer.length = 0;
	  }

	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function(chunk, encoding, cb) {
	  cb(new Error('not implemented'));

	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function(chunk, encoding, cb) {
	  var state = this._writableState;

	  if (util.isFunction(chunk)) {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }

	  if (!util.isNullOrUndefined(chunk))
	    this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished)
	    endWritable(this, state, cb);
	};


	function needFinish(stream, state) {
	  return (state.ending &&
	          state.length === 0 &&
	          !state.finished &&
	          !state.writing);
	}

	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(stream, state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else
	      prefinish(stream, state);
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished)
	      process.nextTick(cb);
	    else
	      stream.once('finish', cb);
	  }
	  state.ended = true;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var Buffer = __webpack_require__(57).Buffer;

	var isBufferEncoding = Buffer.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     }


	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	var StringDecoder = exports.StringDecoder = function(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }

	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	};


	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;

	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;

	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }

	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);

	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;

	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }

	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);

	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }

	  charStr += buffer.toString(this.encoding, 0, end);

	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }

	  // or just emit the charStr
	  return charStr;
	};

	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;

	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];

	    // See http://en.wikipedia.org/wiki/UTF-8#Description

	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }

	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }

	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};

	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);

	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }

	  return res;
	};

	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}

	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}

	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.


	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	module.exports = Transform;

	var Duplex = __webpack_require__(64);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(62);
	/*</replacement>*/

	util.inherits(Transform, Duplex);


	function TransformState(options, stream) {
	  this.afterTransform = function(er, data) {
	    return afterTransform(stream, er, data);
	  };

	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	}

	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb)
	    return stream.emit('error', new Error('no writecb in Transform class'));

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (!util.isNullOrUndefined(data))
	    stream.push(data);

	  if (cb)
	    cb(er);

	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}


	function Transform(options) {
	  if (!(this instanceof Transform))
	    return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = new TransformState(options, this);

	  // when the writable side finishes, then flush out anything remaining.
	  var stream = this;

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  this.once('prefinish', function() {
	    if (util.isFunction(this._flush))
	      this._flush(function(er) {
	        done(stream, er);
	      });
	    else
	      done(stream);
	  });
	}

	Transform.prototype.push = function(chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function(chunk, encoding, cb) {
	  throw new Error('not implemented');
	};

	Transform.prototype._write = function(chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform ||
	        rs.needReadable ||
	        rs.length < rs.highWaterMark)
	      this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function(n) {
	  var ts = this._transformState;

	  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};


	function done(stream, er) {
	  if (er)
	    return stream.emit('error', er);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;

	  if (ws.length)
	    throw new Error('calling transform done when ws.length != 0');

	  if (ts.transforming)
	    throw new Error('calling transform done when still transforming');

	  return stream.push(null);
	}


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	module.exports = PassThrough;

	var Transform = __webpack_require__(67);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(62);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough))
	    return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function(chunk, encoding, cb) {
	  cb(null, chunk);
	};


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(65)


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(64)


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(67)


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(68)


/***/ },
/* 73 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = ProxyHandler;

	function ProxyHandler(cbs){
		this._cbs = cbs || {};
	}

	var EVENTS = __webpack_require__(37).EVENTS;
	Object.keys(EVENTS).forEach(function(name){
		if(EVENTS[name] === 0){
			name = "on" + name;
			ProxyHandler.prototype[name] = function(){
				if(this._cbs[name]) this._cbs[name]();
			};
		} else if(EVENTS[name] === 1){
			name = "on" + name;
			ProxyHandler.prototype[name] = function(a){
				if(this._cbs[name]) this._cbs[name](a);
			};
		} else if(EVENTS[name] === 2){
			name = "on" + name;
			ProxyHandler.prototype[name] = function(a, b){
				if(this._cbs[name]) this._cbs[name](a, b);
			};
		} else {
			throw Error("wrong number of arguments");
		}
	});

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var DomUtils = module.exports;

	[
		__webpack_require__(76),
		__webpack_require__(82),
		__webpack_require__(83),
		__webpack_require__(84),
		__webpack_require__(85),
		__webpack_require__(86)
	].forEach(function(ext){
		Object.keys(ext).forEach(function(key){
			DomUtils[key] = ext[key].bind(DomUtils);
		});
	});


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var ElementType = __webpack_require__(46),
	    getOuterHTML = __webpack_require__(77),
	    isTag = ElementType.isTag;

	module.exports = {
		getInnerHTML: getInnerHTML,
		getOuterHTML: getOuterHTML,
		getText: getText
	};

	function getInnerHTML(elem, opts){
		return elem.children ? elem.children.map(function(elem){
			return getOuterHTML(elem, opts);
		}).join("") : "";
	}

	function getText(elem){
		if(Array.isArray(elem)) return elem.map(getText).join("");
		if(isTag(elem) || elem.type === ElementType.CDATA) return getText(elem.children);
		if(elem.type === ElementType.Text) return elem.data;
		return "";
	}


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  Module dependencies
	*/
	var ElementType = __webpack_require__(78);
	var entities = __webpack_require__(79);

	/*
	  Boolean Attributes
	*/
	var booleanAttributes = {
	  __proto__: null,
	  allowfullscreen: true,
	  async: true,
	  autofocus: true,
	  autoplay: true,
	  checked: true,
	  controls: true,
	  default: true,
	  defer: true,
	  disabled: true,
	  hidden: true,
	  ismap: true,
	  loop: true,
	  multiple: true,
	  muted: true,
	  open: true,
	  readonly: true,
	  required: true,
	  reversed: true,
	  scoped: true,
	  seamless: true,
	  selected: true,
	  typemustmatch: true
	};

	var unencodedElements = {
	  __proto__: null,
	  style: true,
	  script: true,
	  xmp: true,
	  iframe: true,
	  noembed: true,
	  noframes: true,
	  plaintext: true,
	  noscript: true
	};

	/*
	  Format attributes
	*/
	function formatAttrs(attributes, opts) {
	  if (!attributes) return;

	  var output = '',
	      value;

	  // Loop through the attributes
	  for (var key in attributes) {
	    value = attributes[key];
	    if (output) {
	      output += ' ';
	    }

	    if (!value && booleanAttributes[key]) {
	      output += key;
	    } else {
	      output += key + '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"';
	    }
	  }

	  return output;
	}

	/*
	  Self-enclosing tags (stolen from node-htmlparser)
	*/
	var singleTag = {
	  __proto__: null,
	  area: true,
	  base: true,
	  basefont: true,
	  br: true,
	  col: true,
	  command: true,
	  embed: true,
	  frame: true,
	  hr: true,
	  img: true,
	  input: true,
	  isindex: true,
	  keygen: true,
	  link: true,
	  meta: true,
	  param: true,
	  source: true,
	  track: true,
	  wbr: true,
	};


	var render = module.exports = function(dom, opts) {
	  if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
	  opts = opts || {};

	  var output = '';

	  for(var i = 0; i < dom.length; i++){
	    var elem = dom[i];

	    if (elem.type === 'root')
	      output += render(elem.children, opts);
	    else if (ElementType.isTag(elem))
	      output += renderTag(elem, opts);
	    else if (elem.type === ElementType.Directive)
	      output += renderDirective(elem);
	    else if (elem.type === ElementType.Comment)
	      output += renderComment(elem);
	    else if (elem.type === ElementType.CDATA)
	      output += renderCdata(elem);
	    else
	      output += renderText(elem, opts);
	  }

	  return output;
	};

	function renderTag(elem, opts) {
	  // Handle SVG
	  if (elem.name === "svg") opts = {decodeEntities: opts.decodeEntities, xmlMode: true};

	  var tag = '<' + elem.name,
	      attribs = formatAttrs(elem.attribs, opts);

	  if (attribs) {
	    tag += ' ' + attribs;
	  }

	  if (
	    opts.xmlMode
	    && (!elem.children || elem.children.length === 0)
	  ) {
	    tag += '/>';
	  } else {
	    tag += '>';
	    if (elem.children) {
	      tag += render(elem.children, opts);
	    }

	    if (!singleTag[elem.name] || opts.xmlMode) {
	      tag += '</' + elem.name + '>';
	    }
	  }

	  return tag;
	}

	function renderDirective(elem) {
	  return '<' + elem.data + '>';
	}

	function renderText(elem, opts) {
	  var data = elem.data || '';

	  // if entities weren't decoded, no need to encode them back
	  if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
	    data = entities.encodeXML(data);
	  }

	  return data;
	}

	function renderCdata(elem) {
	  return '<![CDATA[' + elem.children[0].data + ']]>';
	}

	function renderComment(elem) {
	  return '<!--' + elem.data + '-->';
	}


/***/ },
/* 78 */
/***/ function(module, exports) {

	//Types of elements found in the DOM
	module.exports = {
		Text: "text", //Text
		Directive: "directive", //<? ... ?>
		Comment: "comment", //<!-- ... -->
		Script: "script", //<script> tags
		Style: "style", //<style> tags
		Tag: "tag", //Any tag
		CDATA: "cdata", //<![CDATA[ ... ]]>

		isTag: function(elem){
			return elem.type === "tag" || elem.type === "script" || elem.type === "style";
		}
	};

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var encode = __webpack_require__(80),
	    decode = __webpack_require__(81);

	exports.decode = function(data, level){
		return (!level || level <= 0 ? decode.XML : decode.HTML)(data);
	};

	exports.decodeStrict = function(data, level){
		return (!level || level <= 0 ? decode.XML : decode.HTMLStrict)(data);
	};

	exports.encode = function(data, level){
		return (!level || level <= 0 ? encode.XML : encode.HTML)(data);
	};

	exports.encodeXML = encode.XML;

	exports.encodeHTML4 =
	exports.encodeHTML5 =
	exports.encodeHTML  = encode.HTML;

	exports.decodeXML =
	exports.decodeXMLStrict = decode.XML;

	exports.decodeHTML4 =
	exports.decodeHTML5 =
	exports.decodeHTML = decode.HTML;

	exports.decodeHTML4Strict =
	exports.decodeHTML5Strict =
	exports.decodeHTMLStrict = decode.HTMLStrict;

	exports.escape = encode.escape;


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var inverseXML = getInverseObj(__webpack_require__(44)),
	    xmlReplacer = getInverseReplacer(inverseXML);

	exports.XML = getInverse(inverseXML, xmlReplacer);

	var inverseHTML = getInverseObj(__webpack_require__(42)),
	    htmlReplacer = getInverseReplacer(inverseHTML);

	exports.HTML = getInverse(inverseHTML, htmlReplacer);

	function getInverseObj(obj){
		return Object.keys(obj).sort().reduce(function(inverse, name){
			inverse[obj[name]] = "&" + name + ";";
			return inverse;
		}, {});
	}

	function getInverseReplacer(inverse){
		var single = [],
		    multiple = [];

		Object.keys(inverse).forEach(function(k){
			if(k.length === 1){
				single.push("\\" + k);
			} else {
				multiple.push(k);
			}
		});

		//TODO add ranges
		multiple.unshift("[" + single.join("") + "]");

		return new RegExp(multiple.join("|"), "g");
	}

	var re_nonASCII = /[^\0-\x7F]/g,
	    re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

	function singleCharReplacer(c){
		return "&#x" + c.charCodeAt(0).toString(16).toUpperCase() + ";";
	}

	function astralReplacer(c){
		// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
		var high = c.charCodeAt(0);
		var low  = c.charCodeAt(1);
		var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
		return "&#x" + codePoint.toString(16).toUpperCase() + ";";
	}

	function getInverse(inverse, re){
		function func(name){
			return inverse[name];
		}

		return function(data){
			return data
					.replace(re, func)
					.replace(re_astralSymbols, astralReplacer)
					.replace(re_nonASCII, singleCharReplacer);
		};
	}

	var re_xmlChars = getInverseReplacer(inverseXML);

	function escapeXML(data){
		return data
				.replace(re_xmlChars, singleCharReplacer)
				.replace(re_astralSymbols, astralReplacer)
				.replace(re_nonASCII, singleCharReplacer);
	}

	exports.escape = escapeXML;


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var entityMap = __webpack_require__(42),
	    legacyMap = __webpack_require__(43),
	    xmlMap    = __webpack_require__(44),
	    decodeCodePoint = __webpack_require__(40);

	var decodeXMLStrict  = getStrictDecoder(xmlMap),
	    decodeHTMLStrict = getStrictDecoder(entityMap);

	function getStrictDecoder(map){
		var keys = Object.keys(map).join("|"),
		    replace = getReplacer(map);

		keys += "|#[xX][\\da-fA-F]+|#\\d+";

		var re = new RegExp("&(?:" + keys + ");", "g");

		return function(str){
			return String(str).replace(re, replace);
		};
	}

	var decodeHTML = (function(){
		var legacy = Object.keys(legacyMap)
			.sort(sorter);

		var keys = Object.keys(entityMap)
			.sort(sorter);

		for(var i = 0, j = 0; i < keys.length; i++){
			if(legacy[j] === keys[i]){
				keys[i] += ";?";
				j++;
			} else {
				keys[i] += ";";
			}
		}

		var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"),
		    replace = getReplacer(entityMap);

		function replacer(str){
			if(str.substr(-1) !== ";") str += ";";
			return replace(str);
		}

		//TODO consider creating a merged map
		return function(str){
			return String(str).replace(re, replacer);
		};
	}());

	function sorter(a, b){
		return a < b ? 1 : -1;
	}

	function getReplacer(map){
		return function replace(str){
			if(str.charAt(1) === "#"){
				if(str.charAt(2) === "X" || str.charAt(2) === "x"){
					return decodeCodePoint(parseInt(str.substr(3), 16));
				}
				return decodeCodePoint(parseInt(str.substr(2), 10));
			}
			return map[str.slice(1, -1)];
		};
	}

	module.exports = {
		XML: decodeXMLStrict,
		HTML: decodeHTML,
		HTMLStrict: decodeHTMLStrict
	};

/***/ },
/* 82 */
/***/ function(module, exports) {

	var getChildren = exports.getChildren = function(elem){
		return elem.children;
	};

	var getParent = exports.getParent = function(elem){
		return elem.parent;
	};

	exports.getSiblings = function(elem){
		var parent = getParent(elem);
		return parent ? getChildren(parent) : [elem];
	};

	exports.getAttributeValue = function(elem, name){
		return elem.attribs && elem.attribs[name];
	};

	exports.hasAttrib = function(elem, name){
		return !!elem.attribs && hasOwnProperty.call(elem.attribs, name);
	};

	exports.getName = function(elem){
		return elem.name;
	};


/***/ },
/* 83 */
/***/ function(module, exports) {

	exports.removeElement = function(elem){
		if(elem.prev) elem.prev.next = elem.next;
		if(elem.next) elem.next.prev = elem.prev;

		if(elem.parent){
			var childs = elem.parent.children;
			childs.splice(childs.lastIndexOf(elem), 1);
		}
	};

	exports.replaceElement = function(elem, replacement){
		var prev = replacement.prev = elem.prev;
		if(prev){
			prev.next = replacement;
		}

		var next = replacement.next = elem.next;
		if(next){
			next.prev = replacement;
		}

		var parent = replacement.parent = elem.parent;
		if(parent){
			var childs = parent.children;
			childs[childs.lastIndexOf(elem)] = replacement;
		}
	};

	exports.appendChild = function(elem, child){
		child.parent = elem;

		if(elem.children.push(child) !== 1){
			var sibling = elem.children[elem.children.length - 2];
			sibling.next = child;
			child.prev = sibling;
			child.next = null;
		}
	};

	exports.append = function(elem, next){
		var parent = elem.parent,
			currNext = elem.next;

		next.next = currNext;
		next.prev = elem;
		elem.next = next;
		next.parent = parent;

		if(currNext){
			currNext.prev = next;
			if(parent){
				var childs = parent.children;
				childs.splice(childs.lastIndexOf(currNext), 0, next);
			}
		} else if(parent){
			parent.children.push(next);
		}
	};

	exports.prepend = function(elem, prev){
		var parent = elem.parent;
		if(parent){
			var childs = parent.children;
			childs.splice(childs.lastIndexOf(elem), 0, prev);
		}

		if(elem.prev){
			elem.prev.next = prev;
		}
		
		prev.parent = parent;
		prev.prev = elem.prev;
		prev.next = elem;
		elem.prev = prev;
	};




/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var isTag = __webpack_require__(46).isTag;

	module.exports = {
		filter: filter,
		find: find,
		findOneChild: findOneChild,
		findOne: findOne,
		existsOne: existsOne,
		findAll: findAll
	};

	function filter(test, element, recurse, limit){
		if(!Array.isArray(element)) element = [element];

		if(typeof limit !== "number" || !isFinite(limit)){
			limit = Infinity;
		}
		return find(test, element, recurse !== false, limit);
	}

	function find(test, elems, recurse, limit){
		var result = [], childs;

		for(var i = 0, j = elems.length; i < j; i++){
			if(test(elems[i])){
				result.push(elems[i]);
				if(--limit <= 0) break;
			}

			childs = elems[i].children;
			if(recurse && childs && childs.length > 0){
				childs = find(test, childs, recurse, limit);
				result = result.concat(childs);
				limit -= childs.length;
				if(limit <= 0) break;
			}
		}

		return result;
	}

	function findOneChild(test, elems){
		for(var i = 0, l = elems.length; i < l; i++){
			if(test(elems[i])) return elems[i];
		}

		return null;
	}

	function findOne(test, elems){
		var elem = null;

		for(var i = 0, l = elems.length; i < l && !elem; i++){
			if(!isTag(elems[i])){
				continue;
			} else if(test(elems[i])){
				elem = elems[i];
			} else if(elems[i].children.length > 0){
				elem = findOne(test, elems[i].children);
			}
		}

		return elem;
	}

	function existsOne(test, elems){
		for(var i = 0, l = elems.length; i < l; i++){
			if(
				isTag(elems[i]) && (
					test(elems[i]) || (
						elems[i].children.length > 0 &&
						existsOne(test, elems[i].children)
					)
				)
			){
				return true;
			}
		}

		return false;
	}

	function findAll(test, elems){
		var result = [];
		for(var i = 0, j = elems.length; i < j; i++){
			if(!isTag(elems[i])) continue;
			if(test(elems[i])) result.push(elems[i]);

			if(elems[i].children.length > 0){
				result = result.concat(findAll(test, elems[i].children));
			}
		}
		return result;
	}


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var ElementType = __webpack_require__(46);
	var isTag = exports.isTag = ElementType.isTag;

	exports.testElement = function(options, element){
		for(var key in options){
			if(!options.hasOwnProperty(key));
			else if(key === "tag_name"){
				if(!isTag(element) || !options.tag_name(element.name)){
					return false;
				}
			} else if(key === "tag_type"){
				if(!options.tag_type(element.type)) return false;
			} else if(key === "tag_contains"){
				if(isTag(element) || !options.tag_contains(element.data)){
					return false;
				}
			} else if(!element.attribs || !options[key](element.attribs[key])){
				return false;
			}
		}
		return true;
	};

	var Checks = {
		tag_name: function(name){
			if(typeof name === "function"){
				return function(elem){ return isTag(elem) && name(elem.name); };
			} else if(name === "*"){
				return isTag;
			} else {
				return function(elem){ return isTag(elem) && elem.name === name; };
			}
		},
		tag_type: function(type){
			if(typeof type === "function"){
				return function(elem){ return type(elem.type); };
			} else {
				return function(elem){ return elem.type === type; };
			}
		},
		tag_contains: function(data){
			if(typeof data === "function"){
				return function(elem){ return !isTag(elem) && data(elem.data); };
			} else {
				return function(elem){ return !isTag(elem) && elem.data === data; };
			}
		}
	};

	function getAttribCheck(attrib, value){
		if(typeof value === "function"){
			return function(elem){ return elem.attribs && value(elem.attribs[attrib]); };
		} else {
			return function(elem){ return elem.attribs && elem.attribs[attrib] === value; };
		}
	}

	function combineFuncs(a, b){
		return function(elem){
			return a(elem) || b(elem);
		};
	}

	exports.getElements = function(options, element, recurse, limit){
		var funcs = Object.keys(options).map(function(key){
			var value = options[key];
			return key in Checks ? Checks[key](value) : getAttribCheck(key, value);
		});

		return funcs.length === 0 ? [] : this.filter(
			funcs.reduce(combineFuncs),
			element, recurse, limit
		);
	};

	exports.getElementById = function(id, element, recurse){
		if(!Array.isArray(element)) element = [element];
		return this.findOne(getAttribCheck("id", id), element, recurse !== false);
	};

	exports.getElementsByTagName = function(name, element, recurse, limit){
		return this.filter(Checks.tag_name(name), element, recurse, limit);
	};

	exports.getElementsByTagType = function(type, element, recurse, limit){
		return this.filter(Checks.tag_type(type), element, recurse, limit);
	};


/***/ },
/* 86 */
/***/ function(module, exports) {

	// removeSubsets
	// Given an array of nodes, remove any member that is contained by another.
	exports.removeSubsets = function(nodes) {
		var idx = nodes.length, node, ancestor, replace;

		// Check if each node (or one of its ancestors) is already contained in the
		// array.
		while (--idx > -1) {
			node = ancestor = nodes[idx];

			// Temporarily remove the node under consideration
			nodes[idx] = null;
			replace = true;

			while (ancestor) {
				if (nodes.indexOf(ancestor) > -1) {
					replace = false;
					nodes.splice(idx, 1);
					break;
				}
				ancestor = ancestor.parent;
			}

			// If the node has been found to be unique, re-insert it.
			if (replace) {
				nodes[idx] = node;
			}
		}

		return nodes;
	};

	// Source: http://dom.spec.whatwg.org/#dom-node-comparedocumentposition
	var POSITION = {
		DISCONNECTED: 1,
		PRECEDING: 2,
		FOLLOWING: 4,
		CONTAINS: 8,
		CONTAINED_BY: 16
	};

	// Compare the position of one node against another node in any other document.
	// The return value is a bitmask with the following values:
	//
	// document order:
	// > There is an ordering, document order, defined on all the nodes in the
	// > document corresponding to the order in which the first character of the
	// > XML representation of each node occurs in the XML representation of the
	// > document after expansion of general entities. Thus, the document element
	// > node will be the first node. Element nodes occur before their children.
	// > Thus, document order orders element nodes in order of the occurrence of
	// > their start-tag in the XML (after expansion of entities). The attribute
	// > nodes of an element occur after the element and before its children. The
	// > relative order of attribute nodes is implementation-dependent./
	// Source:
	// http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
	//
	// @argument {Node} nodaA The first node to use in the comparison
	// @argument {Node} nodeB The second node to use in the comparison
	//
	// @return {Number} A bitmask describing the input nodes' relative position.
	//         See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
	//         a description of these values.
	var comparePos = exports.compareDocumentPosition = function(nodeA, nodeB) {
		var aParents = [];
		var bParents = [];
		var current, sharedParent, siblings, aSibling, bSibling, idx;

		if (nodeA === nodeB) {
			return 0;
		}

		current = nodeA;
		while (current) {
			aParents.unshift(current);
			current = current.parent;
		}
		current = nodeB;
		while (current) {
			bParents.unshift(current);
			current = current.parent;
		}

		idx = 0;
		while (aParents[idx] === bParents[idx]) {
			idx++;
		}

		if (idx === 0) {
			return POSITION.DISCONNECTED;
		}

		sharedParent = aParents[idx - 1];
		siblings = sharedParent.children;
		aSibling = aParents[idx];
		bSibling = bParents[idx];

		if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
			if (sharedParent === nodeB) {
				return POSITION.FOLLOWING | POSITION.CONTAINED_BY;
			}
			return POSITION.FOLLOWING;
		} else {
			if (sharedParent === nodeA) {
				return POSITION.PRECEDING | POSITION.CONTAINS;
			}
			return POSITION.PRECEDING;
		}
	};

	// Sort an array of nodes based on their relative position in the document and
	// remove any duplicate nodes. If the array contains nodes that do not belong
	// to the same document, sort order is unspecified.
	//
	// @argument {Array} nodes Array of DOM nodes
	//
	// @returns {Array} collection of unique nodes, sorted in document order
	exports.uniqueSort = function(nodes) {
		var idx = nodes.length, node, position;

		nodes = nodes.slice();

		while (--idx > -1) {
			node = nodes[idx];
			position = nodes.indexOf(node);
			if (position > -1 && position < idx) {
				nodes.splice(idx, 1);
			}
		}
		nodes.sort(function(a, b) {
			var relative = comparePos(a, b);
			if (relative & POSITION.PRECEDING) {
				return -1;
			} else if (relative & POSITION.FOLLOWING) {
				return 1;
			}
			return 0;
		});

		return nodes;
	};


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = CollectingHandler;

	function CollectingHandler(cbs){
		this._cbs = cbs || {};
		this.events = [];
	}

	var EVENTS = __webpack_require__(37).EVENTS;
	Object.keys(EVENTS).forEach(function(name){
		if(EVENTS[name] === 0){
			name = "on" + name;
			CollectingHandler.prototype[name] = function(){
				this.events.push([name]);
				if(this._cbs[name]) this._cbs[name]();
			};
		} else if(EVENTS[name] === 1){
			name = "on" + name;
			CollectingHandler.prototype[name] = function(a){
				this.events.push([name, a]);
				if(this._cbs[name]) this._cbs[name](a);
			};
		} else if(EVENTS[name] === 2){
			name = "on" + name;
			CollectingHandler.prototype[name] = function(a, b){
				this.events.push([name, a, b]);
				if(this._cbs[name]) this._cbs[name](a, b);
			};
		} else {
			throw Error("wrong number of arguments");
		}
	});

	CollectingHandler.prototype.onreset = function(){
		this.events = [];
		if(this._cbs.onreset) this._cbs.onreset();
	};

	CollectingHandler.prototype.restart = function(){
		if(this._cbs.onreset) this._cbs.onreset();

		for(var i = 0, len = this.events.length; i < len; i++){
			if(this._cbs[this.events[i][0]]){

				var num = this.events[i].length;

				if(num === 1){
					this._cbs[this.events[i][0]]();
				} else if(num === 2){
					this._cbs[this.events[i][0]](this.events[i][1]);
				} else {
					this._cbs[this.events[i][0]](this.events[i][1], this.events[i][2]);
				}
			}
		}
	};


/***/ },
/* 88 */
/***/ function(module, exports) {

	/**
	 * Escape a string to be safe to use in XML content.
	 * CC-BY-SA: hgoebl
	 * https://stackoverflow.com/questions/7918868/
	 * how-to-escape-xml-entities-in-javascript
	 * @param {!string} unsafe Unsafe string.
	 * @return {string} XML-escaped string, for use within an XML tag.
	 */
	var xmlEscape = function (unsafe) {
	    return unsafe.replace(/[<>&'"]/g, function (c) {
	        switch (c) {
	        case '<': return '&lt;';
	        case '>': return '&gt;';
	        case '&': return '&amp;';
	        case '\'': return '&apos;';
	        case '"': return '&quot;';
	        }
	    });
	};

	module.exports = xmlEscape;


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var Timer = __webpack_require__(18);

	var Clock = function (runtime) {
	    this._projectTimer = new Timer();
	    this._projectTimer.start();
	    this._pausedTime = null;
	    this._paused = false;
	    /**
	     * Reference to the owning Runtime.
	     * @type{!Runtime}
	     */
	    this.runtime = runtime;
	};

	Clock.prototype.projectTimer = function () {
	    if (this._paused) {
	        return this._pausedTime / 1000;
	    }
	    return this._projectTimer.timeElapsed() / 1000;
	};

	Clock.prototype.pause = function () {
	    this._paused = true;
	    this._pausedTime = this._projectTimer.timeElapsed();
	};

	Clock.prototype.resume = function () {
	    this._paused = false;
	    var dt = this._projectTimer.timeElapsed() - this._pausedTime;
	    this._projectTimer.startTime += dt;
	};

	Clock.prototype.resetProjectTimer = function () {
	    this._projectTimer.start();
	};

	module.exports = Clock;


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);

	var Keyboard = function (runtime) {
	    /**
	     * List of currently pressed keys.
	     * @type{Array.<number>}
	     */
	    this._keysPressed = [];
	    /**
	     * Reference to the owning Runtime.
	     * Can be used, for example, to activate hats.
	     * @type{!Runtime}
	     */
	    this.runtime = runtime;
	};

	/**
	 * Convert a Scratch key name to a DOM keyCode.
	 * @param {Any} keyName Scratch key argument.
	 * @return {number} Key code corresponding to a DOM event.
	 * @private
	 */
	Keyboard.prototype._scratchKeyToKeyCode = function (keyName) {
	    if (typeof keyName === 'number') {
	        // Key codes placed in with number blocks.
	        return keyName;
	    }
	    var keyString = Cast.toString(keyName);
	    switch (keyString) {
	    case 'space': return 32;
	    case 'left arrow': return 37;
	    case 'up arrow': return 38;
	    case 'right arrow': return 39;
	    case 'down arrow': return 40;
	    // @todo: Consider adding other special keys here.
	    }
	    // Keys reported by DOM keyCode are upper case.
	    return keyString.toUpperCase().charCodeAt(0);
	};

	/**
	 * Convert a DOM keyCode into a Scratch key name.
	 * @param  {number} keyCode Key code from DOM event.
	 * @return {Any} Scratch key argument.
	 * @private
	 */
	Keyboard.prototype._keyCodeToScratchKey = function (keyCode) {
	    if (keyCode >= 48 && keyCode <= 90) {
	        // Standard letter.
	        return String.fromCharCode(keyCode).toLowerCase();
	    }
	    switch (keyCode) {
	    case 32: return 'space';
	    case 37: return 'left arrow';
	    case 38: return 'up arrow';
	    case 39: return 'right arrow';
	    case 40: return 'down arrow';
	    }
	    return null;
	};

	/**
	 * Keyboard DOM event handler.
	 * @param  {object} data Data from DOM event.
	 */
	Keyboard.prototype.postData = function (data) {
	    if (data.keyCode) {
	        var index = this._keysPressed.indexOf(data.keyCode);
	        if (data.isDown) {
	            // If not already present, add to the list.
	            if (index < 0) {
	                this._keysPressed.push(data.keyCode);
	            }
	            // Always trigger hats, even if it was already pressed.
	            this.runtime.startHats('event_whenkeypressed', {
	                KEY_OPTION: this._keyCodeToScratchKey(data.keyCode)
	            });
	            this.runtime.startHats('event_whenkeypressed', {
	                KEY_OPTION: 'any'
	            });
	        } else if (index > -1) {
	            // If already present, remove from the list.
	            this._keysPressed.splice(index, 1);
	        }
	    }
	};

	/**
	 * Get key down state for a specified Scratch key name.
	 * @param  {Any} key Scratch key argument.
	 * @return {boolean} Is the specified key down?
	 */
	Keyboard.prototype.getKeyIsDown = function (key) {
	    if (key === 'any') {
	        return this._keysPressed.length > 0;
	    }
	    var keyCode = this._scratchKeyToKeyCode(key);
	    return this._keysPressed.indexOf(keyCode) > -1;
	};

	module.exports = Keyboard;


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var Color = __webpack_require__(92);

	var Cast = function () {};

	/**
	 * @fileoverview
	 * Utilities for casting and comparing Scratch data-types.
	 * Scratch behaves slightly differently from JavaScript in many respects,
	 * and these differences should be encapsulated below.
	 * For example, in Scratch, add(1, join("hello", world")) -> 1.
	 * This is because "hello world" is cast to 0.
	 * In JavaScript, 1 + Number("hello" + "world") would give you NaN.
	 * Use when coercing a value before computation.
	 */

	/**
	 * Scratch cast to number.
	 * Treats NaN as 0.
	 * In Scratch 2.0, this is captured by `interp.numArg.`
	 * @param {*} value Value to cast to number.
	 * @return {number} The Scratch-casted number value.
	 */
	Cast.toNumber = function (value) {
	    var n = Number(value);
	    if (isNaN(n)) {
	        // Scratch treats NaN as 0, when needed as a number.
	        // E.g., 0 + NaN -> 0.
	        return 0;
	    }
	    return n;
	};

	/**
	 * Scratch cast to boolean.
	 * In Scratch 2.0, this is captured by `interp.boolArg.`
	 * Treats some string values differently from JavaScript.
	 * @param {*} value Value to cast to boolean.
	 * @return {boolean} The Scratch-casted boolean value.
	 */
	Cast.toBoolean = function (value) {
	    // Already a boolean?
	    if (typeof value === 'boolean') {
	        return value;
	    }
	    if (typeof value === 'string') {
	        // These specific strings are treated as false in Scratch.
	        if ((value === '') ||
	            (value === '0') ||
	            (value.toLowerCase() === 'false')) {
	            return false;
	        }
	        // All other strings treated as true.
	        return true;
	    }
	    // Coerce other values and numbers.
	    return Boolean(value);
	};

	/**
	 * Scratch cast to string.
	 * @param {*} value Value to cast to string.
	 * @return {string} The Scratch-casted string value.
	 */
	Cast.toString = function (value) {
	    return String(value);
	};

	/**
	 * Cast any Scratch argument to an RGB color object to be used for the renderer.
	 * @param {*} value Value to convert to RGB color object.
	 * @return {Array.<number>} [r,g,b], values between 0-255.
	 */
	Cast.toRgbColorList = function (value) {
	    var color;
	    if (typeof value === 'string' && value.substring(0, 1) === '#') {
	        color = Color.hexToRgb(value);
	    } else {
	        color = Color.decimalToRgb(Cast.toNumber(value));
	    }
	    return [color.r, color.g, color.b];
	};

	/**
	 * Compare two values, using Scratch cast, case-insensitive string compare, etc.
	 * In Scratch 2.0, this is captured by `interp.compare.`
	 * @param {*} v1 First value to compare.
	 * @param {*} v2 Second value to compare.
	 * @returns {Number} Negative number if v1 < v2; 0 if equal; positive otherwise.
	 */
	Cast.compare = function (v1, v2) {
	    var n1 = Number(v1);
	    var n2 = Number(v2);
	    if (isNaN(n1) || isNaN(n2)) {
	        // At least one argument can't be converted to a number.
	        // Scratch compares strings as case insensitive.
	        var s1 = String(v1).toLowerCase();
	        var s2 = String(v2).toLowerCase();
	        return s1.localeCompare(s2);
	    } else {
	        // Compare as numbers.
	        return n1 - n2;
	    }
	};

	/**
	 * Determine if a Scratch argument number represents a round integer.
	 * @param {*} val Value to check.
	 * @return {boolean} True if number looks like an integer.
	 */
	Cast.isInt = function (val) {
	    // Values that are already numbers.
	    if (typeof val === 'number') {
	        if (isNaN(val)) { // NaN is considered an integer.
	            return true;
	        }
	        // True if it's "round" (e.g., 2.0 and 2).
	        return val === parseInt(val, 10);
	    } else if (typeof val === 'boolean') {
	        // `True` and `false` always represent integer after Scratch cast.
	        return true;
	    } else if (typeof val === 'string') {
	        // If it contains a decimal point, don't consider it an int.
	        return val.indexOf('.') < 0;
	    }
	    return false;
	};

	Cast.LIST_INVALID = 'INVALID';
	Cast.LIST_ALL = 'ALL';
	/**
	 * Compute a 1-based index into a list, based on a Scratch argument.
	 * Two special cases may be returned:
	 * LIST_ALL: if the block is referring to all of the items in the list.
	 * LIST_INVALID: if the index was invalid in any way.
	 * @param {*} index Scratch arg, including 1-based numbers or special cases.
	 * @param {number} length Length of the list.
	 * @return {(number|string)} 1-based index for list, LIST_ALL, or LIST_INVALID.
	 */
	Cast.toListIndex = function (index, length) {
	    if (typeof index !== 'number') {
	        if (index === 'all') {
	            return Cast.LIST_ALL;
	        }
	        if (index === 'last') {
	            if (length > 0) {
	                return length;
	            }
	            return Cast.LIST_INVALID;
	        } else if (index === 'random' || index === 'any') {
	            if (length > 0) {
	                return 1 + Math.floor(Math.random() * length);
	            }
	            return Cast.LIST_INVALID;
	        }
	    }
	    index = Math.floor(Cast.toNumber(index));
	    if (index < 1 || index > length) {
	        return Cast.LIST_INVALID;
	    }
	    return index;
	};

	module.exports = Cast;


/***/ },
/* 92 */
/***/ function(module, exports) {

	var Color = function () {};

	/**
	 * Convert a Scratch decimal color to a hex string, #RRGGBB.
	 * @param {number} decimal RGB color as a decimal.
	 * @return {string} RGB color as #RRGGBB hex string.
	 */
	Color.decimalToHex = function (decimal) {
	    if (decimal < 0) {
	        decimal += 0xFFFFFF + 1;
	    }
	    var hex = Number(decimal).toString(16);
	    hex = '#' + '000000'.substr(0, 6 - hex.length) + hex;
	    return hex;
	};

	/**
	 * Convert a Scratch decimal color to an RGB color object.
	 * @param {number} decimal RGB color as decimal.
	 * @returns {Object} {r: R, g: G, b: B}, values between 0-255
	 */
	Color.decimalToRgb = function (decimal) {
	    var r = (decimal >> 16) & 0xFF;
	    var g = (decimal >> 8) & 0xFF;
	    var b = decimal & 0xFF;
	    return {r: r, g: g, b: b};
	};

	/**
	 * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
	 * CC-BY-SA Tim Down:
	 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
	 * @param {!string} hex Hex representation of the color.
	 * @return {Object} {r: R, g: G, b: B}, 0-255, or null.
	 */
	Color.hexToRgb = function (hex) {
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
	        return r + r + g + g + b + b;
	    });
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	};

	/**
	 * Convert an RGB color object to a hex color.
	 * @param {Object} rgb {r: R, g: G, b: B}, values between 0-255.
	 * @return {!string} Hex representation of the color.
	 */
	Color.rgbToHex = function (rgb) {
	    return Color.decimalToHex(Color.rgbToDecimal(rgb));
	};

	/**
	 * Convert an RGB color object to a Scratch decimal color.
	 * @param {Object} rgb {r: R, g: G, b: B}, values between 0-255.
	 * @return {!number} Number representing the color.
	 */
	Color.rgbToDecimal = function (rgb) {
	    return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
	};

	/**
	* Convert a hex color (e.g., F00, #03F, #0033FF) to a decimal color number.
	* @param {!string} hex Hex representation of the color.
	* @return {!number} Number representing the color.
	*/
	Color.hexToDecimal = function (hex) {
	    return Color.rgbToDecimal(Color.hexToRgb(hex));
	};

	module.exports = Color;


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var MathUtil = __webpack_require__(94);

	var Mouse = function (runtime) {
	    this._x = 0;
	    this._y = 0;
	    this._isDown = false;
	    /**
	     * Reference to the owning Runtime.
	     * Can be used, for example, to activate hats.
	     * @type{!Runtime}
	     */
	    this.runtime = runtime;
	};

	/**
	 * Activate "event_whenthisspriteclicked" hats if needed.
	 * @param  {number} x X position to be sent to the renderer.
	 * @param  {number} y Y position to be sent to the renderer.
	 * @private
	 */
	Mouse.prototype._activateClickHats = function (x, y) {
	    if (this.runtime.renderer) {
	        var drawableID = this.runtime.renderer.pick(x, y);
	        for (var i = 0; i < this.runtime.targets.length; i++) {
	            var target = this.runtime.targets[i];
	            if (target.hasOwnProperty('drawableID') &&
	                target.drawableID === drawableID) {
	                this.runtime.startHats('event_whenthisspriteclicked',
	                    null, target);
	                return;
	            }
	        }
	    }
	};

	/**
	 * Mouse DOM event handler.
	 * @param  {object} data Data from DOM event.
	 */
	Mouse.prototype.postData = function (data) {
	    if (data.x) {
	        this._x = data.x - data.canvasWidth / 2;
	    }
	    if (data.y) {
	        this._y = data.y - data.canvasHeight / 2;
	    }
	    if (typeof data.isDown !== 'undefined') {
	        this._isDown = data.isDown;
	        if (this._isDown) {
	            this._activateClickHats(data.x, data.y);
	        }
	    }
	};

	/**
	 * Get the X position of the mouse.
	 * @return {number} Clamped X position of the mouse cursor.
	 */
	Mouse.prototype.getX = function () {
	    return MathUtil.clamp(this._x, -240, 240);
	};

	/**
	 * Get the Y position of the mouse.
	 * @return {number} Clamped Y position of the mouse cursor.
	 */
	Mouse.prototype.getY = function () {
	    return MathUtil.clamp(-this._y, -180, 180);
	};

	/**
	 * Get the down state of the mouse.
	 * @return {boolean} Is the mouse down?
	 */
	Mouse.prototype.getIsDown = function () {
	    return this._isDown;
	};

	module.exports = Mouse;


/***/ },
/* 94 */
/***/ function(module, exports) {

	var MathUtil = function () {};

	/**
	 * Convert a value from degrees to radians.
	 * @param {!number} deg Value in degrees.
	 * @return {!number} Equivalent value in radians.
	 */
	MathUtil.degToRad = function (deg) {
	    return deg * Math.PI / 180;
	};

	/**
	 * Convert a value from radians to degrees.
	 * @param {!number} rad Value in radians.
	 * @return {!number} Equivalent value in degrees.
	 */
	MathUtil.radToDeg = function (rad) {
	    return rad * 180 / Math.PI;
	};

	/**
	 * Clamp a number between two limits.
	 * If n < min, return min. If n > max, return max. Else, return n.
	 * @param {!number} n Number to clamp.
	 * @param {!number} min Minimum limit.
	 * @param {!number} max Maximum limit.
	 * @return {!number} Value of n clamped to min and max.
	 */
	MathUtil.clamp = function (n, min, max) {
	    return Math.min(Math.max(n, min), max);
	};

	/**
	 * Keep a number between two limits, wrapping "extra" into the range.
	 * e.g., wrapClamp(7, 1, 5) == 2
	 * wrapClamp(0, 1, 5) == 5
	 * wrapClamp(-11, -10, 6) == 6, etc.
	 * @param {!number} n Number to wrap.
	 * @param {!number} min Minimum limit.
	 * @param {!number} max Maximum limit.
	 * @return {!number} Value of n wrapped between min and max.
	 */
	MathUtil.wrapClamp = function (n, min, max) {
	    var range = (max - min) + 1;
	    return n - (Math.floor((n - min) / range) * range);
	};

	module.exports = MathUtil;


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);
	var Timer = __webpack_require__(18);

	var Scratch3ControlBlocks = function (runtime) {
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
	Scratch3ControlBlocks.prototype.getPrimitives = function () {
	    return {
	        control_repeat: this.repeat,
	        control_repeat_until: this.repeatUntil,
	        control_forever: this.forever,
	        control_wait: this.wait,
	        control_wait_until: this.waitUntil,
	        control_if: this.if,
	        control_if_else: this.ifElse,
	        control_stop: this.stop,
	        control_create_clone_of: this.createClone,
	        control_delete_this_clone: this.deleteClone
	    };
	};

	Scratch3ControlBlocks.prototype.getHats = function () {
	    return {
	        control_start_as_clone: {
	            restartExistingThreads: false
	        }
	    };
	};

	Scratch3ControlBlocks.prototype.repeat = function (args, util) {
	    var times = Math.floor(Cast.toNumber(args.TIMES));
	    // Initialize loop
	    if (typeof util.stackFrame.loopCounter === 'undefined') {
	        util.stackFrame.loopCounter = times;
	    }
	    // Only execute once per frame.
	    // When the branch finishes, `repeat` will be executed again and
	    // the second branch will be taken, yielding for the rest of the frame.
	    // Decrease counter
	    util.stackFrame.loopCounter--;
	    // If we still have some left, start the branch.
	    if (util.stackFrame.loopCounter >= 0) {
	        util.startBranch(1, true);
	    }
	};

	Scratch3ControlBlocks.prototype.repeatUntil = function (args, util) {
	    var condition = Cast.toBoolean(args.CONDITION);
	    // If the condition is true, start the branch.
	    if (!condition) {
	        util.startBranch(1, true);
	    }
	};

	Scratch3ControlBlocks.prototype.waitUntil = function (args, util) {
	    var condition = Cast.toBoolean(args.CONDITION);
	    if (!condition) {
	        util.yield();
	    }
	};

	Scratch3ControlBlocks.prototype.forever = function (args, util) {
	    util.startBranch(1, true);
	};

	Scratch3ControlBlocks.prototype.wait = function (args, util) {
	    if (!util.stackFrame.timer) {
	        util.stackFrame.timer = new Timer();
	        util.stackFrame.timer.start();
	        util.yield();
	        this.runtime.requestRedraw();
	    } else {
	        var duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));
	        if (util.stackFrame.timer.timeElapsed() < duration) {
	            util.yield();
	        }
	    }
	};

	Scratch3ControlBlocks.prototype.if = function (args, util) {
	    var condition = Cast.toBoolean(args.CONDITION);
	    if (condition) {
	        util.startBranch(1, false);
	    }
	};

	Scratch3ControlBlocks.prototype.ifElse = function (args, util) {
	    var condition = Cast.toBoolean(args.CONDITION);
	    if (condition) {
	        util.startBranch(1, false);
	    } else {
	        util.startBranch(2, false);
	    }
	};

	Scratch3ControlBlocks.prototype.stop = function (args, util) {
	    var option = args.STOP_OPTION;
	    if (option === 'all') {
	        util.stopAll();
	    } else if (option === 'other scripts in sprite' ||
	        option === 'other scripts in stage') {
	        util.stopOtherTargetThreads();
	    } else if (option === 'this script') {
	        util.stopThread();
	    }
	};

	Scratch3ControlBlocks.prototype.createClone = function (args, util) {
	    var cloneTarget;
	    if (args.CLONE_OPTION === '_myself_') {
	        cloneTarget = util.target;
	    } else {
	        cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
	    }
	    if (!cloneTarget) {
	        return;
	    }
	    var newClone = cloneTarget.makeClone();
	    if (newClone) {
	        this.runtime.targets.push(newClone);
	    }
	};

	Scratch3ControlBlocks.prototype.deleteClone = function (args, util) {
	    if (util.target.isOriginal) return;
	    this.runtime.disposeTarget(util.target);
	    this.runtime.stopForTarget(util.target);
	};

	module.exports = Scratch3ControlBlocks;


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);

	var Scratch3EventBlocks = function (runtime) {
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
	Scratch3EventBlocks.prototype.getPrimitives = function () {
	    return {
	        event_broadcast: this.broadcast,
	        event_broadcastandwait: this.broadcastAndWait,
	        event_whengreaterthan: this.hatGreaterThanPredicate
	    };
	};

	Scratch3EventBlocks.prototype.getHats = function () {
	    return {
	        event_whenflagclicked: {
	            restartExistingThreads: true
	        },
	        event_whenkeypressed: {
	            restartExistingThreads: false
	        },
	        event_whenthisspriteclicked: {
	            restartExistingThreads: true
	        },
	        event_whenbackdropswitchesto: {
	            restartExistingThreads: true
	        },
	        event_whengreaterthan: {
	            restartExistingThreads: false,
	            edgeActivated: true
	        },
	        event_whenbroadcastreceived: {
	            restartExistingThreads: true
	        }
	    };
	};

	Scratch3EventBlocks.prototype.hatGreaterThanPredicate = function (args, util) {
	    var option = Cast.toString(args.WHENGREATERTHANMENU).toLowerCase();
	    var value = Cast.toNumber(args.VALUE);
	    // @todo: Other cases :)
	    if (option === 'timer') {
	        return util.ioQuery('clock', 'projectTimer') > value;
	    }
	    return false;
	};

	Scratch3EventBlocks.prototype.broadcast = function (args, util) {
	    var broadcastOption = Cast.toString(args.BROADCAST_OPTION);
	    util.startHats('event_whenbroadcastreceived', {
	        BROADCAST_OPTION: broadcastOption
	    });
	};

	Scratch3EventBlocks.prototype.broadcastAndWait = function (args, util) {
	    var broadcastOption = Cast.toString(args.BROADCAST_OPTION);
	    // Have we run before, starting threads?
	    if (!util.stackFrame.startedThreads) {
	        // No - start hats for this broadcast.
	        util.stackFrame.startedThreads = util.startHats(
	            'event_whenbroadcastreceived', {
	                BROADCAST_OPTION: broadcastOption
	            }
	        );
	        if (util.stackFrame.startedThreads.length === 0) {
	            // Nothing was started.
	            return;
	        }
	    }
	    // We've run before; check if the wait is still going on.
	    var instance = this;
	    var waiting = util.stackFrame.startedThreads.some(function (thread) {
	        return instance.runtime.isActiveThread(thread);
	    });
	    if (waiting) {
	        util.yield();
	    }
	};

	module.exports = Scratch3EventBlocks;


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);

	var Scratch3LooksBlocks = function (runtime) {
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
	Scratch3LooksBlocks.prototype.getPrimitives = function () {
	    return {
	        looks_say: this.say,
	        looks_sayforsecs: this.sayforsecs,
	        looks_think: this.think,
	        looks_thinkforsecs: this.sayforsecs,
	        looks_show: this.show,
	        looks_hide: this.hide,
	        looks_switchcostumeto: this.switchCostume,
	        looks_switchbackdropto: this.switchBackdrop,
	        looks_switchbackdroptoandwait: this.switchBackdropAndWait,
	        looks_nextcostume: this.nextCostume,
	        looks_nextbackdrop: this.nextBackdrop,
	        looks_changeeffectby: this.changeEffect,
	        looks_seteffectto: this.setEffect,
	        looks_cleargraphiceffects: this.clearEffects,
	        looks_changesizeby: this.changeSize,
	        looks_setsizeto: this.setSize,
	        looks_gotofront: this.goToFront,
	        looks_gobacklayers: this.goBackLayers,
	        looks_size: this.getSize,
	        looks_costumeorder: this.getCostumeIndex,
	        looks_backdroporder: this.getBackdropIndex,
	        looks_backdropname: this.getBackdropName
	    };
	};

	Scratch3LooksBlocks.prototype.say = function (args, util) {
	    util.target.setSay('say', args.MESSAGE);
	};

	Scratch3LooksBlocks.prototype.sayforsecs = function (args, util) {
	    util.target.setSay('say', args.MESSAGE);
	    return new Promise(function (resolve) {
	        setTimeout(function () {
	            // Clear say bubble and proceed.
	            util.target.setSay();
	            resolve();
	        }, 1000 * args.SECS);
	    });
	};

	Scratch3LooksBlocks.prototype.think = function (args, util) {
	    util.target.setSay('think', args.MESSAGE);
	};

	Scratch3LooksBlocks.prototype.thinkforsecs = function (args, util) {
	    util.target.setSay('think', args.MESSAGE);
	    return new Promise(function (resolve) {
	        setTimeout(function () {
	            // Clear say bubble and proceed.
	            util.target.setSay();
	            resolve();
	        }, 1000 * args.SECS);
	    });
	};

	Scratch3LooksBlocks.prototype.show = function (args, util) {
	    util.target.setVisible(true);
	};

	Scratch3LooksBlocks.prototype.hide = function (args, util) {
	    util.target.setVisible(false);
	};

	/**
	 * Utility function to set the costume or backdrop of a target.
	 * Matches the behavior of Scratch 2.0 for different types of arguments.
	 * @param {!Target} target Target to set costume/backdrop to.
	 * @param {Any} requestedCostume Costume requested, e.g., 0, 'name', etc.
	 * @param {boolean=} optZeroIndex Set to zero-index the requestedCostume.
	 * @return {Array.<!Thread>} Any threads started by this switch.
	 */
	Scratch3LooksBlocks.prototype._setCostumeOrBackdrop = function (target,
	        requestedCostume, optZeroIndex) {
	    if (typeof requestedCostume === 'number') {
	        target.setCostume(optZeroIndex ?
	            requestedCostume : requestedCostume - 1);
	    } else {
	        var costumeIndex = target.getCostumeIndexByName(requestedCostume);
	        if (costumeIndex > -1) {
	            target.setCostume(costumeIndex);
	        } else if (requestedCostume === 'previous costume' ||
	                   requestedCostume === 'previous backdrop') {
	            target.setCostume(target.currentCostume - 1);
	        } else if (requestedCostume === 'next costume' ||
	                   requestedCostume === 'next backdrop') {
	            target.setCostume(target.currentCostume + 1);
	        } else {
	            var forcedNumber = Cast.toNumber(requestedCostume);
	            if (!isNaN(forcedNumber)) {
	                target.setCostume(optZeroIndex ?
	                    forcedNumber : forcedNumber - 1);
	            }
	        }
	    }
	    if (target === this.runtime.getTargetForStage()) {
	        // Target is the stage - start hats.
	        var newName = target.sprite.costumes[target.currentCostume].name;
	        return this.runtime.startHats('event_whenbackdropswitchesto', {
	            BACKDROP: newName
	        });
	    }
	    return [];
	};

	Scratch3LooksBlocks.prototype.switchCostume = function (args, util) {
	    this._setCostumeOrBackdrop(util.target, args.COSTUME);
	};

	Scratch3LooksBlocks.prototype.nextCostume = function (args, util) {
	    this._setCostumeOrBackdrop(
	        util.target, util.target.currentCostume + 1, true
	    );
	};

	Scratch3LooksBlocks.prototype.switchBackdrop = function (args) {
	    this._setCostumeOrBackdrop(this.runtime.getTargetForStage(), args.BACKDROP);
	};

	Scratch3LooksBlocks.prototype.switchBackdropAndWait = function (args, util) {
	    // Have we run before, starting threads?
	    if (!util.stackFrame.startedThreads) {
	        // No - switch the backdrop.
	        util.stackFrame.startedThreads = (
	            this._setCostumeOrBackdrop(
	                this.runtime.getTargetForStage(),
	                args.BACKDROP
	            )
	        );
	        if (util.stackFrame.startedThreads.length === 0) {
	            // Nothing was started.
	            return;
	        }
	    }
	    // We've run before; check if the wait is still going on.
	    var instance = this;
	    var waiting = util.stackFrame.startedThreads.some(function (thread) {
	        return instance.runtime.isActiveThread(thread);
	    });
	    if (waiting) {
	        util.yield();
	    }
	};

	Scratch3LooksBlocks.prototype.nextBackdrop = function () {
	    var stage = this.runtime.getTargetForStage();
	    this._setCostumeOrBackdrop(
	        stage, stage.currentCostume + 1, true
	    );
	};

	Scratch3LooksBlocks.prototype.changeEffect = function (args, util) {
	    var effect = Cast.toString(args.EFFECT).toLowerCase();
	    var change = Cast.toNumber(args.CHANGE);
	    if (!util.target.effects.hasOwnProperty(effect)) return;
	    var newValue = change + util.target.effects[effect];
	    util.target.setEffect(effect, newValue);
	};

	Scratch3LooksBlocks.prototype.setEffect = function (args, util) {
	    var effect = Cast.toString(args.EFFECT).toLowerCase();
	    var value = Cast.toNumber(args.VALUE);
	    util.target.setEffect(effect, value);
	};

	Scratch3LooksBlocks.prototype.clearEffects = function (args, util) {
	    util.target.clearEffects();
	};

	Scratch3LooksBlocks.prototype.changeSize = function (args, util) {
	    var change = Cast.toNumber(args.CHANGE);
	    util.target.setSize(util.target.size + change);
	};

	Scratch3LooksBlocks.prototype.setSize = function (args, util) {
	    var size = Cast.toNumber(args.SIZE);
	    util.target.setSize(size);
	};

	Scratch3LooksBlocks.prototype.goToFront = function (args, util) {
	    util.target.goToFront();
	};

	Scratch3LooksBlocks.prototype.goBackLayers = function (args, util) {
	    util.target.goBackLayers(args.NUM);
	};

	Scratch3LooksBlocks.prototype.getSize = function (args, util) {
	    return util.target.size;
	};

	Scratch3LooksBlocks.prototype.getBackdropIndex = function () {
	    var stage = this.runtime.getTargetForStage();
	    return stage.currentCostume + 1;
	};

	Scratch3LooksBlocks.prototype.getBackdropName = function () {
	    var stage = this.runtime.getTargetForStage();
	    return stage.sprite.costumes[stage.currentCostume].name;
	};

	Scratch3LooksBlocks.prototype.getCostumeIndex = function (args, util) {
	    return util.target.currentCostume + 1;
	};

	module.exports = Scratch3LooksBlocks;


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);
	var MathUtil = __webpack_require__(94);
	var Timer = __webpack_require__(18);

	var Scratch3MotionBlocks = function (runtime) {
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
	Scratch3MotionBlocks.prototype.getPrimitives = function () {
	    return {
	        motion_movesteps: this.moveSteps,
	        motion_gotoxy: this.goToXY,
	        motion_goto: this.goTo,
	        motion_turnright: this.turnRight,
	        motion_turnleft: this.turnLeft,
	        motion_pointindirection: this.pointInDirection,
	        motion_pointtowards: this.pointTowards,
	        motion_glidesecstoxy: this.glide,
	        motion_ifonedgebounce: this.ifOnEdgeBounce,
	        motion_setrotationstyle: this.setRotationStyle,
	        motion_changexby: this.changeX,
	        motion_setx: this.setX,
	        motion_changeyby: this.changeY,
	        motion_sety: this.setY,
	        motion_xposition: this.getX,
	        motion_yposition: this.getY,
	        motion_direction: this.getDirection
	    };
	};

	Scratch3MotionBlocks.prototype.moveSteps = function (args, util) {
	    var steps = Cast.toNumber(args.STEPS);
	    var radians = MathUtil.degToRad(90 - util.target.direction);
	    var dx = steps * Math.cos(radians);
	    var dy = steps * Math.sin(radians);
	    util.target.setXY(util.target.x + dx, util.target.y + dy);
	};

	Scratch3MotionBlocks.prototype.goToXY = function (args, util) {
	    var x = Cast.toNumber(args.X);
	    var y = Cast.toNumber(args.Y);
	    util.target.setXY(x, y);
	};

	Scratch3MotionBlocks.prototype.goTo = function (args, util) {
	    var targetX = 0;
	    var targetY = 0;
	    if (args.TO === '_mouse_') {
	        targetX = util.ioQuery('mouse', 'getX');
	        targetY = util.ioQuery('mouse', 'getY');
	    } else if (args.TO === '_random_') {
	        var stageWidth = this.runtime.constructor.STAGE_WIDTH;
	        var stageHeight = this.runtime.constructor.STAGE_HEIGHT;
	        targetX = Math.round(stageWidth * (Math.random() - 0.5));
	        targetY = Math.round(stageHeight * (Math.random() - 0.5));
	    } else {
	        var goToTarget = this.runtime.getSpriteTargetByName(args.TO);
	        if (!goToTarget) return;
	        targetX = goToTarget.x;
	        targetY = goToTarget.y;
	    }
	    util.target.setXY(targetX, targetY);
	};

	Scratch3MotionBlocks.prototype.turnRight = function (args, util) {
	    var degrees = Cast.toNumber(args.DEGREES);
	    util.target.setDirection(util.target.direction + degrees);
	};

	Scratch3MotionBlocks.prototype.turnLeft = function (args, util) {
	    var degrees = Cast.toNumber(args.DEGREES);
	    util.target.setDirection(util.target.direction - degrees);
	};

	Scratch3MotionBlocks.prototype.pointInDirection = function (args, util) {
	    var direction = Cast.toNumber(args.DIRECTION);
	    util.target.setDirection(direction);
	};

	Scratch3MotionBlocks.prototype.pointTowards = function (args, util) {
	    var targetX = 0;
	    var targetY = 0;
	    if (args.TOWARDS === '_mouse_') {
	        targetX = util.ioQuery('mouse', 'getX');
	        targetY = util.ioQuery('mouse', 'getY');
	    } else {
	        var pointTarget = this.runtime.getSpriteTargetByName(args.TOWARDS);
	        if (!pointTarget) return;
	        targetX = pointTarget.x;
	        targetY = pointTarget.y;
	    }

	    var dx = targetX - util.target.x;
	    var dy = targetY - util.target.y;
	    var direction = 90 - MathUtil.radToDeg(Math.atan2(dy, dx));
	    util.target.setDirection(direction);
	};

	Scratch3MotionBlocks.prototype.glide = function (args, util) {
	    if (!util.stackFrame.timer) {
	        // First time: save data for future use.
	        util.stackFrame.timer = new Timer();
	        util.stackFrame.timer.start();
	        util.stackFrame.duration = Cast.toNumber(args.SECS);
	        util.stackFrame.startX = util.target.x;
	        util.stackFrame.startY = util.target.y;
	        util.stackFrame.endX = Cast.toNumber(args.X);
	        util.stackFrame.endY = Cast.toNumber(args.Y);
	        if (util.stackFrame.duration <= 0) {
	            // Duration too short to glide.
	            util.target.setXY(util.stackFrame.endX, util.stackFrame.endY);
	            return;
	        }
	        util.yield();
	    } else {
	        var timeElapsed = util.stackFrame.timer.timeElapsed();
	        if (timeElapsed < util.stackFrame.duration * 1000) {
	            // In progress: move to intermediate position.
	            var frac = timeElapsed / (util.stackFrame.duration * 1000);
	            var dx = frac * (util.stackFrame.endX - util.stackFrame.startX);
	            var dy = frac * (util.stackFrame.endY - util.stackFrame.startY);
	            util.target.setXY(
	                util.stackFrame.startX + dx,
	                util.stackFrame.startY + dy
	            );
	            util.yield();
	        } else {
	            // Finished: move to final position.
	            util.target.setXY(util.stackFrame.endX, util.stackFrame.endY);
	        }
	    }
	};

	Scratch3MotionBlocks.prototype.ifOnEdgeBounce = function (args, util) {
	    var bounds = util.target.getBounds();
	    if (!bounds) {
	        return;
	    }
	    // Measure distance to edges.
	    // Values are positive when the sprite is far away,
	    // and clamped to zero when the sprite is beyond.
	    var stageWidth = this.runtime.constructor.STAGE_WIDTH;
	    var stageHeight = this.runtime.constructor.STAGE_HEIGHT;
	    var distLeft = Math.max(0, (stageWidth / 2) + bounds.left);
	    var distTop = Math.max(0, (stageHeight / 2) - bounds.top);
	    var distRight = Math.max(0, (stageWidth / 2) - bounds.right);
	    var distBottom = Math.max(0, (stageHeight / 2) + bounds.bottom);
	    // Find the nearest edge.
	    var nearestEdge = '';
	    var minDist = Infinity;
	    if (distLeft < minDist) {
	        minDist = distLeft;
	        nearestEdge = 'left';
	    }
	    if (distTop < minDist) {
	        minDist = distTop;
	        nearestEdge = 'top';
	    }
	    if (distRight < minDist) {
	        minDist = distRight;
	        nearestEdge = 'right';
	    }
	    if (distBottom < minDist) {
	        minDist = distBottom;
	        nearestEdge = 'bottom';
	    }
	    if (minDist > 0) {
	        return; // Not touching any edge.
	    }
	    // Point away from the nearest edge.
	    var radians = MathUtil.degToRad(90 - util.target.direction);
	    var dx = Math.cos(radians);
	    var dy = -Math.sin(radians);
	    if (nearestEdge === 'left') {
	        dx = Math.max(0.2, Math.abs(dx));
	    } else if (nearestEdge === 'top') {
	        dy = Math.max(0.2, Math.abs(dy));
	    } else if (nearestEdge === 'right') {
	        dx = 0 - Math.max(0.2, Math.abs(dx));
	    } else if (nearestEdge === 'bottom') {
	        dy = 0 - Math.max(0.2, Math.abs(dy));
	    }
	    var newDirection = MathUtil.radToDeg(Math.atan2(dy, dx)) + 90;
	    util.target.setDirection(newDirection);
	    // Keep within the stage.
	    var fencedPosition = util.target.keepInFence(util.target.x, util.target.y);
	    util.target.setXY(fencedPosition[0], fencedPosition[1]);
	};

	Scratch3MotionBlocks.prototype.setRotationStyle = function (args, util) {
	    util.target.setRotationStyle(args.STYLE);
	};

	Scratch3MotionBlocks.prototype.changeX = function (args, util) {
	    var dx = Cast.toNumber(args.DX);
	    util.target.setXY(util.target.x + dx, util.target.y);
	};

	Scratch3MotionBlocks.prototype.setX = function (args, util) {
	    var x = Cast.toNumber(args.X);
	    util.target.setXY(x, util.target.y);
	};

	Scratch3MotionBlocks.prototype.changeY = function (args, util) {
	    var dy = Cast.toNumber(args.DY);
	    util.target.setXY(util.target.x, util.target.y + dy);
	};

	Scratch3MotionBlocks.prototype.setY = function (args, util) {
	    var y = Cast.toNumber(args.Y);
	    util.target.setXY(util.target.x, y);
	};

	Scratch3MotionBlocks.prototype.getX = function (args, util) {
	    return util.target.x;
	};

	Scratch3MotionBlocks.prototype.getY = function (args, util) {
	    return util.target.y;
	};

	Scratch3MotionBlocks.prototype.getDirection = function (args, util) {
	    return util.target.direction;
	};

	module.exports = Scratch3MotionBlocks;


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);

	var Scratch3OperatorsBlocks = function (runtime) {
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
	Scratch3OperatorsBlocks.prototype.getPrimitives = function () {
	    return {
	        operator_add: this.add,
	        operator_subtract: this.subtract,
	        operator_multiply: this.multiply,
	        operator_divide: this.divide,
	        operator_lt: this.lt,
	        operator_equals: this.equals,
	        operator_gt: this.gt,
	        operator_and: this.and,
	        operator_or: this.or,
	        operator_not: this.not,
	        operator_random: this.random,
	        operator_join: this.join,
	        operator_letter_of: this.letterOf,
	        operator_length: this.length,
	        operator_mod: this.mod,
	        operator_round: this.round,
	        operator_mathop: this.mathop
	    };
	};

	Scratch3OperatorsBlocks.prototype.add = function (args) {
	    return Cast.toNumber(args.NUM1) + Cast.toNumber(args.NUM2);
	};

	Scratch3OperatorsBlocks.prototype.subtract = function (args) {
	    return Cast.toNumber(args.NUM1) - Cast.toNumber(args.NUM2);
	};

	Scratch3OperatorsBlocks.prototype.multiply = function (args) {
	    return Cast.toNumber(args.NUM1) * Cast.toNumber(args.NUM2);
	};

	Scratch3OperatorsBlocks.prototype.divide = function (args) {
	    return Cast.toNumber(args.NUM1) / Cast.toNumber(args.NUM2);
	};

	Scratch3OperatorsBlocks.prototype.lt = function (args) {
	    return Cast.compare(args.OPERAND1, args.OPERAND2) < 0;
	};

	Scratch3OperatorsBlocks.prototype.equals = function (args) {
	    return Cast.compare(args.OPERAND1, args.OPERAND2) === 0;
	};

	Scratch3OperatorsBlocks.prototype.gt = function (args) {
	    return Cast.compare(args.OPERAND1, args.OPERAND2) > 0;
	};

	Scratch3OperatorsBlocks.prototype.and = function (args) {
	    return Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2);
	};

	Scratch3OperatorsBlocks.prototype.or = function (args) {
	    return Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2);
	};

	Scratch3OperatorsBlocks.prototype.not = function (args) {
	    return !Cast.toBoolean(args.OPERAND);
	};

	Scratch3OperatorsBlocks.prototype.random = function (args) {
	    var nFrom = Cast.toNumber(args.FROM);
	    var nTo = Cast.toNumber(args.TO);
	    var low = nFrom <= nTo ? nFrom : nTo;
	    var high = nFrom <= nTo ? nTo : nFrom;
	    if (low === high) return low;
	    // If both arguments are ints, truncate the result to an int.
	    if (Cast.isInt(args.FROM) && Cast.isInt(args.TO)) {
	        return low + parseInt(Math.random() * ((high + 1) - low), 10);
	    }
	    return (Math.random() * (high - low)) + low;
	};

	Scratch3OperatorsBlocks.prototype.join = function (args) {
	    return Cast.toString(args.STRING1) + Cast.toString(args.STRING2);
	};

	Scratch3OperatorsBlocks.prototype.letterOf = function (args) {
	    var index = Cast.toNumber(args.LETTER) - 1;
	    var str = Cast.toString(args.STRING);
	    // Out of bounds?
	    if (index < 0 || index >= str.length) {
	        return '';
	    }
	    return str.charAt(index);
	};

	Scratch3OperatorsBlocks.prototype.length = function (args) {
	    return Cast.toString(args.STRING).length;
	};

	Scratch3OperatorsBlocks.prototype.mod = function (args) {
	    var n = Cast.toNumber(args.NUM1);
	    var modulus = Cast.toNumber(args.NUM2);
	    var result = n % modulus;
	    // Scratch mod is kept positive.
	    if (result / modulus < 0) result += modulus;
	    return result;
	};

	Scratch3OperatorsBlocks.prototype.round = function (args) {
	    return Math.round(Cast.toNumber(args.NUM));
	};

	Scratch3OperatorsBlocks.prototype.mathop = function (args) {
	    var operator = Cast.toString(args.OPERATOR).toLowerCase();
	    var n = Cast.toNumber(args.NUM);
	    switch (operator) {
	    case 'abs': return Math.abs(n);
	    case 'floor': return Math.floor(n);
	    case 'ceiling': return Math.ceil(n);
	    case 'sqrt': return Math.sqrt(n);
	    case 'sin': return Math.sin((Math.PI * n) / 180);
	    case 'cos': return Math.cos((Math.PI * n) / 180);
	    case 'tan': return Math.tan((Math.PI * n) / 180);
	    case 'asin': return (Math.asin(n) * 180) / Math.PI;
	    case 'acos': return (Math.acos(n) * 180) / Math.PI;
	    case 'atan': return (Math.atan(n) * 180) / Math.PI;
	    case 'ln': return Math.log(n);
	    case 'log': return Math.log(n) / Math.LN10;
	    case 'e ^': return Math.exp(n);
	    case '10 ^': return Math.pow(10, n);
	    }
	    return 0;
	};

	module.exports = Scratch3OperatorsBlocks;


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);

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


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var Cast = __webpack_require__(91);

	var Scratch3DataBlocks = function (runtime) {
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
	Scratch3DataBlocks.prototype.getPrimitives = function () {
	    return {
	        data_variable: this.getVariable,
	        data_setvariableto: this.setVariableTo,
	        data_changevariableby: this.changeVariableBy,
	        data_listcontents: this.getListContents,
	        data_addtolist: this.addToList,
	        data_deleteoflist: this.deleteOfList,
	        data_insertatlist: this.insertAtList,
	        data_replaceitemoflist: this.replaceItemOfList,
	        data_itemoflist: this.getItemOfList,
	        data_lengthoflist: this.lengthOfList,
	        data_listcontainsitem: this.listContainsItem
	    };
	};

	Scratch3DataBlocks.prototype.getVariable = function (args, util) {
	    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
	    return variable.value;
	};

	Scratch3DataBlocks.prototype.setVariableTo = function (args, util) {
	    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
	    variable.value = args.VALUE;
	};

	Scratch3DataBlocks.prototype.changeVariableBy = function (args, util) {
	    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
	    var castedValue = Cast.toNumber(variable.value);
	    var dValue = Cast.toNumber(args.VALUE);
	    variable.value = castedValue + dValue;
	};

	Scratch3DataBlocks.prototype.getListContents = function (args, util) {
	    var list = util.target.lookupOrCreateList(args.LIST);
	    // Determine if the list is all single letters.
	    // If it is, report contents joined together with no separator.
	    // If it's not, report contents joined together with a space.
	    var allSingleLetters = true;
	    for (var i = 0; i < list.contents.length; i++) {
	        var listItem = list.contents[i];
	        if (!((typeof listItem === 'string') &&
	              (listItem.length === 1))) {
	            allSingleLetters = false;
	            break;
	        }
	    }
	    if (allSingleLetters) {
	        return list.contents.join('');
	    } else {
	        return list.contents.join(' ');
	    }
	};

	Scratch3DataBlocks.prototype.addToList = function (args, util) {
	    var list = util.target.lookupOrCreateList(args.LIST);
	    list.contents.push(args.ITEM);
	};

	Scratch3DataBlocks.prototype.deleteOfList = function (args, util) {
	    var list = util.target.lookupOrCreateList(args.LIST);
	    var index = Cast.toListIndex(args.INDEX, list.contents.length);
	    if (index === Cast.LIST_INVALID) {
	        return;
	    } else if (index === Cast.LIST_ALL) {
	        list.contents = [];
	        return;
	    }
	    list.contents.splice(index - 1, 1);
	};

	Scratch3DataBlocks.prototype.insertAtList = function (args, util) {
	    var item = args.ITEM;
	    var list = util.target.lookupOrCreateList(args.LIST);
	    var index = Cast.toListIndex(args.INDEX, list.contents.length + 1);
	    if (index === Cast.LIST_INVALID) {
	        return;
	    }
	    list.contents.splice(index - 1, 0, item);
	};

	Scratch3DataBlocks.prototype.replaceItemOfList = function (args, util) {
	    var item = args.ITEM;
	    var list = util.target.lookupOrCreateList(args.LIST);
	    var index = Cast.toListIndex(args.INDEX, list.contents.length);
	    if (index === Cast.LIST_INVALID) {
	        return;
	    }
	    list.contents.splice(index - 1, 1, item);
	};

	Scratch3DataBlocks.prototype.getItemOfList = function (args, util) {
	    var list = util.target.lookupOrCreateList(args.LIST);
	    var index = Cast.toListIndex(args.INDEX, list.contents.length);
	    if (index === Cast.LIST_INVALID) {
	        return '';
	    }
	    return list.contents[index - 1];
	};

	Scratch3DataBlocks.prototype.lengthOfList = function (args, util) {
	    var list = util.target.lookupOrCreateList(args.LIST);
	    return list.contents.length;
	};

	Scratch3DataBlocks.prototype.listContainsItem = function (args, util) {
	    var item = args.ITEM;
	    var list = util.target.lookupOrCreateList(args.LIST);
	    if (list.contents.indexOf(item) >= 0) {
	        return true;
	    }
	    // Try using Scratch comparison operator on each item.
	    // (Scratch considers the string '123' equal to the number 123).
	    for (var i = 0; i < list.contents.length; i++) {
	        if (Cast.compare(list.contents[i], item) === 0) {
	            return true;
	        }
	    }
	    return false;
	};

	module.exports = Scratch3DataBlocks;


/***/ },
/* 102 */
/***/ function(module, exports) {

	var Scratch3ProcedureBlocks = function (runtime) {
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
	Scratch3ProcedureBlocks.prototype.getPrimitives = function () {
	    return {
	        procedures_defnoreturn: this.defNoReturn,
	        procedures_callnoreturn: this.callNoReturn,
	        procedures_param: this.param
	    };
	};

	Scratch3ProcedureBlocks.prototype.defNoReturn = function () {
	    // No-op: execute the blocks.
	};

	Scratch3ProcedureBlocks.prototype.callNoReturn = function (args, util) {
	    if (!util.stackFrame.executed) {
	        var procedureCode = args.mutation.proccode;
	        var paramNames = util.getProcedureParamNames(procedureCode);
	        for (var i = 0; i < paramNames.length; i++) {
	            if (args.hasOwnProperty('input' + i)) {
	                util.pushParam(paramNames[i], args['input' + i]);
	            }
	        }
	        util.stackFrame.executed = true;
	        util.startProcedure(procedureCode);
	    }
	};

	Scratch3ProcedureBlocks.prototype.param = function (args, util) {
	    var value = util.getParam(args.mutation.paramname);
	    return value;
	};

	module.exports = Scratch3ProcedureBlocks;


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview
	 * Partial implementation of an SB2 JSON importer.
	 * Parses provided JSON and then generates all needed
	 * scratch-vm runtime structures.
	 */

	var Blocks = __webpack_require__(34);
	var RenderedTarget = __webpack_require__(104);
	var Sprite = __webpack_require__(109);
	var Color = __webpack_require__(92);
	var log = __webpack_require__(21);
	var uid = __webpack_require__(108);
	var specMap = __webpack_require__(110);
	var Variable = __webpack_require__(106);
	var List = __webpack_require__(107);

	/**
	 * Parse a single "Scratch object" and create all its in-memory VM objects.
	 * @param {!Object} object From-JSON "Scratch object:" sprite, stage, watcher.
	 * @param {!Runtime} runtime Runtime object to load all structures into.
	 * @param {boolean} topLevel Whether this is the top-level object (stage).
	 * @return {?Target} Target created (stage or sprite).
	 */
	var parseScratchObject = function (object, runtime, topLevel) {
	    if (!object.hasOwnProperty('objName')) {
	        // Watcher/monitor - skip this object until those are implemented in VM.
	        // @todo
	        return;
	    }
	    // Blocks container for this object.
	    var blocks = new Blocks();
	    // @todo: For now, load all Scratch objects (stage/sprites) as a Sprite.
	    var sprite = new Sprite(blocks, runtime);
	    // Sprite/stage name from JSON.
	    if (object.hasOwnProperty('objName')) {
	        sprite.name = object.objName;
	    }
	    // Costumes from JSON.
	    if (object.hasOwnProperty('costumes')) {
	        for (var i = 0; i < object.costumes.length; i++) {
	            var costume = object.costumes[i];
	            // @todo: Make sure all the relevant metadata is being pulled out.
	            sprite.costumes.push({
	                skin: 'https://cdn.assets.scratch.mit.edu/internalapi/asset/' +
	                    costume.baseLayerMD5 + '/get/',
	                name: costume.costumeName,
	                bitmapResolution: costume.bitmapResolution,
	                rotationCenterX: costume.rotationCenterX,
	                rotationCenterY: costume.rotationCenterY
	            });
	        }
	    }
	    // If included, parse any and all scripts/blocks on the object.
	    if (object.hasOwnProperty('scripts')) {
	        parseScripts(object.scripts, blocks);
	    }
	    // Create the first clone, and load its run-state from JSON.
	    var target = sprite.createClone();
	    // Add it to the runtime's list of targets.
	    runtime.targets.push(target);
	    // Load target properties from JSON.
	    if (object.hasOwnProperty('variables')) {
	        for (var j = 0; j < object.variables.length; j++) {
	            var variable = object.variables[j];
	            target.variables[variable.name] = new Variable(
	                variable.name,
	                variable.value,
	                variable.isPersistent
	            );
	        }
	    }
	    if (object.hasOwnProperty('lists')) {
	        for (var k = 0; k < object.lists.length; k++) {
	            var list = object.lists[k];
	            // @todo: monitor properties.
	            target.lists[list.listName] = new List(
	                list.listName,
	                list.contents
	            );
	        }
	    }
	    if (object.hasOwnProperty('scratchX')) {
	        target.x = object.scratchX;
	    }
	    if (object.hasOwnProperty('scratchY')) {
	        target.y = object.scratchY;
	    }
	    if (object.hasOwnProperty('direction')) {
	        target.direction = object.direction;
	    }
	    if (object.hasOwnProperty('scale')) {
	        // SB2 stores as 1.0 = 100%; we use % in the VM.
	        target.size = object.scale * 100;
	    }
	    if (object.hasOwnProperty('visible')) {
	        target.visible = object.visible;
	    }
	    if (object.hasOwnProperty('currentCostumeIndex')) {
	        target.currentCostume = Math.round(object.currentCostumeIndex);
	    }
	    if (object.hasOwnProperty('rotationStyle')) {
	        if (object.rotationStyle === 'none') {
	            target.rotationStyle = RenderedTarget.ROTATION_STYLE_NONE;
	        } else if (object.rotationStyle === 'leftRight') {
	            target.rotationStyle = RenderedTarget.ROTATION_STYLE_LEFT_RIGHT;
	        } else if (object.rotationStyle === 'normal') {
	            target.rotationStyle = RenderedTarget.ROTATION_STYLE_ALL_AROUND;
	        }
	    }
	    target.isStage = topLevel;
	    target.updateAllDrawableProperties();
	    // The stage will have child objects; recursively process them.
	    if (object.children) {
	        for (var m = 0; m < object.children.length; m++) {
	            parseScratchObject(object.children[m], runtime, false);
	        }
	    }
	    return target;
	};

	/**
	 * Top-level handler. Parse provided JSON,
	 * and process the top-level object (the stage object).
	 * @param {!string} json SB2-format JSON to load.
	 * @param {!Runtime} runtime Runtime object to load all structures into.
	 * @param {Boolean=} optForceSprite If set, treat as sprite (Sprite2).
	 * @return {?Target} Top-level target created (stage or sprite).
	 */
	var sb2import = function (json, runtime, optForceSprite) {
	    return parseScratchObject(
	        JSON.parse(json),
	        runtime,
	        !optForceSprite
	    );
	};

	/**
	 * Parse a Scratch object's scripts into VM blocks.
	 * This should only handle top-level scripts that include X, Y coordinates.
	 * @param {!Object} scripts Scripts object from SB2 JSON.
	 * @param {!Blocks} blocks Blocks object to load parsed blocks into.
	 */
	var parseScripts = function (scripts, blocks) {
	    for (var i = 0; i < scripts.length; i++) {
	        var script = scripts[i];
	        var scriptX = script[0];
	        var scriptY = script[1];
	        var blockList = script[2];
	        var parsedBlockList = parseBlockList(blockList);
	        if (parsedBlockList[0]) {
	            // Adjust script coordinates to account for
	            // larger block size in scratch-blocks.
	            // @todo: Determine more precisely the right formulas here.
	            parsedBlockList[0].x = scriptX * 1.1;
	            parsedBlockList[0].y = scriptY * 1.1;
	            parsedBlockList[0].topLevel = true;
	            parsedBlockList[0].parent = null;
	        }
	        // Flatten children and create add the blocks.
	        var convertedBlocks = flatten(parsedBlockList);
	        for (var j = 0; j < convertedBlocks.length; j++) {
	            blocks.createBlock(convertedBlocks[j]);
	        }
	    }
	};

	/**
	 * Parse any list of blocks from SB2 JSON into a list of VM-format blocks.
	 * Could be used to parse a top-level script,
	 * a list of blocks in a branch (e.g., in forever),
	 * or a list of blocks in an argument (e.g., move [pick random...]).
	 * @param {Array.<Object>} blockList SB2 JSON-format block list.
	 * @return {Array.<Object>} Scratch VM-format block list.
	 */
	var parseBlockList = function (blockList) {
	    var resultingList = [];
	    var previousBlock = null; // For setting next.
	    for (var i = 0; i < blockList.length; i++) {
	        var block = blockList[i];
	        var parsedBlock = parseBlock(block);
	        if (previousBlock) {
	            parsedBlock.parent = previousBlock.id;
	            previousBlock.next = parsedBlock.id;
	        }
	        previousBlock = parsedBlock;
	        resultingList.push(parsedBlock);
	    }
	    return resultingList;
	};

	/**
	 * Flatten a block tree into a block list.
	 * Children are temporarily stored on the `block.children` property.
	 * @param {Array.<Object>} blocks list generated by `parseBlockList`.
	 * @return {Array.<Object>} Flattened list to be passed to `blocks.createBlock`.
	 */
	var flatten = function (blocks) {
	    var finalBlocks = [];
	    for (var i = 0; i < blocks.length; i++) {
	        var block = blocks[i];
	        finalBlocks.push(block);
	        if (block.children) {
	            finalBlocks = finalBlocks.concat(flatten(block.children));
	        }
	        delete block.children;
	    }
	    return finalBlocks;
	};

	/**
	 * Convert a Scratch 2.0 procedure string (e.g., "my_procedure %s %b %n")
	 * into an argument map. This allows us to provide the expected inputs
	 * to a mutated procedure call.
	 * @param {string} procCode Scratch 2.0 procedure string.
	 * @return {Object} Argument map compatible with those in sb2specmap.
	 */
	var parseProcedureArgMap = function (procCode) {
	    var argMap = [
	        {} // First item in list is op string.
	    ];
	    var INPUT_PREFIX = 'input';
	    var inputCount = 0;
	    // Split by %n, %b, %s.
	    var parts = procCode.split(/(?=[^\\]%[nbs])/);
	    for (var i = 0; i < parts.length; i++) {
	        var part = parts[i].trim();
	        if (part.substring(0, 1) === '%') {
	            var argType = part.substring(1, 2);
	            var arg = {
	                type: 'input',
	                inputName: INPUT_PREFIX + (inputCount++)
	            };
	            if (argType === 'n') {
	                arg.inputOp = 'math_number';
	            } else if (argType === 's') {
	                arg.inputOp = 'text';
	            }
	            argMap.push(arg);
	        }
	    }
	    return argMap;
	};

	/**
	 * Parse a single SB2 JSON-formatted block and its children.
	 * @param {!Object} sb2block SB2 JSON-formatted block.
	 * @return {Object} Scratch VM format block.
	 */
	var parseBlock = function (sb2block) {
	    // First item in block object is the old opcode (e.g., 'forward:').
	    var oldOpcode = sb2block[0];
	    // Convert the block using the specMap. See sb2specmap.js.
	    if (!oldOpcode || !specMap[oldOpcode]) {
	        log.warn('Couldn\'t find SB2 block: ', oldOpcode);
	        return;
	    }
	    var blockMetadata = specMap[oldOpcode];
	    // Block skeleton.
	    var activeBlock = {
	        id: uid(), // Generate a new block unique ID.
	        opcode: blockMetadata.opcode, // Converted, e.g. "motion_movesteps".
	        inputs: {}, // Inputs to this block and the blocks they point to.
	        fields: {}, // Fields on this block and their values.
	        next: null, // Next block.
	        shadow: false, // No shadow blocks in an SB2 by default.
	        children: [] // Store any generated children, flattened in `flatten`.
	    };
	    // For a procedure call, generate argument map from proc string.
	    if (oldOpcode === 'call') {
	        blockMetadata.argMap = parseProcedureArgMap(sb2block[1]);
	    }
	    // Look at the expected arguments in `blockMetadata.argMap.`
	    // The basic problem here is to turn positional SB2 arguments into
	    // non-positional named Scratch VM arguments.
	    for (var i = 0; i < blockMetadata.argMap.length; i++) {
	        var expectedArg = blockMetadata.argMap[i];
	        var providedArg = sb2block[i + 1]; // (i = 0 is opcode)
	        // Whether the input is obscuring a shadow.
	        var shadowObscured = false;
	        // Positional argument is an input.
	        if (expectedArg.type === 'input') {
	            // Create a new block and input metadata.
	            var inputUid = uid();
	            activeBlock.inputs[expectedArg.inputName] = {
	                name: expectedArg.inputName,
	                block: null,
	                shadow: null
	            };
	            if (typeof providedArg === 'object' && providedArg) {
	                // Block or block list occupies the input.
	                var innerBlocks;
	                if (typeof providedArg[0] === 'object' && providedArg[0]) {
	                    // Block list occupies the input.
	                    innerBlocks = parseBlockList(providedArg);
	                } else {
	                    // Single block occupies the input.
	                    innerBlocks = [parseBlock(providedArg)];
	                }
	                var previousBlock = null;
	                for (var j = 0; j < innerBlocks.length; j++) {
	                    if (j === 0) {
	                        innerBlocks[j].parent = activeBlock.id;
	                    } else {
	                        innerBlocks[j].parent = previousBlock;
	                    }
	                    previousBlock = innerBlocks[j].id;
	                }
	                // Obscures any shadow.
	                shadowObscured = true;
	                activeBlock.inputs[expectedArg.inputName].block = (
	                    innerBlocks[0].id
	                );
	                activeBlock.children = (
	                    activeBlock.children.concat(innerBlocks)
	                );
	            }
	            // Generate a shadow block to occupy the input.
	            if (!expectedArg.inputOp) {
	                // No editable shadow input; e.g., for a boolean.
	                continue;
	            }
	            // Each shadow has a field generated for it automatically.
	            // Value to be filled in the field.
	            var fieldValue = providedArg;
	            // Shadows' field names match the input name, except for these:
	            var fieldName = expectedArg.inputName;
	            if (expectedArg.inputOp === 'math_number' ||
	                expectedArg.inputOp === 'math_whole_number' ||
	                expectedArg.inputOp === 'math_positive_number' ||
	                expectedArg.inputOp === 'math_integer' ||
	                expectedArg.inputOp === 'math_angle') {
	                fieldName = 'NUM';
	                // Fields are given Scratch 2.0 default values if obscured.
	                if (shadowObscured) {
	                    fieldValue = 10;
	                }
	            } else if (expectedArg.inputOp === 'text') {
	                fieldName = 'TEXT';
	                if (shadowObscured) {
	                    fieldValue = '';
	                }
	            } else if (expectedArg.inputOp === 'colour_picker') {
	                // Convert SB2 color to hex.
	                fieldValue = Color.decimalToHex(providedArg);
	                fieldName = 'COLOUR';
	                if (shadowObscured) {
	                    fieldValue = '#990000';
	                }
	            } else if (shadowObscured) {
	                // Filled drop-down menu.
	                fieldValue = '';
	            }
	            var fields = {};
	            fields[fieldName] = {
	                name: fieldName,
	                value: fieldValue
	            };
	            activeBlock.children.push({
	                id: inputUid,
	                opcode: expectedArg.inputOp,
	                inputs: {},
	                fields: fields,
	                next: null,
	                topLevel: false,
	                parent: activeBlock.id,
	                shadow: true
	            });
	            activeBlock.inputs[expectedArg.inputName].shadow = inputUid;
	            // If no block occupying the input, alias to the shadow.
	            if (!activeBlock.inputs[expectedArg.inputName].block) {
	                activeBlock.inputs[expectedArg.inputName].block = inputUid;
	            }
	        } else if (expectedArg.type === 'field') {
	            // Add as a field on this block.
	            activeBlock.fields[expectedArg.fieldName] = {
	                name: expectedArg.fieldName,
	                value: providedArg
	            };
	        }
	    }
	    // Special cases to generate mutations.
	    if (oldOpcode === 'stopScripts') {
	        // Mutation for stop block: if the argument is 'other scripts',
	        // the block needs a next connection.
	        if (sb2block[1] === 'other scripts in sprite' ||
	            sb2block[1] === 'other scripts in stage') {
	            activeBlock.mutation = {
	                tagName: 'mutation',
	                hasnext: 'true',
	                children: []
	            };
	        }
	    } else if (oldOpcode === 'procDef') {
	        // Mutation for procedure definition:
	        // store all 2.0 proc data.
	        var procData = sb2block.slice(1);
	        activeBlock.mutation = {
	            tagName: 'mutation',
	            proccode: procData[0], // e.g., "abc %n %b %s"
	            argumentnames: JSON.stringify(procData[1]), // e.g. ['arg1', 'arg2']
	            argumentdefaults: JSON.stringify(procData[2]), // e.g., [1, 'abc']
	            warp: procData[3], // Warp mode, e.g., true/false.
	            children: []
	        };
	    } else if (oldOpcode === 'call') {
	        // Mutation for procedure call:
	        // string for proc code (e.g., "abc %n %b %s").
	        activeBlock.mutation = {
	            tagName: 'mutation',
	            children: [],
	            proccode: sb2block[1]
	        };
	    } else if (oldOpcode === 'getParam') {
	        // Mutation for procedure parameter.
	        activeBlock.mutation = {
	            tagName: 'mutation',
	            children: [],
	            paramname: sb2block[1], // Name of parameter.
	            shape: sb2block[2] // Shape - in 2.0, 'r' or 'b'.
	        };
	    }
	    return activeBlock;
	};

	module.exports = sb2import;


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(12);

	var log = __webpack_require__(21);
	var MathUtil = __webpack_require__(94);
	var Target = __webpack_require__(105);

	/**
	 * Rendered target: instance of a sprite (clone), or the stage.
	 * @param {!Sprite} sprite Reference to the parent sprite.
	 * @param {Runtime} runtime Reference to the runtime.
	 * @constructor
	 */
	var RenderedTarget = function (sprite, runtime) {
	    Target.call(this, sprite.blocks);
	    this.runtime = runtime;
	    /**
	     * Reference to the sprite that this is a render of.
	     * @type {!Sprite}
	     */
	    this.sprite = sprite;
	    /**
	     * Reference to the global renderer for this VM, if one exists.
	     * @type {?RenderWebGLWorker}
	     */
	    this.renderer = null;
	    if (this.runtime) {
	        this.renderer = this.runtime.renderer;
	    }
	    /**
	     * ID of the drawable for this rendered target,
	     * returned by the renderer, if rendered.
	     * @type {?Number}
	     */
	    this.drawableID = null;

	    /**
	     * Map of current graphic effect values.
	     * @type {!Object.<string, number>}
	     */
	    this.effects = {
	        color: 0,
	        fisheye: 0,
	        whirl: 0,
	        pixelate: 0,
	        mosaic: 0,
	        brightness: 0,
	        ghost: 0
	    };
	};
	util.inherits(RenderedTarget, Target);

	/**
	 * Create a drawable with the this.renderer.
	 */
	RenderedTarget.prototype.initDrawable = function () {
	    if (this.renderer) {
	        this.drawableID = this.renderer.createDrawable();
	    }
	    // If we're a clone, start the hats.
	    if (!this.isOriginal) {
	        this.runtime.startHats(
	            'control_start_as_clone', null, this
	        );
	    }
	};

	/**
	 * Whether this represents an "original" non-clone rendered-target for a sprite,
	 * i.e., created by the editor and not clone blocks.
	 * @type {boolean}
	 */
	RenderedTarget.prototype.isOriginal = true;

	/**
	 * Whether this rendered target represents the Scratch stage.
	 * @type {boolean}
	 */
	RenderedTarget.prototype.isStage = false;

	/**
	 * Scratch X coordinate. Currently should range from -240 to 240.
	 * @type {Number}
	 */
	RenderedTarget.prototype.x = 0;

	/**
	 * Scratch Y coordinate. Currently should range from -180 to 180.
	 * @type {number}
	 */
	RenderedTarget.prototype.y = 0;

	/**
	 * Scratch direction. Currently should range from -179 to 180.
	 * @type {number}
	 */
	RenderedTarget.prototype.direction = 90;

	/**
	 * Whether the rendered target is currently visible.
	 * @type {boolean}
	 */
	RenderedTarget.prototype.visible = true;

	/**
	 * Size of rendered target as a percent of costume size.
	 * @type {number}
	 */
	RenderedTarget.prototype.size = 100;

	/**
	 * Currently selected costume index.
	 * @type {number}
	 */
	RenderedTarget.prototype.currentCostume = 0;

	/**
	 * Rotation style for "all around"/spinning.
	 * @enum
	 */
	RenderedTarget.ROTATION_STYLE_ALL_AROUND = 'all around';

	/**
	 * Rotation style for "left-right"/flipping.
	 * @enum
	 */
	RenderedTarget.ROTATION_STYLE_LEFT_RIGHT = 'left-right';

	/**
	 * Rotation style for "no rotation."
	 * @enum
	 */
	RenderedTarget.ROTATION_STYLE_NONE = 'don\'t rotate';

	/**
	 * Current rotation style.
	 * @type {!string}
	 */
	RenderedTarget.prototype.rotationStyle = (
	    RenderedTarget.ROTATION_STYLE_ALL_AROUND
	);

	/**
	 * Set the X and Y coordinates.
	 * @param {!number} x New X coordinate, in Scratch coordinates.
	 * @param {!number} y New Y coordinate, in Scratch coordinates.
	 */
	RenderedTarget.prototype.setXY = function (x, y) {
	    if (this.isStage) {
	        return;
	    }
	    this.x = x;
	    this.y = y;
	    if (this.renderer) {
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            position: [this.x, this.y]
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	    this.runtime.spriteInfoReport(this);
	};

	/**
	 * Get the rendered direction and scale, after applying rotation style.
	 * @return {Object<string, number>} Direction and scale to render.
	 */
	RenderedTarget.prototype._getRenderedDirectionAndScale = function () {
	    // Default: no changes to `this.direction` or `this.scale`.
	    var finalDirection = this.direction;
	    var finalScale = [this.size, this.size];
	    if (this.rotationStyle === RenderedTarget.ROTATION_STYLE_NONE) {
	        // Force rendered direction to be 90.
	        finalDirection = 90;
	    } else if (this.rotationStyle === RenderedTarget.ROTATION_STYLE_LEFT_RIGHT) {
	        // Force rendered direction to be 90, and flip drawable if needed.
	        finalDirection = 90;
	        var scaleFlip = (this.direction < 0) ? -1 : 1;
	        finalScale = [scaleFlip * this.size, this.size];
	    }
	    return {direction: finalDirection, scale: finalScale};
	};

	/**
	 * Set the direction.
	 * @param {!number} direction New direction.
	 */
	RenderedTarget.prototype.setDirection = function (direction) {
	    if (this.isStage) {
	        return;
	    }
	    // Keep direction between -179 and +180.
	    this.direction = MathUtil.wrapClamp(direction, -179, 180);
	    if (this.renderer) {
	        var renderedDirectionScale = this._getRenderedDirectionAndScale();
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            direction: renderedDirectionScale.direction,
	            scale: renderedDirectionScale.scale
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	    this.runtime.spriteInfoReport(this);
	};

	/**
	 * Set a say bubble.
	 * @param {?string} type Type of say bubble: "say", "think", or null.
	 * @param {?string} message Message to put in say bubble.
	 */
	RenderedTarget.prototype.setSay = function (type, message) {
	    if (this.isStage) {
	        return;
	    }
	    // @todo: Render to stage.
	    if (!type || !message) {
	        log.info('Clearing say bubble');
	        return;
	    }
	    log.info('Setting say bubble:', type, message);
	};

	/**
	 * Set visibility; i.e., whether it's shown or hidden.
	 * @param {!boolean} visible True if should be shown.
	 */
	RenderedTarget.prototype.setVisible = function (visible) {
	    if (this.isStage) {
	        return;
	    }
	    this.visible = !!visible;
	    if (this.renderer) {
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            visible: this.visible
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	    this.runtime.spriteInfoReport(this);
	};

	/**
	 * Set size, as a percentage of the costume size.
	 * @param {!number} size Size of rendered target, as % of costume size.
	 */
	RenderedTarget.prototype.setSize = function (size) {
	    if (this.isStage) {
	        return;
	    }
	    // Keep size between 5% and 535%.
	    this.size = MathUtil.clamp(size, 5, 535);
	    if (this.renderer) {
	        var renderedDirectionScale = this._getRenderedDirectionAndScale();
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            direction: renderedDirectionScale.direction,
	            scale: renderedDirectionScale.scale
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	};

	/**
	 * Set a particular graphic effect value.
	 * @param {!string} effectName Name of effect (see `RenderedTarget.prototype.effects`).
	 * @param {!number} value Numerical magnitude of effect.
	 */
	RenderedTarget.prototype.setEffect = function (effectName, value) {
	    if (!this.effects.hasOwnProperty(effectName)) return;
	    this.effects[effectName] = value;
	    if (this.renderer) {
	        var props = {};
	        props[effectName] = this.effects[effectName];
	        this.renderer.updateDrawableProperties(this.drawableID, props);
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	};

	/**
	 * Clear all graphic effects on this rendered target.
	 */
	RenderedTarget.prototype.clearEffects = function () {
	    for (var effectName in this.effects) {
	        this.effects[effectName] = 0;
	    }
	    if (this.renderer) {
	        this.renderer.updateDrawableProperties(this.drawableID, this.effects);
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	};

	/**
	 * Set the current costume.
	 * @param {number} index New index of costume.
	 */
	RenderedTarget.prototype.setCostume = function (index) {
	    // Keep the costume index within possible values.
	    index = Math.round(index);
	    this.currentCostume = MathUtil.wrapClamp(
	        index, 0, this.sprite.costumes.length - 1
	    );
	    if (this.renderer) {
	        var costume = this.sprite.costumes[this.currentCostume];
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            skin: costume.skin,
	            costumeResolution: costume.bitmapResolution,
	            rotationCenter: [
	                costume.rotationCenterX / costume.bitmapResolution,
	                costume.rotationCenterY / costume.bitmapResolution
	            ]
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	};

	/**
	 * Update the rotation style.
	 * @param {!string} rotationStyle New rotation style.
	 */
	RenderedTarget.prototype.setRotationStyle = function (rotationStyle) {
	    if (rotationStyle === RenderedTarget.ROTATION_STYLE_NONE) {
	        this.rotationStyle = RenderedTarget.ROTATION_STYLE_NONE;
	    } else if (rotationStyle === RenderedTarget.ROTATION_STYLE_ALL_AROUND) {
	        this.rotationStyle = RenderedTarget.ROTATION_STYLE_ALL_AROUND;
	    } else if (rotationStyle === RenderedTarget.ROTATION_STYLE_LEFT_RIGHT) {
	        this.rotationStyle = RenderedTarget.ROTATION_STYLE_LEFT_RIGHT;
	    }
	    if (this.renderer) {
	        var renderedDirectionScale = this._getRenderedDirectionAndScale();
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            direction: renderedDirectionScale.direction,
	            scale: renderedDirectionScale.scale
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	    this.runtime.spriteInfoReport(this);
	};

	/**
	 * Get a costume index of this rendered target, by name of the costume.
	 * @param {?string} costumeName Name of a costume.
	 * @return {number} Index of the named costume, or -1 if not present.
	 */
	RenderedTarget.prototype.getCostumeIndexByName = function (costumeName) {
	    for (var i = 0; i < this.sprite.costumes.length; i++) {
	        if (this.sprite.costumes[i].name === costumeName) {
	            return i;
	        }
	    }
	    return -1;
	};

	/**
	 * Update all drawable properties for this rendered target.
	 * Use when a batch has changed, e.g., when the drawable is first created.
	 */
	RenderedTarget.prototype.updateAllDrawableProperties = function () {
	    if (this.renderer) {
	        var renderedDirectionScale = this._getRenderedDirectionAndScale();
	        var costume = this.sprite.costumes[this.currentCostume];
	        this.renderer.updateDrawableProperties(this.drawableID, {
	            position: [this.x, this.y],
	            direction: renderedDirectionScale.direction,
	            scale: renderedDirectionScale.scale,
	            visible: this.visible,
	            skin: costume.skin,
	            costumeResolution: costume.bitmapResolution,
	            rotationCenter: [
	                costume.rotationCenterX / costume.bitmapResolution,
	                costume.rotationCenterY / costume.bitmapResolution
	            ]
	        });
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	    this.runtime.spriteInfoReport(this);
	};

	/**
	 * Return the human-readable name for this rendered target, e.g., the sprite's name.
	 * @override
	 * @returns {string} Human-readable name.
	 */
	RenderedTarget.prototype.getName = function () {
	    return this.sprite.name;
	};

	/**
	 * Return whether this rendered target is a sprite (not a clone, not the stage).
	 * @return {boolean} True if not a clone and not the stage.
	 */
	RenderedTarget.prototype.isSprite = function () {
	    return !this.isStage && this.isOriginal;
	};

	/**
	 * Return the rendered target's tight bounding box.
	 * Includes top, left, bottom, right attributes in Scratch coordinates.
	 * @return {?Object} Tight bounding box, or null.
	 */
	RenderedTarget.prototype.getBounds = function () {
	    if (this.renderer) {
	        return this.runtime.renderer.getBounds(this.drawableID);
	    }
	    return null;
	};

	/**
	 * Return whether touching a point.
	 * @param {number} x X coordinate of test point.
	 * @param {number} y Y coordinate of test point.
	 * @return {Boolean} True iff the rendered target is touching the point.
	 */
	RenderedTarget.prototype.isTouchingPoint = function (x, y) {
	    if (this.renderer) {
	        // @todo: Update once pick is in Scratch coordinates.
	        // Limits test to this Drawable, so this will return true
	        // even if the clone is obscured by another Drawable.
	        var pickResult = this.runtime.renderer.pick(
	            x + (this.runtime.constructor.STAGE_WIDTH / 2),
	            -y + (this.runtime.constructor.STAGE_HEIGHT / 2),
	            null, null,
	            [this.drawableID]
	        );
	        return pickResult === this.drawableID;
	    }
	    return false;
	};

	/**
	 * Return whether touching a stage edge.
	 * @return {Boolean} True iff the rendered target is touching the stage edge.
	 */
	RenderedTarget.prototype.isTouchingEdge = function () {
	    if (this.renderer) {
	        var stageWidth = this.runtime.constructor.STAGE_WIDTH;
	        var stageHeight = this.runtime.constructor.STAGE_HEIGHT;
	        var bounds = this.getBounds();
	        if (bounds.left < -stageWidth / 2 ||
	            bounds.right > stageWidth / 2 ||
	            bounds.top > stageHeight / 2 ||
	            bounds.bottom < -stageHeight / 2) {
	            return true;
	        }
	    }
	    return false;
	};

	/**
	 * Return whether touching any of a named sprite's clones.
	 * @param {string} spriteName Name of the sprite.
	 * @return {Boolean} True iff touching a clone of the sprite.
	 */
	RenderedTarget.prototype.isTouchingSprite = function (spriteName) {
	    var firstClone = this.runtime.getSpriteTargetByName(spriteName);
	    if (!firstClone || !this.renderer) {
	        return false;
	    }
	    var drawableCandidates = firstClone.sprite.clones.map(function (clone) {
	        return clone.drawableID;
	    });
	    return this.renderer.isTouchingDrawables(
	        this.drawableID, drawableCandidates);
	};

	/**
	 * Return whether touching a color.
	 * @param {Array.<number>} rgb [r,g,b], values between 0-255.
	 * @return {Promise.<Boolean>} True iff the rendered target is touching the color.
	 */
	RenderedTarget.prototype.isTouchingColor = function (rgb) {
	    if (this.renderer) {
	        return this.renderer.isTouchingColor(this.drawableID, rgb);
	    }
	    return false;
	};

	/**
	 * Return whether rendered target's color is touching a color.
	 * @param {Object} targetRgb {Array.<number>} [r,g,b], values between 0-255.
	 * @param {Object} maskRgb {Array.<number>} [r,g,b], values between 0-255.
	 * @return {Promise.<Boolean>} True iff the color is touching the color.
	 */
	RenderedTarget.prototype.colorIsTouchingColor = function (targetRgb, maskRgb) {
	    if (this.renderer) {
	        return this.renderer.isTouchingColor(
	            this.drawableID,
	            targetRgb,
	            maskRgb
	        );
	    }
	    return false;
	};

	/**
	 * Move to the front layer.
	 */
	RenderedTarget.prototype.goToFront = function () {
	    if (this.renderer) {
	        this.renderer.setDrawableOrder(this.drawableID, Infinity);
	    }
	};

	/**
	 * Move back a number of layers.
	 * @param {number} nLayers How many layers to go back.
	 */
	RenderedTarget.prototype.goBackLayers = function (nLayers) {
	    if (this.renderer) {
	        this.renderer.setDrawableOrder(this.drawableID, -nLayers, true, 1);
	    }
	};

	/**
	 * Move behind some other rendered target.
	 * @param {!Clone} other Other rendered target to move behind.
	 */
	RenderedTarget.prototype.goBehindOther = function (other) {
	    if (this.renderer) {
	        var otherLayer = this.renderer.setDrawableOrder(
	            other.drawableID, 0, true);
	        this.renderer.setDrawableOrder(this.drawableID, otherLayer);
	    }
	};

	/**
	 * Keep a desired position within a fence.
	 * @param {number} newX New desired X position.
	 * @param {number} newY New desired Y position.
	 * @param {Object=} optFence Optional fence with left, right, top bottom.
	 * @return {Array.<number>} Fenced X and Y coordinates.
	 */
	RenderedTarget.prototype.keepInFence = function (newX, newY, optFence) {
	    var fence = optFence;
	    if (!fence) {
	        fence = {
	            left: -this.runtime.constructor.STAGE_WIDTH / 2,
	            right: this.runtime.constructor.STAGE_WIDTH / 2,
	            top: this.runtime.constructor.STAGE_HEIGHT / 2,
	            bottom: -this.runtime.constructor.STAGE_HEIGHT / 2
	        };
	    }
	    var bounds = this.getBounds();
	    if (!bounds) return;
	    // Adjust the known bounds to the target position.
	    bounds.left += (newX - this.x);
	    bounds.right += (newX - this.x);
	    bounds.top += (newY - this.y);
	    bounds.bottom += (newY - this.y);
	    // Find how far we need to move the target position.
	    var dx = 0;
	    var dy = 0;
	    if (bounds.left < fence.left) {
	        dx += fence.left - bounds.left;
	    }
	    if (bounds.right > fence.right) {
	        dx += fence.right - bounds.right;
	    }
	    if (bounds.top > fence.top) {
	        dy += fence.top - bounds.top;
	    }
	    if (bounds.bottom < fence.bottom) {
	        dy += fence.bottom - bounds.bottom;
	    }
	    return [newX + dx, newY + dy];
	};

	/**
	 * Make a clone, copying any run-time properties.
	 * If we've hit the global clone limit, returns null.
	 * @return {!RenderedTarget} New clone.
	 */
	RenderedTarget.prototype.makeClone = function () {
	    if (!this.runtime.clonesAvailable() || this.isStage) {
	        return; // Hit max clone limit, or this is the stage.
	    }
	    this.runtime.changeCloneCounter(1);
	    var newClone = this.sprite.createClone();
	    // Copy all properties.
	    newClone.x = this.x;
	    newClone.y = this.y;
	    newClone.direction = this.direction;
	    newClone.visible = this.visible;
	    newClone.size = this.size;
	    newClone.currentCostume = this.currentCostume;
	    newClone.rotationStyle = this.rotationStyle;
	    newClone.effects = JSON.parse(JSON.stringify(this.effects));
	    newClone.variables = JSON.parse(JSON.stringify(this.variables));
	    newClone.lists = JSON.parse(JSON.stringify(this.lists));
	    newClone.initDrawable();
	    newClone.updateAllDrawableProperties();
	    // Place behind the current target.
	    newClone.goBehindOther(this);
	    return newClone;
	};

	/**
	 * Called when the project receives a "green flag."
	 * For a rendered target, this clears graphic effects.
	 */
	RenderedTarget.prototype.onGreenFlag = function () {
	    this.clearEffects();
	};

	/**
	 * Post/edit sprite info.
	 * @param {object} data An object with sprite info data to set.
	 */
	RenderedTarget.prototype.postSpriteInfo = function (data) {
	    if (data.hasOwnProperty('x')) {
	        this.setXY(data.x, this.y);
	    }
	    if (data.hasOwnProperty('y')) {
	        this.setXY(this.x, data.y);
	    }
	    if (data.hasOwnProperty('direction')) {
	        this.setDirection(data.direction);
	    }
	    if (data.hasOwnProperty('rotationStyle')) {
	        this.setRotationStyle(data.rotationStyle);
	    }
	    if (data.hasOwnProperty('visible')) {
	        this.setVisible(data.visible);
	    }
	};

	/**
	 * Dispose, destroying any run-time properties.
	 */
	RenderedTarget.prototype.dispose = function () {
	    this.runtime.changeCloneCounter(-1);
	    if (this.renderer && this.drawableID !== null) {
	        this.renderer.destroyDrawable(this.drawableID);
	        if (this.visible) {
	            this.runtime.requestRedraw();
	        }
	    }
	};

	module.exports = RenderedTarget;


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var Blocks = __webpack_require__(34);
	var Variable = __webpack_require__(106);
	var List = __webpack_require__(107);
	var uid = __webpack_require__(108);

	/**
	 * @fileoverview
	 * A Target is an abstract "code-running" object for the Scratch VM.
	 * Examples include sprites/clones or potentially physical-world devices.
	 */

	/**
	 * @param {?Blocks} blocks Blocks instance for the blocks owned by this target.
	 * @constructor
	 */
	var Target = function (blocks) {
	    if (!blocks) {
	        blocks = new Blocks(this);
	    }
	    /**
	     * A unique ID for this target.
	     * @type {string}
	     */
	    this.id = uid();
	    /**
	     * Blocks run as code for this target.
	     * @type {!Blocks}
	     */
	    this.blocks = blocks;
	    /**
	     * Dictionary of variables and their values for this target.
	     * Key is the variable name.
	     * @type {Object.<string,*>}
	     */
	    this.variables = {};
	    /**
	     * Dictionary of lists and their contents for this target.
	     * Key is the list name.
	     * @type {Object.<string,*>}
	     */
	    this.lists = {};
	};

	/**
	 * Called when the project receives a "green flag."
	 * @abstract
	 */
	Target.prototype.onGreenFlag = function () {};

	/**
	 * Return a human-readable name for this target.
	 * Target implementations should override this.
	 * @abstract
	 * @returns {string} Human-readable name for the target.
	 */
	Target.prototype.getName = function () {
	    return this.id;
	};

	/**
	 * Look up a variable object, and create it if one doesn't exist.
	 * Search begins for local variables; then look for globals.
	 * @param {!string} name Name of the variable.
	 * @return {!Variable} Variable object.
	 */
	Target.prototype.lookupOrCreateVariable = function (name) {
	    // If we have a local copy, return it.
	    if (this.variables.hasOwnProperty(name)) {
	        return this.variables[name];
	    }
	    // If the stage has a global copy, return it.
	    if (this.runtime && !this.isStage) {
	        var stage = this.runtime.getTargetForStage();
	        if (stage.variables.hasOwnProperty(name)) {
	            return stage.variables[name];
	        }
	    }
	    // No variable with this name exists - create it locally.
	    var newVariable = new Variable(name, 0, false);
	    this.variables[name] = newVariable;
	    return newVariable;
	};

	/**
	* Look up a list object for this target, and create it if one doesn't exist.
	* Search begins for local lists; then look for globals.
	* @param {!string} name Name of the list.
	* @return {!List} List object.
	 */
	Target.prototype.lookupOrCreateList = function (name) {
	    // If we have a local copy, return it.
	    if (this.lists.hasOwnProperty(name)) {
	        return this.lists[name];
	    }
	    // If the stage has a global copy, return it.
	    if (this.runtime && !this.isStage) {
	        var stage = this.runtime.getTargetForStage();
	        if (stage.lists.hasOwnProperty(name)) {
	            return stage.lists[name];
	        }
	    }
	    // No list with this name exists - create it locally.
	    var newList = new List(name, []);
	    this.lists[name] = newList;
	    return newList;
	};

	/**
	 * Post/edit sprite info.
	 * @param {object} data An object with sprite info data to set.
	 * @abstract
	 */
	Target.prototype.postSpriteInfo = function () {};

	/**
	 * Call to destroy a target.
	 * @abstract
	 */
	Target.prototype.dispose = function () {};

	module.exports = Target;


/***/ },
/* 106 */
/***/ function(module, exports) {

	/**
	 * @fileoverview
	 * Object representing a Scratch variable.
	 */

	/**
	 * @param {!string} name Name of the variable.
	 * @param {(string|Number)} value Value of the variable.
	 * @param {boolean} isCloud Whether the variable is stored in the cloud.
	 * @constructor
	 */
	var Variable = function (name, value, isCloud) {
	    this.name = name;
	    this.value = value;
	    this.isCloud = isCloud;
	};

	module.exports = Variable;


/***/ },
/* 107 */
/***/ function(module, exports) {

	/**
	 * @fileoverview
	 * Object representing a Scratch list.
	 */

	 /**
	  * @param {!string} name Name of the list.
	  * @param {Array} contents Contents of the list, as an array.
	  * @constructor
	  */
	var List = function (name, contents) {
	    this.name = name;
	    this.contents = contents;
	};

	module.exports = List;


/***/ },
/* 108 */
/***/ function(module, exports) {

	/**
	 * @fileoverview UID generator, from Blockly.
	 */

	/**
	 * Legal characters for the unique ID.
	 * Should be all on a US keyboard.  No XML special characters or control codes.
	 * Removed $ due to issue 251.
	 * @private
	 */
	var soup_ = '!#%()*+,-./:;=?@[]^_`{|}~' +
	    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	/**
	 * Generate a unique ID, from Blockly.  This should be globally unique.
	 * 87 characters ^ 20 length > 128 bits (better than a UUID).
	 * @return {string} A globally unique ID string.
	 */
	var uid = function () {
	    var length = 20;
	    var soupLength = soup_.length;
	    var id = [];
	    for (var i = 0; i < length; i++) {
	        id[i] = soup_.charAt(Math.random() * soupLength);
	    }
	    return id.join('');
	};

	module.exports = uid;


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var RenderedTarget = __webpack_require__(104);
	var Blocks = __webpack_require__(34);

	/**
	 * Sprite to be used on the Scratch stage.
	 * All clones of a sprite have shared blocks, shared costumes, shared variables.
	 * @param {?Blocks} blocks Shared blocks object for all clones of sprite.
	 * @param {Runtime} runtime Reference to the runtime.
	 * @constructor
	 */
	var Sprite = function (blocks, runtime) {
	    this.runtime = runtime;
	    if (!blocks) {
	        // Shared set of blocks for all clones.
	        blocks = new Blocks();
	    }
	    this.blocks = blocks;
	    /**
	     * Human-readable name for this sprite (and all clones).
	     * @type {string}
	     */
	    this.name = '';
	    /**
	     * List of costumes for this sprite.
	     * Each entry is an object, e.g.,
	     * {
	     *      skin: "costume.svg",
	     *      name: "Costume Name",
	     *      bitmapResolution: 2,
	     *      rotationCenterX: 0,
	     *      rotationCenterY: 0
	     * }
	     * @type {Array.<!Object>}
	     */
	    this.costumes = [];
	    /**
	     * List of clones for this sprite, including the original.
	     * @type {Array.<!RenderedTarget>}
	     */
	    this.clones = [];
	};

	/**
	 * Create a clone of this sprite.
	 * @returns {!Clone} Newly created clone.
	 */
	Sprite.prototype.createClone = function () {
	    var newClone = new RenderedTarget(this, this.runtime);
	    newClone.isOriginal = this.clones.length === 0;
	    this.clones.push(newClone);
	    if (newClone.isOriginal) {
	        newClone.initDrawable();
	    }
	    return newClone;
	};

	module.exports = Sprite;


/***/ },
/* 110 */
/***/ function(module, exports) {

	/**
	 * @fileoverview
	 * The specMap below handles a few pieces of "translation" work between
	 * the SB2 JSON format and the data we need to run a project
	 * in the Scratch 3.0 VM.
	 * Notably:
	 *  - Map 2.0 and 1.4 opcodes (forward:) into 3.0-format (motion_movesteps).
	 *  - Map ordered, unnamed args to unordered, named inputs and fields.
	 * Keep this up-to-date as 3.0 blocks are renamed, changed, etc.
	 * Originally this was generated largely by a hand-guided scripting process.
	 * The relevant data lives here:
	 * https://github.com/LLK/scratch-flash/blob/master/src/Specs.as
	 * (for the old opcode and argument order).
	 * and here:
	 * https://github.com/LLK/scratch-blocks/tree/develop/blocks_vertical
	 * (for the new opcodes and argument names).
	 * and here:
	 * https://github.com/LLK/scratch-blocks/blob/develop/tests/
	 * (for the shadow blocks created for each block).
	 * I started with the `commands` array in Specs.as, and discarded irrelevant
	 * properties. By hand, I matched the opcode name to the 3.0 opcode.
	 * Finally, I filled in the expected arguments as below.
	 */
	var specMap = {
	    'forward:': {
	        opcode: 'motion_movesteps',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'STEPS'
	            }
	        ]
	    },
	    'turnRight:': {
	        opcode: 'motion_turnright',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'DEGREES'
	            }
	        ]
	    },
	    'turnLeft:': {
	        opcode: 'motion_turnleft',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'DEGREES'
	            }
	        ]
	    },
	    'heading:': {
	        opcode: 'motion_pointindirection',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_angle',
	                inputName: 'DIRECTION'
	            }
	        ]
	    },
	    'pointTowards:': {
	        opcode: 'motion_pointtowards',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'motion_pointtowards_menu',
	                inputName: 'TOWARDS'
	            }
	        ]
	    },
	    'gotoX:y:': {
	        opcode: 'motion_gotoxy',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'X'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'Y'
	            }
	        ]
	    },
	    'gotoSpriteOrMouse:': {
	        opcode: 'motion_goto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'motion_goto_menu',
	                inputName: 'TO'
	            }
	        ]
	    },
	    'glideSecs:toX:y:elapsed:from:': {
	        opcode: 'motion_glidesecstoxy',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SECS'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'X'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'Y'
	            }
	        ]
	    },
	    'changeXposBy:': {
	        opcode: 'motion_changexby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'DX'
	            }
	        ]
	    },
	    'xpos:': {
	        opcode: 'motion_setx',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'X'
	            }
	        ]
	    },
	    'changeYposBy:': {
	        opcode: 'motion_changeyby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'DY'
	            }
	        ]
	    },
	    'ypos:': {
	        opcode: 'motion_sety',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'Y'
	            }
	        ]
	    },
	    'bounceOffEdge': {
	        opcode: 'motion_ifonedgebounce',
	        argMap: [
	        ]
	    },
	    'setRotationStyle': {
	        opcode: 'motion_setrotationstyle',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'motion_setrotationstyle_menu',
	                inputName: 'STYLE'
	            }
	        ]
	    },
	    'xpos': {
	        opcode: 'motion_xposition',
	        argMap: [
	        ]
	    },
	    'ypos': {
	        opcode: 'motion_yposition',
	        argMap: [
	        ]
	    },
	    'heading': {
	        opcode: 'motion_direction',
	        argMap: [
	        ]
	    },
	    'say:duration:elapsed:from:': {
	        opcode: 'looks_sayforsecs',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'MESSAGE'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SECS'
	            }
	        ]
	    },
	    'say:': {
	        opcode: 'looks_say',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'MESSAGE'
	            }
	        ]
	    },
	    'think:duration:elapsed:from:': {
	        opcode: 'looks_thinkforsecs',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'MESSAGE'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SECS'
	            }
	        ]
	    },
	    'think:': {
	        opcode: 'looks_think',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'MESSAGE'
	            }
	        ]
	    },
	    'show': {
	        opcode: 'looks_show',
	        argMap: [
	        ]
	    },
	    'hide': {
	        opcode: 'looks_hide',
	        argMap: [
	        ]
	    },
	    'lookLike:': {
	        opcode: 'looks_switchcostumeto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'looks_costume',
	                inputName: 'COSTUME'
	            }
	        ]
	    },
	    'nextCostume': {
	        opcode: 'looks_nextcostume',
	        argMap: [
	        ]
	    },
	    'startScene': {
	        opcode: 'looks_switchbackdropto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'looks_backdrops',
	                inputName: 'BACKDROP'
	            }
	        ]
	    },
	    'changeGraphicEffect:by:': {
	        opcode: 'looks_changeeffectby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'looks_effectmenu',
	                inputName: 'EFFECT'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'CHANGE'
	            }
	        ]
	    },
	    'setGraphicEffect:to:': {
	        opcode: 'looks_seteffectto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'looks_effectmenu',
	                inputName: 'EFFECT'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'VALUE'
	            }
	        ]
	    },
	    'filterReset': {
	        opcode: 'looks_cleargraphiceffects',
	        argMap: [
	        ]
	    },
	    'changeSizeBy:': {
	        opcode: 'looks_changesizeby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'CHANGE'
	            }
	        ]
	    },
	    'setSizeTo:': {
	        opcode: 'looks_setsizeto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SIZE'
	            }
	        ]
	    },
	    'comeToFront': {
	        opcode: 'looks_gotofront',
	        argMap: [
	        ]
	    },
	    'goBackByLayers:': {
	        opcode: 'looks_gobacklayers',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_integer',
	                inputName: 'NUM'
	            }
	        ]
	    },
	    'costumeIndex': {
	        opcode: 'looks_costumeorder',
	        argMap: [
	        ]
	    },
	    'sceneName': {
	        opcode: 'looks_backdropname',
	        argMap: [
	        ]
	    },
	    'scale': {
	        opcode: 'looks_size',
	        argMap: [
	        ]
	    },
	    'startSceneAndWait': {
	        opcode: 'looks_switchbackdroptoandwait',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'looks_backdrops',
	                inputName: 'BACKDROP'
	            }
	        ]
	    },
	    'nextScene': {
	        opcode: 'looks_nextbackdrop',
	        argMap: [
	        ]
	    },
	    'backgroundIndex': {
	        opcode: 'looks_backdroporder',
	        argMap: [
	        ]
	    },
	    'playSound:': {
	        opcode: 'sound_play',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sound_sounds_option',
	                inputName: 'SOUND_MENU'
	            }
	        ]
	    },
	    'doPlaySoundAndWait': {
	        opcode: 'sound_playuntildone',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sound_sounds_option',
	                inputName: 'SOUND_MENU'
	            }
	        ]
	    },
	    'stopAllSounds': {
	        opcode: 'sound_stopallsounds',
	        argMap: [
	        ]
	    },
	    'playDrum': {
	        opcode: 'sound_playdrumforbeats',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'DRUMTYPE'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'BEATS'
	            }
	        ]
	    },
	    'rest:elapsed:from:': {
	        opcode: 'sound_restforbeats',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'BEATS'
	            }
	        ]
	    },
	    'noteOn:duration:elapsed:from:': {
	        opcode: 'sound_playnoteforbeats',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NOTE'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'BEATS'
	            }
	        ]
	    },
	    'instrument:': {
	        opcode: 'sound_setinstrumentto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'INSTRUMENT'
	            }
	        ]
	    },
	    'changeVolumeBy:': {
	        opcode: 'sound_changevolumeby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'VOLUME'
	            }
	        ]
	    },
	    'setVolumeTo:': {
	        opcode: 'sound_setvolumeto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'VOLUME'
	            }
	        ]
	    },
	    'volume': {
	        opcode: 'sound_volume',
	        argMap: [
	        ]
	    },
	    'changeTempoBy:': {
	        opcode: 'sound_changetempoby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'TEMPO'
	            }
	        ]
	    },
	    'setTempoTo:': {
	        opcode: 'sound_settempotobpm',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'TEMPO'
	            }
	        ]
	    },
	    'tempo': {
	        opcode: 'sound_tempo',
	        argMap: [
	        ]
	    },
	    'clearPenTrails': {
	        opcode: 'pen_clear',
	        argMap: [
	        ]
	    },
	    'stampCostume': {
	        opcode: 'pen_stamp',
	        argMap: [
	        ]
	    },
	    'putPenDown': {
	        opcode: 'pen_pendown',
	        argMap: [
	        ]
	    },
	    'putPenUp': {
	        opcode: 'pen_penup',
	        argMap: [
	        ]
	    },
	    'penColor:': {
	        opcode: 'pen_setpencolortocolor',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'colour_picker',
	                inputName: 'COLOR'
	            }
	        ]
	    },
	    'changePenHueBy:': {
	        opcode: 'pen_changepencolorby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'COLOR'
	            }
	        ]
	    },
	    'setPenHueTo:': {
	        opcode: 'pen_setpencolortonum',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'COLOR'
	            }
	        ]
	    },
	    'changePenShadeBy:': {
	        opcode: 'pen_changepenshadeby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SHADE'
	            }
	        ]
	    },
	    'setPenShadeTo:': {
	        opcode: 'pen_changepenshadeby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SHADE'
	            }
	        ]
	    },
	    'changePenSizeBy:': {
	        opcode: 'pen_changepensizeby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SIZE'
	            }
	        ]
	    },
	    'penSize:': {
	        opcode: 'pen_setpensizeto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'SIZE'
	            }
	        ]
	    },
	    'whenGreenFlag': {
	        opcode: 'event_whenflagclicked',
	        argMap: [
	        ]
	    },
	    'whenKeyPressed': {
	        opcode: 'event_whenkeypressed',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'KEY_OPTION'
	            }
	        ]
	    },
	    'whenClicked': {
	        opcode: 'event_whenthisspriteclicked',
	        argMap: [
	        ]
	    },
	    'whenSceneStarts': {
	        opcode: 'event_whenbackdropswitchesto',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'BACKDROP'
	            }
	        ]
	    },
	    'whenSensorGreaterThan': {
	        opcode: 'event_whengreaterthan',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'WHENGREATERTHANMENU'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'VALUE'
	            }
	        ]
	    },
	    'whenIReceive': {
	        opcode: 'event_whenbroadcastreceived',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'BROADCAST_OPTION'
	            }
	        ]
	    },
	    'broadcast:': {
	        opcode: 'event_broadcast',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'event_broadcast_menu',
	                inputName: 'BROADCAST_OPTION'
	            }
	        ]
	    },
	    'doBroadcastAndWait': {
	        opcode: 'event_broadcastandwait',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'event_broadcast_menu',
	                inputName: 'BROADCAST_OPTION'
	            }
	        ]
	    },
	    'wait:elapsed:from:': {
	        opcode: 'control_wait',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_positive_number',
	                inputName: 'DURATION'
	            }
	        ]
	    },
	    'doRepeat': {
	        opcode: 'control_repeat',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_whole_number',
	                inputName: 'TIMES'
	            },
	            {
	                type: 'input',
	                inputName: 'SUBSTACK'
	            }
	        ]
	    },
	    'doForever': {
	        opcode: 'control_forever',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'SUBSTACK'
	            }
	        ]
	    },
	    'doIf': {
	        opcode: 'control_if',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'CONDITION'
	            },
	            {
	                type: 'input',
	                inputName: 'SUBSTACK'
	            }
	        ]
	    },
	    'doIfElse': {
	        opcode: 'control_if_else',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'CONDITION'
	            },
	            {
	                type: 'input',
	                inputName: 'SUBSTACK'
	            },
	            {
	                type: 'input',
	                inputName: 'SUBSTACK2'
	            }
	        ]
	    },
	    'doWaitUntil': {
	        opcode: 'control_wait_until',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'CONDITION'
	            }
	        ]
	    },
	    'doUntil': {
	        opcode: 'control_repeat_until',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'CONDITION'
	            },
	            {
	                type: 'input',
	                inputName: 'SUBSTACK'
	            }
	        ]
	    },
	    'stopScripts': {
	        opcode: 'control_stop',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'STOP_OPTION'
	            }
	        ]
	    },
	    'whenCloned': {
	        opcode: 'control_start_as_clone',
	        argMap: [
	        ]
	    },
	    'createCloneOf': {
	        opcode: 'control_create_clone_of',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'control_create_clone_of_menu',
	                inputName: 'CLONE_OPTION'
	            }
	        ]
	    },
	    'deleteClone': {
	        opcode: 'control_delete_this_clone',
	        argMap: [
	        ]
	    },
	    'touching:': {
	        opcode: 'sensing_touchingobject',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_touchingobjectmenu',
	                inputName: 'TOUCHINGOBJECTMENU'
	            }
	        ]
	    },
	    'touchingColor:': {
	        opcode: 'sensing_touchingcolor',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'colour_picker',
	                inputName: 'COLOR'
	            }
	        ]
	    },
	    'color:sees:': {
	        opcode: 'sensing_coloristouchingcolor',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'colour_picker',
	                inputName: 'COLOR'
	            },
	            {
	                type: 'input',
	                inputOp: 'colour_picker',
	                inputName: 'COLOR2'
	            }
	        ]
	    },
	    'distanceTo:': {
	        opcode: 'sensing_distanceto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_distancetomenu',
	                inputName: 'DISTANCETOMENU'
	            }
	        ]
	    },
	    'doAsk': {
	        opcode: 'sensing_askandwait',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'QUESTION'
	            }
	        ]
	    },
	    'answer': {
	        opcode: 'sensing_answer',
	        argMap: [
	        ]
	    },
	    'keyPressed:': {
	        opcode: 'sensing_keypressed',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_keyoptions',
	                inputName: 'KEY_OPTION'
	            }
	        ]
	    },
	    'mousePressed': {
	        opcode: 'sensing_mousedown',
	        argMap: [
	        ]
	    },
	    'mouseX': {
	        opcode: 'sensing_mousex',
	        argMap: [
	        ]
	    },
	    'mouseY': {
	        opcode: 'sensing_mousey',
	        argMap: [
	        ]
	    },
	    'soundLevel': {
	        opcode: 'sensing_loudness',
	        argMap: [
	        ]
	    },
	    'senseVideoMotion': {
	        opcode: 'sensing_videoon',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_videoonmenuone',
	                inputName: 'VIDEOONMENU1'
	            },
	            {
	                type: 'input',
	                inputOp: 'sensing_videoonmenutwo',
	                inputName: 'VIDEOONMENU2'
	            }
	        ]
	    },
	    'setVideoState': {
	        opcode: 'sensing_videotoggle',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_videotogglemenu',
	                inputName: 'VIDEOTOGGLEMENU'
	            }
	        ]
	    },
	    'setVideoTransparency': {
	        opcode: 'sensing_setvideotransparency',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'TRANSPARENCY'
	            }
	        ]
	    },
	    'timer': {
	        opcode: 'sensing_timer',
	        argMap: [
	        ]
	    },
	    'timerReset': {
	        opcode: 'sensing_resettimer',
	        argMap: [
	        ]
	    },
	    'getAttribute:of:': {
	        opcode: 'sensing_of',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_of_property_menu',
	                inputName: 'PROPERTY'
	            },
	            {
	                type: 'input',
	                inputOp: 'sensing_of_object_menu',
	                inputName: 'OBJECT'
	            }
	        ]
	    },
	    'timeAndDate': {
	        opcode: 'sensing_current',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'sensing_currentmenu',
	                inputName: 'CURRENTMENU'
	            }
	        ]
	    },
	    'timestamp': {
	        opcode: 'sensing_dayssince2000',
	        argMap: [
	        ]
	    },
	    'getUserName': {
	        opcode: 'sensing_username',
	        argMap: [
	        ]
	    },
	    '+': {
	        opcode: 'operator_add',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM1'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM2'
	            }
	        ]
	    },
	    '-': {
	        opcode: 'operator_subtract',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM1'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM2'
	            }
	        ]
	    },
	    '*': {
	        opcode: 'operator_multiply',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM1'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM2'
	            }
	        ]
	    },
	    '/': {
	        opcode: 'operator_divide',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM1'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM2'
	            }
	        ]
	    },
	    'randomFrom:to:': {
	        opcode: 'operator_random',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'FROM'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'TO'
	            }
	        ]
	    },
	    '<': {
	        opcode: 'operator_lt',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'OPERAND1'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'OPERAND2'
	            }
	        ]
	    },
	    '=': {
	        opcode: 'operator_equals',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'OPERAND1'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'OPERAND2'
	            }
	        ]
	    },
	    '>': {
	        opcode: 'operator_gt',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'OPERAND1'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'OPERAND2'
	            }
	        ]
	    },
	    '&': {
	        opcode: 'operator_and',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'OPERAND1'
	            },
	            {
	                type: 'input',
	                inputName: 'OPERAND2'
	            }
	        ]
	    },
	    '|': {
	        opcode: 'operator_or',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'OPERAND1'
	            },
	            {
	                type: 'input',
	                inputName: 'OPERAND2'
	            }
	        ]
	    },
	    'not': {
	        opcode: 'operator_not',
	        argMap: [
	            {
	                type: 'input',
	                inputName: 'OPERAND'
	            }
	        ]
	    },
	    'concatenate:with:': {
	        opcode: 'operator_join',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'STRING1'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'STRING2'
	            }
	        ]
	    },
	    'letter:of:': {
	        opcode: 'operator_letter_of',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_whole_number',
	                inputName: 'LETTER'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'STRING'
	            }
	        ]
	    },
	    'stringLength:': {
	        opcode: 'operator_length',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'STRING'
	            }
	        ]
	    },
	    '%': {
	        opcode: 'operator_mod',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM1'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM2'
	            }
	        ]
	    },
	    'rounded': {
	        opcode: 'operator_round',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM'
	            }
	        ]
	    },
	    'computeFunction:of:': {
	        opcode: 'operator_mathop',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'operator_mathop_menu',
	                inputName: 'OPERATOR'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'NUM'
	            }
	        ]
	    },
	    'readVariable': {
	        opcode: 'data_variable',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'data_variablemenu',
	                inputName: 'VARIABLE'
	            }
	        ]
	    },
	    'setVar:to:': {
	        opcode: 'data_setvariableto',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'data_variablemenu',
	                inputName: 'VARIABLE'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'VALUE'
	            }
	        ]
	    },
	    'changeVar:by:': {
	        opcode: 'data_changevariableby',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'data_variablemenu',
	                inputName: 'VARIABLE'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_number',
	                inputName: 'VALUE'
	            }
	        ]
	    },
	    'showVariable:': {
	        opcode: 'data_showvariable',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'data_variablemenu',
	                inputName: 'VARIABLE'
	            }
	        ]
	    },
	    'hideVariable:': {
	        opcode: 'data_hidevariable',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'data_variablemenu',
	                inputName: 'VARIABLE'
	            }
	        ]
	    },
	    'contentsOfList:': {
	        opcode: 'data_list',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'append:toList:': {
	        opcode: 'data_addtolist',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'ITEM'
	            },
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'deleteLine:ofList:': {
	        opcode: 'data_deleteoflist',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_integer',
	                inputName: 'INDEX'
	            },
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'insert:at:ofList:': {
	        opcode: 'data_insertatlist',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'ITEM'
	            },
	            {
	                type: 'input',
	                inputOp: 'math_integer',
	                inputName: 'INDEX'
	            },
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'setLine:ofList:to:': {
	        opcode: 'data_replaceitemoflist',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_integer',
	                inputName: 'INDEX'
	            },
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'ITEM'
	            }
	        ]
	    },
	    'getLine:ofList:': {
	        opcode: 'data_itemoflist',
	        argMap: [
	            {
	                type: 'input',
	                inputOp: 'math_integer',
	                inputName: 'INDEX'
	            },
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'lineCountOfList:': {
	        opcode: 'data_lengthoflist',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'list:contains:': {
	        opcode: 'data_listcontainsitem',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            },
	            {
	                type: 'input',
	                inputOp: 'text',
	                inputName: 'ITEM'
	            }
	        ]
	    },
	    'showList:': {
	        opcode: 'data_showlist',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'hideList:': {
	        opcode: 'data_hidelist',
	        argMap: [
	            {
	                type: 'field',
	                fieldName: 'LIST'
	            }
	        ]
	    },
	    'procDef': {
	        opcode: 'procedures_defnoreturn',
	        argMap: []
	    },
	    'getParam': {
	        opcode: 'procedures_param',
	        argMap: []
	    },
	    'call': {
	        opcode: 'procedures_callnoreturn',
	        argMap: []
	    }
	};
	module.exports = specMap;


/***/ }
/******/ ]);