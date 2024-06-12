(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["scratch-vm"] = factory();
	else
		root["scratch-vm"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/playground/benchmark.js":
/*!*************************************!*\
  !*** ./src/playground/benchmark.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// Track loading time with timestamps and if possible the performance api.
if (window.performance) {
  // Mark with the performance API when benchmark.js and its dependecies start
  // evaluation. This can tell us once measured how long the code spends time
  // turning into execution code for the first time. Skipping evaluation of
  // some of the code can help us make it faster.
  performance.mark('Scratch.EvalStart');
}
class LoadingMiddleware {
  constructor() {
    this.middleware = [];
    this.host = null;
    this.original = null;
  }
  install(host, original) {
    this.host = host;
    this.original = original;
    const {
      middleware
    } = this;
    return function () {
      let i = 0;
      const next = function next(_args) {
        if (i >= middleware.length) {
          return original.call(host, ..._args);
        }
        return middleware[i++](_args, next);
      };
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return next(args);
    };
  }
  push(middleware) {
    this.middleware.push(middleware);
  }
}
const importLoadCostume = __webpack_require__(/*! ../import/load-costume */ "./src/import/load-costume.js");
const costumeMiddleware = new LoadingMiddleware();
importLoadCostume.loadCostume = costumeMiddleware.install(importLoadCostume, importLoadCostume.loadCostume);
const importLoadSound = __webpack_require__(/*! ../import/load-sound */ "./src/import/load-sound.js");
const soundMiddleware = new LoadingMiddleware();
importLoadSound.loadSound = soundMiddleware.install(importLoadSound, importLoadSound.loadSound);
const ScratchStorage = __webpack_require__(/*! scratch-storage */ "./node_modules/scratch-storage/dist/web/scratch-storage.js");
const VirtualMachine = __webpack_require__(/*! .. */ "./src/index-exposed.js");
const Runtime = __webpack_require__(/*! ../engine/runtime */ "./src/engine/runtime.js");
const ScratchRender = __webpack_require__(/*! scratch-render */ "./node_modules/scratch-render/src/index-exposed.js");
const AudioEngine = __webpack_require__(/*! scratch-audio */ "./node_modules/scratch-audio/src/index-exposed.js");
const ScratchSVGRenderer = __webpack_require__(/*! scratch-svg-renderer */ "./node_modules/scratch-svg-renderer/src/index.js");
const Scratch = window.Scratch = window.Scratch || {};
const ASSET_SERVER = 'https://cdn.assets.scratch.mit.edu/';
const PROJECT_SERVER = 'https://cdn.projects.scratch.mit.edu/';
const SLOW = .1;
const projectInput = document.querySelector('input');
document.querySelector('.run').addEventListener('click', () => {
  window.location.hash = projectInput.value;
  location.reload();
}, false);
const setShareLink = function setShareLink(json) {
  document.querySelector('.share').href = "#view/".concat(btoa(JSON.stringify(json)));
  document.querySelectorAll('.share')[1].href = "suite.html";
};
const loadProject = function loadProject() {
  let id = location.hash.substring(1).split(',')[0];
  if (id.length < 1 || !isFinite(id)) {
    id = projectInput.value;
  }
  Scratch.vm.downloadProjectId(id);
  return id;
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
const getProjectUrl = function getProjectUrl(asset) {
  const assetIdParts = asset.assetId.split('.');
  const assetUrlParts = [PROJECT_SERVER, 'internalapi/project/', assetIdParts[0], '/get/'];
  if (assetIdParts[1]) {
    assetUrlParts.push(assetIdParts[1]);
  }
  return assetUrlParts.join('');
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
const getAssetUrl = function getAssetUrl(asset) {
  const assetUrlParts = [ASSET_SERVER, 'internalapi/asset/', asset.assetId, '.', asset.dataFormat, '/get/'];
  return assetUrlParts.join('');
};
class LoadingProgress {
  constructor(callback) {
    this.dataLoaded = 0;
    this.contentTotal = 0;
    this.contentComplete = 0;
    this.hydrateTotal = 0;
    this.hydrateComplete = 0;
    this.memoryCurrent = 0;
    this.memoryPeak = 0;
    this.callback = callback;
  }
  sampleMemory() {
    if (window.performance && window.performance.memory) {
      this.memoryCurrent = window.performance.memory.usedJSHeapSize;
      this.memoryPeak = Math.max(this.memoryCurrent, this.memoryPeak);
    }
  }
  attachHydrateMiddleware(middleware) {
    const _this = this;
    middleware.push((args, next) => {
      _this.hydrateTotal += 1;
      _this.sampleMemory();
      _this.callback(_this);
      return Promise.resolve(next(args)).then(value => {
        _this.hydrateComplete += 1;
        _this.sampleMemory();
        _this.callback(_this);
        return value;
      });
    });
  }
  on(storage, vm) {
    const _this = this;
    this.attachHydrateMiddleware(costumeMiddleware);
    this.attachHydrateMiddleware(soundMiddleware);
    const _load = storage.webHelper.load;
    storage.webHelper.load = function () {
      if (_this.dataLoaded === 0 && window.performance) {
        // Mark in browser inspectors how long it takes to load the
        // projects initial data file.
        performance.mark('Scratch.LoadDataStart');
      }
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      const result = _load.call(this, ...args);
      if (_this.dataLoaded) {
        if (_this.contentTotal === 0 && window.performance) {
          performance.mark('Scratch.DownloadStart');
        }
        _this.contentTotal += 1;
      }
      _this.sampleMemory();
      _this.callback(_this);
      result.then(() => {
        if (_this.dataLoaded === 0) {
          if (window.performance) {
            // How long did loading the data file take?
            performance.mark('Scratch.LoadDataEnd');
            performance.measure('Scratch.LoadData', 'Scratch.LoadDataStart', 'Scratch.LoadDataEnd');
          }
          _this.dataLoaded = 1;
          window.ScratchVMLoadDataEnd = Date.now();
        } else {
          _this.contentComplete += 1;
        }
        if (_this.contentComplete && _this.contentComplete === _this.contentTotal) {
          if (window.performance) {
            // How long did it take to download the html, js, and
            // all the project assets?
            performance.mark('Scratch.DownloadEnd');
            performance.measure('Scratch.Download', 'Scratch.DownloadStart', 'Scratch.DownloadEnd');
          }
          window.ScratchVMDownloadEnd = Date.now();
        }
        _this.sampleMemory();
        _this.callback(_this);
      });
      return result;
    };
    vm.runtime.on(Runtime.PROJECT_LOADED, () => {
      // Currently LoadingProgress tracks when the data has been loaded
      // and not when the data has been decoded. It may be difficult to
      // track that but it isn't hard to track when its all been decoded.
      if (window.performance) {
        // How long did it take to load and hydrate the html, js, and
        // all the project assets?
        performance.mark('Scratch.LoadEnd');
        performance.measure('Scratch.Load', 'Scratch.LoadStart', 'Scratch.LoadEnd');
      }
      window.ScratchVMLoadEnd = Date.now();

      // With this event lets update LoadingProgress a final time so its
      // displayed loading time is accurate.
      _this.sampleMemory();
      _this.callback(_this);
    });
  }
}
class StatTable {
  constructor(_ref) {
    let {
      table,
      keys,
      viewOf,
      isSlow
    } = _ref;
    this.table = table;
    if (keys) {
      this.keys = keys;
    }
    if (viewOf) {
      this.viewOf = viewOf;
    }
    if (isSlow) {
      this.isSlow = isSlow;
    }
  }
  render() {
    const table = this.table;
    Array.from(table.children).forEach(node => table.removeChild(node));
    const keys = this.keys();
    for (const key of keys) {
      this.viewOf(key).render({
        table,
        isSlow: frame => this.isSlow(key, frame)
      });
    }
  }
}
class StatView {
  constructor(name) {
    this.name = name;
    this.executions = 0;
    this.selfTime = 0;
    this.totalTime = 0;
  }
  update(selfTime, totalTime, count) {
    this.executions += count;
    this.selfTime += selfTime;
    this.totalTime += totalTime;
  }
  render(_ref2) {
    let {
      table,
      isSlow
    } = _ref2;
    const row = document.createElement('tr');
    let cell = document.createElement('td');
    cell.innerText = this.name;
    row.appendChild(cell);
    if (isSlow(this)) {
      row.setAttribute('class', 'slow');
    }
    cell = document.createElement('td');
    cell.style.textAlign = 'right';
    cell.innerText = '---';
    // Truncate selfTime. Value past the microsecond are floating point
    // noise.
    this.selfTime = Math.floor(this.selfTime * 1000) / 1000;
    if (this.selfTime > 0) {
      cell.innerText = (this.selfTime / 1000).toFixed(3);
    }
    row.appendChild(cell);
    cell = document.createElement('td');
    cell.style.textAlign = 'right';
    cell.innerText = '---';
    // Truncate totalTime. Value past the microsecond are floating point
    // noise.
    this.totalTime = Math.floor(this.totalTime * 1000) / 1000;
    if (this.totalTime > 0) {
      cell.innerText = (this.totalTime / 1000).toFixed(3);
    }
    row.appendChild(cell);
    cell = document.createElement('td');
    cell.style.textAlign = 'right';
    cell.innerText = this.executions;
    row.appendChild(cell);
    table.appendChild(row);
  }
}
class RunningStats {
  constructor(profiler) {
    this.stepThreadsInnerId = profiler.idByName('Sequencer.stepThreads#inner');
    this.blockFunctionId = profiler.idByName('blockFunction');
    this.stpeThreadsId = profiler.idByName('Sequencer.stepThreads');
    this.recordedTime = 0;
    this.executed = {
      steps: 0,
      blocks: 0
    };
  }
  update(id, arg, selfTime, totalTime, count) {
    if (id === this.stpeThreadsId) {
      this.recordedTime += totalTime;
    } else if (id === this.stepThreadsInnerId) {
      this.executed.steps += count;
    } else if (id === this.blockFunctionId) {
      this.executed.blocks += count;
    }
  }
}
const WORK_TIME = 0.75;
class RunningStatsView {
  constructor(_ref3) {
    let {
      runningStats,
      maxRecordedTime,
      dom
    } = _ref3;
    this.recordedTimeDom = dom.getElementsByClassName('profile-count-amount-recorded')[0];
    this.stepsLoopedDom = dom.getElementsByClassName('profile-count-steps-looped')[0];
    this.blocksExecutedDom = dom.getElementsByClassName('profile-count-blocks-executed')[0];
    this.maxRecordedTime = maxRecordedTime;
    this.maxWorkedTime = maxRecordedTime * WORK_TIME;
    this.runningStats = runningStats;
  }
  render() {
    const {
      runningStats,
      recordedTimeDom,
      stepsLoopedDom,
      blocksExecutedDom
    } = this;
    const {
      executed
    } = runningStats;
    const fractionWorked = runningStats.recordedTime / this.maxWorkedTime;
    recordedTimeDom.innerText = "".concat((fractionWorked * 100).toFixed(1), " %");
    stepsLoopedDom.innerText = executed.steps;
    blocksExecutedDom.innerText = executed.blocks;
  }
}
class Frames {
  constructor(profiler) {
    this.profiler = profiler;
    this.frames = [];
  }
  update(id, arg, selfTime, totalTime, count) {
    if (id < 0) return;
    if (!this.frames[id]) {
      this.frames[id] = new StatView(this.profiler.nameById(id));
    }
    this.frames[id].update(selfTime, totalTime, count);
  }
}
const frameOrder = ['blockFunction', 'execute', 'Sequencer.stepThread', 'Sequencer.stepThreads#inner', 'Sequencer.stepThreads', 'RenderWebGL.draw', 'Runtime._step'];
class FramesTable extends StatTable {
  constructor(options) {
    super(options);
    this.profiler = options.profiler;
    this.frames = options.frames;
  }
  keys() {
    const keys = Object.keys(this.frames.frames).map(id => this.profiler.nameById(Number(id)));
    keys.sort((a, b) => frameOrder.indexOf(a) - frameOrder.indexOf(b));
    return keys;
  }
  viewOf(key) {
    return this.frames.frames[this.profiler.idByName(key)];
  }
  isSlow() {
    return false;
  }
}
class Opcodes {
  constructor(profiler) {
    this.blockFunctionId = profiler.idByName('blockFunction');
    this.opcodes = {};
  }
  update(id, arg, selfTime, totalTime, count) {
    if (id === this.blockFunctionId) {
      if (!this.opcodes[arg]) {
        this.opcodes[arg] = new StatView(arg);
      }
      this.opcodes[arg].update(selfTime, totalTime, count);
    }
  }
}
class OpcodeTable extends StatTable {
  constructor(options) {
    super(options);
    this.profiler = options.profiler;
    this.opcodes = options.opcodes;
    this.frames = options.frames;
  }
  keys() {
    const keys = Object.keys(this.opcodes.opcodes);
    keys.sort();
    return keys;
  }
  viewOf(key) {
    return this.opcodes.opcodes[key];
  }
  isSlow(key) {
    const blockFunctionTotalTime = this.frames.frames[this.profiler.idByName('blockFunction')].totalTime;
    const rowTotalTime = this.opcodes.opcodes[key].totalTime;
    const percentOfRun = rowTotalTime / blockFunctionTotalTime;
    return percentOfRun > SLOW;
  }
}
class ProfilerRun {
  constructor(_ref4) {
    let {
      vm,
      maxRecordedTime,
      warmUpTime
    } = _ref4;
    this.vm = vm;
    this.maxRecordedTime = maxRecordedTime;
    this.warmUpTime = warmUpTime;
    vm.runtime.enableProfiling();
    const profiler = this.profiler = vm.runtime.profiler;
    vm.runtime.profiler = null;
    const runningStats = this.runningStats = new RunningStats(profiler);
    const runningStatsView = this.runningStatsView = new RunningStatsView({
      dom: document.getElementsByClassName('profile-count-group')[0],
      runningStats,
      maxRecordedTime
    });
    const frames = this.frames = new Frames(profiler);
    this.frameTable = new FramesTable({
      table: document.getElementsByClassName('profile-count-frame-table')[0].getElementsByTagName('tbody')[0],
      profiler,
      frames
    });
    const opcodes = this.opcodes = new Opcodes(profiler);
    this.opcodeTable = new OpcodeTable({
      table: document.getElementsByClassName('profile-count-opcode-table')[0].getElementsByTagName('tbody')[0],
      profiler,
      opcodes,
      frames
    });
    const stepId = profiler.idByName('Runtime._step');
    profiler.onFrame = _ref5 => {
      let {
        id,
        arg,
        selfTime,
        totalTime,
        count
      } = _ref5;
      if (id === stepId) {
        runningStatsView.render();
      }
      runningStats.update(id, arg, selfTime, totalTime, count);
      opcodes.update(id, arg, selfTime, totalTime, count);
      frames.update(id, arg, selfTime, totalTime, count);
    };
  }
  run() {
    this.projectId = loadProject();
    window.parent.postMessage({
      type: 'BENCH_MESSAGE_LOADING'
    }, '*');
    this.vm.on('workspaceUpdate', () => {
      setTimeout(() => {
        window.parent.postMessage({
          type: 'BENCH_MESSAGE_WARMING_UP'
        }, '*');
        this.vm.greenFlag();
      }, 100);
      setTimeout(() => {
        window.parent.postMessage({
          type: 'BENCH_MESSAGE_ACTIVE'
        }, '*');
        this.vm.runtime.profiler = this.profiler;
      }, 100 + this.warmUpTime);
      setTimeout(() => {
        this.vm.stopAll();
        clearTimeout(this.vm.runtime._steppingInterval);
        this.vm.runtime.profiler = null;
        this.frameTable.render();
        this.opcodeTable.render();
        window.parent.postMessage({
          type: 'BENCH_MESSAGE_COMPLETE',
          frames: this.frames.frames,
          opcodes: this.opcodes.opcodes
        }, '*');
        setShareLink({
          fixture: {
            projectId: this.projectId,
            warmUpTime: this.warmUpTime,
            recordingTime: this.maxRecordedTime
          },
          frames: this.frames.frames,
          opcodes: this.opcodes.opcodes
        });
      }, 100 + this.warmUpTime + this.maxRecordedTime);
    });
  }
  render(json) {
    const {
      fixture
    } = json;
    document.querySelector('[type=text]').value = [fixture.projectId, fixture.warmUpTime, fixture.recordingTime].join(',');
    this.frames.frames = json.frames.map(frame => Object.assign(new StatView(), frame, {
      name: this.profiler.nameById(this.profiler.idByName(frame.name))
    }));
    this.opcodes.opcodes = {};
    Object.entries(json.opcodes).forEach(_ref6 => {
      let [opcode, data] = _ref6;
      this.opcodes.opcodes[opcode] = Object.assign(new StatView(), data);
    });
    this.frameTable.render();
    this.opcodeTable.render();
  }
}

/**
 * Run the benchmark with given parameters in the location's hash field or
 * using defaults.
 */
const runBenchmark = function runBenchmark() {
  // Lots of global variables to make debugging easier
  // Instantiate the VM.
  const vm = new VirtualMachine();
  Scratch.vm = vm;
  vm.setTurboMode(true);
  const storage = new ScratchStorage();
  const AssetType = storage.AssetType;
  storage.addWebSource([AssetType.Project], getProjectUrl);
  storage.addWebSource([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
  vm.attachStorage(storage);
  new LoadingProgress(progress => {
    const setElement = (name, value) => {
      document.getElementsByClassName(name)[0].innerText = value;
    };
    const sinceLoadStart = key => "(".concat((window[key] || Date.now()) - window.ScratchVMLoadStart, "ms)");
    setElement('loading-total', 1);
    setElement('loading-complete', progress.dataLoaded);
    setElement('loading-time', sinceLoadStart('ScratchVMLoadDataEnd'));
    setElement('loading-content-total', progress.contentTotal);
    setElement('loading-content-complete', progress.contentComplete);
    setElement('loading-content-time', sinceLoadStart('ScratchVMDownloadEnd'));
    setElement('loading-hydrate-total', progress.hydrateTotal);
    setElement('loading-hydrate-complete', progress.hydrateComplete);
    setElement('loading-hydrate-time', sinceLoadStart('ScratchVMLoadEnd'));
    if (progress.memoryPeak) {
      setElement('loading-memory-current', "".concat((progress.memoryCurrent / 1000000).toFixed(0), "MB"));
      setElement('loading-memory-peak', "".concat((progress.memoryPeak / 1000000).toFixed(0), "MB"));
    }
  }).on(storage, vm);
  let warmUpTime = 4000;
  let maxRecordedTime = 6000;
  if (location.hash) {
    const split = location.hash.substring(1).split(',');
    if (split[1] && split[1].length > 0) {
      warmUpTime = Number(split[1]);
    }
    maxRecordedTime = Number(split[2] || '0') || 6000;
  }
  new ProfilerRun({
    vm,
    warmUpTime,
    maxRecordedTime
  }).run();

  // Instantiate the renderer and connect it to the VM.
  const canvas = document.getElementById('scratch-stage');
  const renderer = new ScratchRender(canvas);
  Scratch.renderer = renderer;
  vm.attachRenderer(renderer);
  const audioEngine = new AudioEngine();
  vm.attachAudioEngine(audioEngine);
  vm.attachV2BitmapAdapter(new ScratchSVGRenderer.BitmapAdapter());

  // Feed mouse events as VM I/O events.
  document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const coordinates = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', coordinates);
  });
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const data = {
      isDown: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', data);
    e.preventDefault();
  });
  canvas.addEventListener('mouseup', e => {
    const rect = canvas.getBoundingClientRect();
    const data = {
      isDown: false,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', data);
    e.preventDefault();
  });

  // Feed keyboard events as VM I/O events.
  document.addEventListener('keydown', e => {
    // Don't capture keys intended for Blockly inputs.
    if (e.target !== document && e.target !== document.body) {
      return;
    }
    Scratch.vm.postIOData('keyboard', {
      keyCode: e.keyCode,
      isDown: true
    });
    e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    // Always capture up events,
    // even those that have switched to other targets.
    Scratch.vm.postIOData('keyboard', {
      keyCode: e.keyCode,
      isDown: false
    });
    // E.g., prevent scroll.
    if (e.target !== document && e.target !== document.body) {
      e.preventDefault();
    }
  });

  // Run threads
  vm.start();
};

/**
 * Render previously run benchmark data.
 * @param {object} json data from a previous benchmark run.
 */
const renderBenchmarkData = function renderBenchmarkData(json) {
  const vm = new VirtualMachine();
  new ProfilerRun({
    vm
  }).render(json);
  setShareLink(json);
};
const onload = function onload() {
  if (location.hash.substring(1).startsWith('view')) {
    document.body.className = 'render';
    const data = location.hash.substring(6);
    const frozen = atob(data);
    const json = JSON.parse(frozen);
    renderBenchmarkData(json);
  } else {
    runBenchmark();
  }
};
window.onhashchange = function () {
  location.reload();
};
if (window.performance) {
  performance.mark('Scratch.EvalEnd');
  performance.measure('Scratch.Eval', 'Scratch.EvalStart', 'Scratch.EvalEnd');
}
window.ScratchVMEvalEnd = Date.now();
onload();

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"benchmark": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkscratch_vm"] = self["webpackChunkscratch_vm"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_vernier_godirect_dist_godirect_min_cjs_js-node_modules_atob_browser-atob-7f0f5d","vendors-node_modules_scratch-audio_src_index-exposed_js-node_modules_scratch-render_src_index-35ce81","src_extensions_scratch3_video_sensing_library_js","src_index-exposed_js"], () => (__webpack_require__("./src/playground/benchmark.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=benchmark.js.map