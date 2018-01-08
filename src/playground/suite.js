const soon = (() => {
    let _soon;
    return () => {
        if (!_soon) {
            _soon = Promise.resolve()
                .then(() => {
                    _soon = null;
                });
        }
        return _soon;
    };
})();

class Emitter {
    constructor () {
        Object.defineProperty(this, '_listeners', {
            value: {},
            enumerable: false
        });
    }
    on (name, listener, context) {
        if (!this._listeners[name]) {
            this._listeners[name] = [];
        }

        this._listeners[name].push(listener, context);
    }
    off (name, listener, context) {
        if (this._listeners[name]) {
            if (listener) {
                for (let i = 0; i < this._listeners[name].length; i += 2) {
                    if (
                        this._listeners[name][i] === listener &&
                        this._listeners[name][i + 1] === context) {
                        this._listeners[name].splice(i, 2);
                        i -= 2;
                    }
                }
            } else {
                for (let i = 0; i < this._listeners[name].length; i += 2) {
                    if (this._listeners[name][i + 1] === context) {
                        this._listeners[name].splice(i, 2);
                        i -= 2;
                    }
                }
            }
        }
    }
    emit (name, ...args) {
        if (this._listeners[name]) {
            for (let i = 0; i < this._listeners[name].length; i += 2) {
                this._listeners[name][i].call(this._listeners[name][i + 1] || this, ...args);
            }
        }
    }
}

class BenchFrameStream extends Emitter {
    constructor (frame) {
        super();

        this.frame = frame;
        window.addEventListener('message', message => {
            this.emit('message', message.data);
        });
    }

    send (message) {
        this.frame.send(message);
    }
}

const BENCH_MESSAGE_TYPE = {
    LOAD: 'BENCH_MESSAGE_LOAD',
    LOADING: 'BENCH_MESSAGE_LOADING',
    WARMING_UP: 'BENCH_MESSAGE_WARMING_UP',
    ACTIVE: 'BENCH_MESSAGE_ACTIVE',
    COMPLETE: 'BENCH_MESSAGE_COMPLETE'
};

class BenchUtil {
    constructor (frame) {
        this.frame = frame;
        this.benchStream = new BenchFrameStream(frame);
    }

    startBench (args) {
        Promise.resolve()
            .then(() => new Promise(resolve => setTimeout(resolve, 100)))
            .then(() => {
                this.frame.contentWindow.location.assign('about:blank');
            })
            .then(() => new Promise(resolve => setTimeout(resolve, 100)))
            .then(() => {
                this.frame.contentWindow.location.assign(
                    `/benchmark/#${args.projectId},${args.warmUpTime},${args.recordingTime}`);
            });
    }
}

const BENCH_STATUS = {
    INACTIVE: 'BENCH_STATUS_INACTIVE',
    STARTING: 'BENCH_STATUS_STARTING',
    LOADING: 'BENCH_STATUS_LOADING',
    WARMING_UP: 'BENCH_STATUS_WARMING_UP',
    ACTIVE: 'BENCH_STATUS_ACTIVE',
    COMPLETE: 'BENCH_STATUS_COMPLETE'
};

class BenchResult {
    constructor ({fixture, status = BENCH_STATUS.INACTIVE, frames = null, opcodes = null}) {
        this.fixture = fixture;
        this.status = status;
        this.frames = frames;
        this.opcodes = opcodes;
    }
}

class BenchFixture extends Emitter {
    constructor ({
        projectId,
        warmUpTime = 4000,
        recordingTime = 6000
    }) {
        super();

        this.projectId = projectId;
        this.warmUpTime = warmUpTime;
        this.recordingTime = recordingTime;
    }

    get id () {
        return `${this.projectId}-${this.warmUpTime}-${this.recordingTime}`;
    }

    run (util) {
        return new Promise(resolve => {
            util.benchStream.on('message', message => {
                const result = {
                    fixture: this,
                    status: BENCH_STATUS.STARTING,
                    frames: null,
                    opcodes: null
                };
                if (message.type === BENCH_MESSAGE_TYPE.LOADING) {
                    result.status = BENCH_STATUS.LOADING;
                } else if (message.type === BENCH_MESSAGE_TYPE.WARMING_UP) {
                    result.status = BENCH_STATUS.WARMING_UP;
                } else if (message.type === BENCH_MESSAGE_TYPE.ACTIVE) {
                    result.status = BENCH_STATUS.ACTIVE;
                } else if (message.type === BENCH_MESSAGE_TYPE.COMPLETE) {
                    result.status = BENCH_STATUS.COMPLETE;
                    result.frames = message.frames;
                    result.opcodes = message.opcodes;
                    resolve(new BenchResult(result));
                    util.benchStream.off('message', null, this);
                }
                this.emit('result', new BenchResult(result));
            }, this);
            util.startBench(this);
        });
    }
}

class BenchSuiteResult extends Emitter {
    constructor ({suite, results = []}) {
        super();

        this.suite = suite;
        this.results = results;

        if (suite) {
            suite.on('result', result => {
                if (result.status === BENCH_STATUS.COMPLETE) {
                    this.results.push(results);
                    this.emit('add', this);
                }
            });
        }
    }
}

class BenchSuite extends Emitter {
    constructor (fixtures = []) {
        super();

        this.fixtures = fixtures;
    }

    add (fixture) {
        this.fixtures.push(fixture);
    }

    run (util) {
        return new Promise(resolve => {
            const fixtures = this.fixtures.slice();
            const results = [];
            const push = result => {
                result.fixture.off('result', null, this);
                results.push(result);
            };
            const emitResult = this.emit.bind(this, 'result');
            const pop = () => {
                const fixture = fixtures.shift();
                if (fixture) {
                    fixture.on('result', emitResult, this);
                    fixture.run(util)
                        .then(push)
                        .then(pop);
                } else {
                    resolve(new BenchSuiteResult({suite: this, results}));
                }
            };
            pop();
        });
    }
}

class BenchRunner extends Emitter {
    constructor ({frame, suite}) {
        super();

        this.frame = frame;
        this.suite = suite;
        this.util = new BenchUtil(frame);
    }

    run () {
        return this.suite.run(this.util);
    }
}

const viewNames = {
    [BENCH_STATUS.INACTIVE]: 'Inactive',
    [BENCH_STATUS.STARTING]: 'Starting',
    [BENCH_STATUS.LOADING]: 'Loading',
    [BENCH_STATUS.WARMING_UP]: 'Warming Up',
    [BENCH_STATUS.ACTIVE]: 'Active',
    [BENCH_STATUS.COMPLETE]: 'Complete'
};

class BenchResultView {
    constructor ({result}) {
        this.result = result;
        this.dom = document.createElement('div');
    }

    update (result) {
        soon().then(() => this.render(result));
    }

    render (newResult = this.result) {
        const blockFunctionFrame = (newResult.frames ? newResult.frames : [])
            .find(frame => frame.name === 'blockFunction');
        const stepThreadsInnerFrame = (newResult.frames ? newResult.frames : [])
            .find(frame => frame.name === 'Sequencer.stepThreads#inner');

        const blocksPerSecond = blockFunctionFrame ?
            (blockFunctionFrame.executions / (stepThreadsInnerFrame.totalTime / 1000)) | 0 :
            0;

        this.dom.innerHTML = `
            <div class="fixture-project">
                <label>Project ID</label> <a
                    href="/playground/#${newResult.fixture.projectId}"
                    >${newResult.fixture.projectId}</a>
            </div>
            (<span class="fixture-warm-up">${newResult.fixture.warmUpTime / 1000}s</span>
            <span class="fixture-recording">${newResult.fixture.recordingTime / 1000}s</span>)
            <div class="result-status">
                ${blockFunctionFrame ? `${blocksPerSecond} blocks/s` : viewNames[newResult.status]}
            </div>
        `;

        this.result = newResult;
        return this;
    }
}

class BenchSuiteResultView {
    constructor ({runner}) {
        this.runner = runner;
        this.suite = runner.suite;
        this.views = {};
        this.dom = document.createElement('div');

        const {suite} = runner;
        for (const fixture of suite.fixtures) {
            this.views[fixture.id] = new BenchResultView({result: new BenchResult({fixture})});
            this.dom.appendChild(this.views[fixture.id].render().dom);
        }

        suite.on('result', result => {
            this.views[result.fixture.id].update(result);
        });
    }

    render () {
        return this;
    }
}

window.onload = function () {
    const suite = new BenchSuite();

    suite.add(new BenchFixture({
        projectId: 130041250,
        warmUpTime: 0,
        recordingTime: 2000
    }));

    suite.add(new BenchFixture({
        projectId: 130041250,
        warmUpTime: 4000,
        recordingTime: 6000
    }));

    suite.add(new BenchFixture({
        projectId: 14844969,
        warmUpTime: 0,
        recordingTime: 2000
    }));

    suite.add(new BenchFixture({
        projectId: 14844969,
        warmUpTime: 1000,
        recordingTime: 6000
    }));

    suite.add(new BenchFixture({
        projectId: 173918262,
        warmUpTime: 0,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 173918262,
        warmUpTime: 5000,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 155128646,
        warmUpTime: 0,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 155128646,
        warmUpTime: 5000,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 89811578,
        warmUpTime: 0,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 89811578,
        warmUpTime: 5000,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 139193539,
        warmUpTime: 0,
        recordingTime: 5000
    }));

    suite.add(new BenchFixture({
        projectId: 139193539,
        warmUpTime: 5000,
        recordingTime: 5000
    }));

    const frame = document.getElementsByTagName('iframe')[0];
    const runner = new BenchRunner({frame, suite});
    const resultsView = new BenchSuiteResultView({runner});

    document.getElementsByClassName('suite-results')[0].appendChild(resultsView.dom);

    runner.run();
};
