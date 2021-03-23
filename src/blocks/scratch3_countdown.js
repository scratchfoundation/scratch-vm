const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const convertBase = new convert();
const Color = require('../util/color');
const SoundData = require('../import/SoundFiles/soundData');
const Timer = require('../util/timer');
const VM = require('../virtual-machine');

class Scratch3Countdown {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        this.actions = [];

        this.gameStart = false;
        this.timerStart = false;
        this.celebrateStart = false;

        this.celebrateFirst = false;
        this.gameFirst = false;
        this.timerFirst = false;

        this.isSatelliteTouched = false;
        this.satelliteToCheck = '';
        this.touchedSattleite = '';

        this.mode_match = false;

        this.runtime.on('TOUCH_EVENT_ONE', args => {
            if (this.runtime._editingTarget.blocks._scripts.length === 0) {
                return;
            }
            this.satellite = args.satellite;
            this.touchEventOne = true;
            
        });

        this.runtime.on('GAME_STARTED', () => {
            this.gameStart = true;
        });

        this.runtime.on('TIMER_STARTED', () => {
            this.timerStart = true;
        });

        this.runtime.on('CELEBRATION_STARTED', () => {
            this.celebrateStart = true;
        });

        this.runtime.on('MODE_CHECKED_TRUE', () => {
            this.mode_match = true;
        });

        this.runtime.on('MODE_CHECKED_FALSE', () => {
            this.mode_match = false;
        });

        this.runtime.on('IS_TOUCHED', data => {
            console.log(this.satelliteToCheck, 'satelliteToCheck');
            console.log(data.sender, 'data.sender');
            console.log(data, 'DATAINisTOUCH');
            if (data.touched === true) {
                this.touchedSattleite = data.sender;
                this.isSatelliteTouched = !!(data.touched);
            } else {
                this.touchedSattleite = '';
                this.isSatelliteTouched = !!(data.touched);
            }
          
            console.log(this.touchedSattleite, 'touched sat', this.isSatelliteTouched, 'is sat touched');
        });


        this.runtime.on('RESET_GAME_STARTED', data => {
            for (let i = 0; i < this.actions.length; i++) {
                const keys = Object.keys(this.actions[i]);
                if (data.condition === keys[0]) {
                    this.actions[i] = {[`${data.condition}`]: false};
                    break;
                }
            }
        });

        this.runtime.on('RESET_TIMER_STARTED', () => {
            this.timerFirst = false;
            this.timerStart = false;
        });

        this.runtime.on('RESET_CELEBRATION_STARTED', () => {
            this.celebrateFirst = false;
            this.celebrateStart = false;
        });

        this.runtime.on('MQTT_RECEIVED', data => {
            const parsedData = JSON.parse(data.message);
            for (let i = 0; i < this.actions.length; i++) {
                const keys = Object.keys(this.actions[i]);
                if (parsedData.action === keys[0]) {
                    this.actions[i] = {[`${parsedData.action}`]: true};
                    break;
                }
            }
        });

        this.runtime.on('RESET_GAME', () => {
            for (let i = 0; i < this.actions.length; i++) {
                const keys = Object.keys(this.actions[i]);
                this.actions[i] = {[`${keys[0]}`]: false};
            }
        });
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            message_sendGameMQTT: this.sendGameMQTT,
            message_receiveGameMQTT: this.listenToTopicMQTT,
            message_waitUntilBroadcast: this.waitUntil,
            countdown_gameMode: this.gameMode,
            countdown_startCelebration: this.startCelebration,
            countdown_whenTimerStarted: this.whenTimerStarted,
            countdown_whenCelebrationStarted: this.whenCelebrationStarted,
            countdown_gameModeCheck: this.gameModeCheck
        };
    }

    getHats () {
        return {
            event_whenstarted: {
                restartExistingThreads: true
            }
        };
    }

    gameMode (args, util) {
        this.runtime.emit(args);
        const condition = this.mode_match;
      
        if (!condition) {
            util.yield();
        }
    }

    gameModeCheck (args) {
        this.runtime.emit(args);
        if (this.mode_match) {
            return true;
        }
        return false;
    }

    sendGameMQTT (args, util) {
        if (args.TOPIC === '' ||
      args.TOPIC === 'topic' ||
      args.VALUE === '' ||
      args.VALUE === 'value') {
            return;
        }
        const topic = args.TOPIC.split('/');
        const value = args.VALUE;
        const last = topic.length - 1;
        const action = topic[last];
        this.runtime.emit('SEND_BROADCAST', {
            topic: args.TOPIC,
            action: action,
            value: value
        });
    }

    listenToTopicMQTT (args, util) {
        let stringActions = '';

        if (args.TOPIC === '') {
            return;
        }

        if (args.TOPIC === 'topic') {
            return;
        }

        const topic = args.TOPIC.split('/');
        const last = topic.length - 1;
        const action = topic[last];

        if (this.actions.length === 0) {
            const add = {[`${action}`]: false};
            this.actions.push(add);
        } else {
            stringActions = JSON.stringify(this.actions);
            if (stringActions.includes(action)) {
                this.actions.length = 0;
                const add = {[`${action}`]: false};
                this.actions.push(add);
            } else {
                const add = {[`${action}`]: false};
                this.actions.push(add);
            }
        }

        console.log(this.actions, 'actions');

        this.runtime.emit('SET_BROADCAST_LISTENER', {
            topic: args.TOPIC,
            action: action
        });
    }

    waitUntil (args, util) {
        console.log(args, 'args from waitUtil');
        const topic = args.TOPIC.split('/');
        const last = topic.length - 1;
        const action = topic[last];
        let condition = '';

        for (let i = 0; i < this.actions.length; i++) {
            const keys = Object.keys(this.actions[i]);
            if (action === keys[0]) {
                condition = Object.values(this.actions[i])[0];
            }
        }

        if (!condition) {
            util.yield();
        } else {
            return;
        }
    }

    startCountdown (args) {
        this.runtime.emit('START_GAME');
    }

    whenGameStarted (args, util) {
        if (!this.gameFirst) {
            this.runtime.emit('ADD_GAME_START_LISTENER');
        }

        this.gameFirst = true;
        const condition = this.gameStart;

        if (!condition) {
            util.yield();
        } else {
            setTimeout(() => {
                this.runtime.emit('RESET_GAME_STARTED');
            }, 2000);
        }

    }

    startTimer (args) {
        this.runtime.emit('START_TIMER');
    }

    startCelebration (args) {
        this.runtime.emit('START_CELEBRATION');
    }

    whenTimerStarted (args, util) {
        if (!this.timerFirst) {
            this.runtime.emit('ADD_TIMER_START_LISTENER');
        }

        this.timerFirst = true;
        const condition = this.timerStart;

        if (!condition) {
            util.yield();
        } else {
            setTimeout(() => {
                this.runtime.emit('RESET_TIMER_STARTED');
            }, 2000);
        }
    }

    whenCelebrationStarted (args, util) {
        if (!this.celebrateFirst) {
            this.runtime.emit('ADD_CELEBRATE_START_LISTENER');
            console.log('celebrated');
        }

        this.celebrateFirst = true;
        const condition = this.celebrateStart;

        if (!condition) {
            util.yield();
        } else {
            setTimeout(() => {
                this.runtime.emit('RESET_CELEBRATION_STARTED');
            }, 2000);
        }
    }

}

module.exports = Scratch3Countdown;
