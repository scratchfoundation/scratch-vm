const Scratch = window.Scratch = window.Scratch || {};

const ASSET_SERVER = 'https://cdn.assets.scratch.mit.edu/';
const PROJECT_SERVER = 'https://cdn.projects.scratch.mit.edu/';

const SLOW = .1;

const projectInput = document.querySelector('input');

document.querySelector('.run')
    .addEventListener('click', () => {
        window.location.hash = projectInput.value;
        location.reload();
    }, false);

const loadProject = function () {
    let id = location.hash.substring(1);
    if (id.length < 1 || !isFinite(id)) {
        id = projectInput.value;
    }
    Scratch.vm.downloadProjectId(id);
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
const getProjectUrl = function (asset) {
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
const getAssetUrl = function (asset) {
    const assetUrlParts = [
        ASSET_SERVER,
        'internalapi/asset/',
        asset.assetId,
        '.',
        asset.dataFormat,
        '/get/'
    ];
    return assetUrlParts.join('');
};

class LoadingProgress {
    constructor (callback) {
        this.total = 0;
        this.complete = 0;
        this.callback = callback;
    }

    on (storage) {
        const _this = this;
        const _load = storage.webHelper.load;
        storage.webHelper.load = function (...args) {
            const result = _load.call(this, ...args);
            _this.total += 1;
            _this.callback(_this);
            result.then(() => {
                _this.complete += 1;
                _this.callback(_this);
            });
            return result;
        };
    }
}

class StatTable {
    constructor ({table, keys, viewOf, isSlow}) {
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

    render () {
        const table = this.table;
        Array.from(table.children)
            .forEach(node => table.removeChild(node));
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
    constructor (name) {
        this.name = name;
        this.executions = 0;
        this.selfTime = 0;
        this.totalTime = 0;
    }

    update (selfTime, totalTime) {
        this.executions++;
        this.selfTime += selfTime;
        this.totalTime += totalTime;
    }

    render ({table, isSlow}) {
        const row = document.createElement('tr');
        let cell = document.createElement('td');
        cell.innerText = this.name;
        row.appendChild(cell);

        if (isSlow(this)) {
            row.setAttribute('class', 'slow');
        }

        cell = document.createElement('td');
        cell.innerText = (this.selfTime / 1000).toPrecision(3);
        row.appendChild(cell);

        cell = document.createElement('td');
        cell.innerText = (this.totalTime / 1000).toPrecision(3);
        row.appendChild(cell);

        cell = document.createElement('td');
        cell.innerText = this.executions;
        row.appendChild(cell);

        table.appendChild(row);
    }
}

class RunningStats {
    constructor (profiler) {
        this.stepThreadsInnerId = profiler.idByName('Sequencer.stepThreads#inner');
        this.blockFunctionId = profiler.idByName('blockFunction');
        this.stpeThreadsId = profiler.idByName('Sequencer.stepThreads');

        this.recordedTime = 0;
        this.executed = {
            steps: 0,
            blocks: 0
        };
    }

    update (id, selfTime, totalTime) {
        if (id === this.stpeThreadsId) {
            this.recordedTime += totalTime;
        } else if (id === this.stepThreadsInnerId) {
            this.executed.steps++;
        } else if (id === this.blockFunctionId) {
            this.executed.blocks++;
        }
    }
}

const WORK_TIME = 0.75;

class RunningStatsView {
    constructor ({runningStats, maxRecordedTime, dom}) {
        this.recordedTimeDom =
            dom.getElementsByClassName('profile-count-amount-recorded')[0];
        this.stepsLoopedDom =
            dom.getElementsByClassName('profile-count-steps-looped')[0];
        this.blocksExecutedDom =
            dom.getElementsByClassName('profile-count-blocks-executed')[0];

        this.maxRecordedTime = maxRecordedTime;
        this.maxWorkedTime = maxRecordedTime * WORK_TIME;
        this.runningStats = runningStats;
    }

    render () {
        const {
            runningStats,
            recordedTimeDom,
            stepsLoopedDom,
            blocksExecutedDom
        } = this;
        const {executed} = runningStats;
        const fractionWorked = runningStats.recordedTime / this.maxWorkedTime;
        recordedTimeDom.innerText = `${(fractionWorked * 100).toFixed(1)} %`;
        stepsLoopedDom.innerText = executed.steps;
        blocksExecutedDom.innerText = executed.blocks;
    }
}

class Frames {
    constructor (profiler) {
        this.profiler = profiler;

        this.frames = [];
    }

    update (id, selfTime, totalTime) {
        if (!this.frames[id]) {
            this.frames[id] = new StatView(this.profiler.nameById(id));
        }
        this.frames[id].update(selfTime, totalTime);
    }
}

const frameOrder = [
    'blockFunction',
    'execute',
    'Sequencer.stepThread',
    'Sequencer.stepThreads#inner',
    'Sequencer.stepThreads',
    'RenderWebGL.draw',
    'Runtime._step'
];

class FramesTable extends StatTable {
    constructor (options) {
        super(options);

        this.profiler = options.profiler;
        this.frames = options.frames;
    }

    keys () {
        const keys = Object.keys(this.frames.frames)
            .map(id => this.profiler.nameById(Number(id)));
        keys.sort((a, b) => frameOrder.indexOf(a) - frameOrder.indexOf(b));
        return keys;
    }

    viewOf (key) {
        return this.frames.frames[this.profiler.idByName(key)];
    }

    isSlow (key, frame) {
        return ([
            'Sequencer.stepThreads',
            'Sequencer.stepThreads#inner',
            'Sequencer.stepThread',
            'execute'
        ].indexOf(key) > 0 &&
        frame.selfTime / frame.totalTime > SLOW);
    }
}

class Opcodes {
    constructor (profiler) {
        this.blockFunctionId = profiler.idByName('blockFunction');

        this.opcodes = {};
    }

    update (id, selfTime, totalTime, arg) {
        if (id === this.blockFunctionId) {
            if (!this.opcodes[arg]) {
                this.opcodes[arg] = new StatView(arg);
            }
            this.opcodes[arg].update(selfTime, totalTime);
        }
    }
}

class OpcodeTable extends StatTable {
    constructor (options) {
        super(options);

        this.profiler = options.profiler;
        this.opcodes = options.opcodes;
        this.frames = options.frames;
    }

    keys () {
        const keys = Object.keys(this.opcodes.opcodes);
        keys.sort();
        return keys;
    }

    viewOf (key) {
        return this.opcodes.opcodes[key];
    }

    isSlow (key) {
        const blockFunctionTotalTime = this.frames.frames[this.profiler.idByName('blockFunction')].totalTime;
        const rowTotalTime = this.opcodes.opcodes[key].totalTime;
        const percentOfRun = rowTotalTime / blockFunctionTotalTime;
        return percentOfRun > SLOW;
    }
}

class ProfilerRun {
    constructor ({vm, maxRecordedTime, warmUpTime}) {
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
            maxRecordedTime: 6000
        });

        const frames = this.frames = new Frames(profiler);
        this.frameTable = new FramesTable({
            table: document
                .getElementsByClassName('profile-count-frame-table')[0]
                .getElementsByTagName('tbody')[0],

            profiler,
            frames
        });

        const opcodes = this.opcodes = new Opcodes(profiler);
        this.opcodeTable = new OpcodeTable({
            table: document
                .getElementsByClassName('profile-count-opcode-table')[0]
                .getElementsByTagName('tbody')[0],

            profiler,
            opcodes,
            frames
        });

        const stepId = profiler.idByName('Runtime._step');
        profiler.onFrame = ({id, selfTime, totalTime, arg}) => {
            if (id === stepId) {
                runningStatsView.render();
            }
            runningStats.update(id, selfTime, totalTime, arg);
            opcodes.update(id, selfTime, totalTime, arg);
            frames.update(id, selfTime, totalTime, arg);
        };
    }

    run () {
        loadProject();

        this.vm.on('workspaceUpdate', () => {
            setTimeout(() => {
                this.vm.greenFlag();
            }, 100);
            setTimeout(() => {
                this.vm.runtime.profiler = this.profiler;
            }, 100 + this.warmUpTime);
            setTimeout(() => {
                this.vm.stopAll();
                clearTimeout(this.vm.runtime._steppingInterval);
                this.vm.runtime.profiler = null;

                this.frameTable.render();
                this.opcodeTable.render();
            }, 100 + this.warmUpTime + this.maxRecordedTime);
        });
    }
}

window.onload = function () {
    // Lots of global variables to make debugging easier
    // Instantiate the VM.
    const vm = new window.VirtualMachine();
    Scratch.vm = vm;

    vm.setTurboMode(true);

    const storage = new ScratchStorage(); /* global ScratchStorage */
    const AssetType = storage.AssetType;
    storage.addWebSource([AssetType.Project], getProjectUrl);
    storage.addWebSource([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl);
    vm.attachStorage(storage);

    new LoadingProgress(progress => {
        document.getElementsByClassName('loading-total')[0]
            .innerText = progress.total;
        document.getElementsByClassName('loading-complete')[0]
            .innerText = progress.complete;
    }).on(storage);

    new ProfilerRun({
        vm,
        warmUpTime: 4000,
        maxRecordedTime: 6000
    }).run();

    // Instantiate the renderer and connect it to the VM.
    const canvas = document.getElementById('scratch-stage');
    const renderer = new window.RenderWebGL(canvas);
    Scratch.renderer = renderer;
    vm.attachRenderer(renderer);
    const audioEngine = new window.AudioEngine();
    vm.attachAudioEngine(audioEngine);

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
