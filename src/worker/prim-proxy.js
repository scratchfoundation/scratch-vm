import _ from "lodash";
import InterruptError from "./errors/interruptError.mjs";
import Scratch3SoundBlocks from "../blocks/scratch3_sound.mjs";
import Scratch3LooksBlocks from "../blocks/scratch3_looks.mjs";
import Scratch3MotionBlocks from "../blocks/scratch3_motion.mjs";
import Scratch3SensingBlocks from "../blocks/scratch3_sensing.mjs";
import Scratch3ControlBlocks from "../blocks/scratch3_control.mjs";
import Scratch3PenBlocks from "../blocks/scratch3_ext_pen.mjs";

class PrimProxy {
    /**
     * Dynamic lists of targets, backdrops, costumes, sounds, and messages that need to be generated at runtime.
     */
    static TARGET_NAMES = "TARGET_NAMES";

    static RESERVED_NAMES = ["_mouse_", "_stage_", "_edge_", "_myself_", "_random_"];

    static LOCATION_OPTIONS = [PrimProxy.TARGET_NAMES, PrimProxy.RESERVED_NAMES[0], PrimProxy.RESERVED_NAMES[4]];

    static CLONE_OPTIONS = [PrimProxy.TARGET_NAMES, PrimProxy.RESERVED_NAMES[3]];

    static TOUCHING_OPTIONS = [PrimProxy.TARGET_NAMES, PrimProxy.RESERVED_NAMES[0], PrimProxy.RESERVED_NAMES[2]];

    static BACKDROP_NAMES = "BACKDROP_NAMES";

    static COSTUME_NAMES = "COSTUME_NAMES";

    static SOUND_NAMES = "SOUND_NAMES";

    static MESSAGE_NAMES = "MESSAGE_NAMES";

    static ALPHABET = Array.from(Array(26))
        .map((e, i) => i + 65)
        .map((x) => String.fromCharCode(x));

    static KEYS = ["space", "left arrow", "right arrow", "up arrow", "down arrow", "any"];

    static KEY_DOWN_OPTIONS = PrimProxy.ALPHABET.concat(PrimProxy.KEYS);

    static DEFAULT_X = 0;

    static DEFAULT_Y = 0;

    static DEFAULT_DIRECTION = 90;

    static DEFAULT_SIZE = 100;

    static DEFAULT_VOLUME = 100;

    static DEFAULT_LAYER = "front";

    static DEFAULT_EFFECT = 0;

    static DEFAULT_CHANGE = 25;

    static DEFAULT_SECONDS = 1;

    static DEFAULT_MESSAGE = "Hello!";

    static DEFAULT_QUESTION = "How are you?";

    static DEFAULT_STEPS = 10;

    static patchApi = {
        move: {
            opcode: "motion_movesteps",
            parameters: ["steps"],
            exampleParameters: { steps: PrimProxy.DEFAULT_STEPS },
        },
        goToXY: {
            opcode: "motion_gotoxy",
            parameters: ["x", "y"],
            exampleParameters: { x: PrimProxy.DEFAULT_X, y: PrimProxy.DEFAULT_Y },
        },
        goTo: {
            opcode: "motion_goto",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.LOCATION_OPTIONS },
        },
        turnRight: {
            opcode: "motion_turnright",
            parameters: ["degrees"],
            exampleParameters: { degrees: PrimProxy.DEFAULT_DIRECTION },
        },
        turnLeft: {
            opcode: "motion_turnleft",
            parameters: ["degrees"],
            exampleParameters: { degrees: PrimProxy.DEFAULT_DIRECTION },
        },
        pointInDirection: {
            opcode: "motion_pointindirection",
            parameters: ["degrees"],
            exampleParameters: { degrees: PrimProxy.DEFAULT_DIRECTION },
        },
        pointTowards: {
            opcode: "motion_pointtowards",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.LOCATION_OPTIONS },
        },
        glide: {
            opcode: "motion_glidesecstoxy",
            parameters: ["seconds", "x", "y"],
            exampleParameters: { seconds: PrimProxy.DEFAULT_SECONDS, x: PrimProxy.DEFAULT_X, y: PrimProxy.DEFAULT_Y },
        },
        glideTo: {
            opcode: "motion_glideto",
            parameters: ["seconds", "name"],
            exampleParameters: { seconds: PrimProxy.DEFAULT_SECONDS, name: PrimProxy.LOCATION_OPTIONS },
        },
        ifOnEdgeBounce: {
            opcode: "motion_ifonedgebounce",
            parameters: [],
            exampleParameters: {},
        },
        setRotationStyle: {
            opcode: "motion_setrotationstyle",
            parameters: ["style"],
            exampleParameters: { style: Scratch3MotionBlocks.ROTATION_STYLES },
        },
        changeX: {
            opcode: "motion_changexby",
            parameters: ["x"],
            exampleParameters: { x: PrimProxy.DEFAULT_CHANGE },
        },
        setX: {
            opcode: "motion_setx",
            parameters: ["x"],
            exampleParameters: { x: PrimProxy.DEFAULT_X },
        },
        changeY: {
            opcode: "motion_changeyby",
            parameters: ["y"],
            exampleParameters: { y: PrimProxy.DEFAULT_CHANGE },
        },
        setY: {
            opcode: "motion_sety",
            parameters: ["y"],
            exampleParameters: { y: PrimProxy.DEFAULT_Y },
        },
        getX: {
            opcode: "motion_xposition",
            parameters: [],
            exampleParameters: {},
        },
        getY: {
            opcode: "motion_yposition",
            parameters: [],
            exampleParameters: {},
        },
        getDirection: {
            opcode: "motion_direction",
            parameters: [],
            exampleParameters: {},
        },

        say: {
            opcode: "looks_say",
            parameters: ["message"],
            exampleParameters: { message: PrimProxy.DEFAULT_MESSAGE },
        },
        sayFor: {
            opcode: "looks_sayforsecs",
            parameters: ["message", "secs"],
            exampleParameters: { message: PrimProxy.DEFAULT_MESSAGE },
        },
        think: {
            opcode: "looks_think",
            parameters: ["message"],
            exampleParameters: { message: PrimProxy.DEFAULT_MESSAGE },
        },
        thinkFor: {
            opcode: "looks_thinkforsecs",
            parameters: ["message", "secs"],
            exampleParameters: { message: PrimProxy.DEFAULT_MESSAGE },
        },
        show: {
            opcode: "looks_show",
            parameters: [],
            exampleParameters: {},
        },
        hide: {
            opcode: "looks_hide",
            parameters: [],
            exampleParameters: {},
        },
        setCostumeTo: {
            opcode: "looks_switchcostumeto",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.COSTUME_NAMES },
        },
        setBackdropTo: {
            opcode: "looks_switchbackdropto",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.BACKDROP_NAMES },
        },
        setBackdropToAndWait: {
            opcode: "looks_switchbackdroptoandwait",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.BACKDROP_NAMES },
        },
        nextCostume: {
            opcode: "looks_nextcostume",
            parameters: [],
            exampleParameters: {},
        },
        nextBackdrop: {
            opcode: "looks_nextbackdrop",
            parameters: [],
            exampleParameters: {},
        },
        changeGraphicEffectBy: {
            opcode: "looks_changeeffectby",
            parameters: ["effect", "change"],
            exampleParameters: { effect: Scratch3LooksBlocks.EFFECT_LIST, change: PrimProxy.DEFAULT_CHANGE },
        },
        setGraphicEffectTo: {
            opcode: "looks_seteffectto",
            parameters: ["effect", "value"],
            exampleParameters: { effect: Scratch3LooksBlocks.EFFECT_LIST, value: PrimProxy.DEFAULT_EFFECT },
        },
        clearGraphicEffects: {
            opcode: "looks_cleargraphiceffects",
            parameters: [],
            exampleParameters: {},
        },
        changeSizeBy: {
            opcode: "looks_changesizeby",
            parameters: ["change"],
            exampleParameters: { change: PrimProxy.DEFAULT_CHANGE },
        },
        setSizeTo: {
            opcode: "looks_setsizeto",
            parameters: ["size"],
            exampleParameters: { size: PrimProxy.DEFAULT_SIZE },
        },
        setLayerTo: {
            opcode: "looks_gotofrontback",
            parameters: ["layer"],
            exampleParameters: { layer: ["front", "back"] },
        },
        changeLayerBy: {
            opcode: "looks_goforwardbackwardlayers",
            parameters: ["direction", "change"],
            exampleParameters: { direction: "forward", change: 1 },
        },
        getSize: {
            opcode: "looks_size",
            parameters: [],
            exampleParameters: {},
        },
        getCostume: {
            opcode: "looks_costumenumbername",
            parameters: [],
            exampleParameters: {},
        },
        getBackdrop: {
            opcode: "looks_backdropnumbername",
            parameters: [],
            exampleParameters: {},
        },

        playSound: {
            opcode: "sound_play",
            parameters: ["soundName"],
            exampleParameters: { soundName: PrimProxy.SOUND_NAMES },
        },
        playSoundUntilDone: {
            opcode: "sound_playuntildone",
            parameters: ["sound name"],
            exampleParameters: { soundName: PrimProxy.SOUND_NAMES },
        },
        stopAllSounds: {
            opcode: "sound_stopallsounds",
            parameters: [],
            exampleParameters: {},
        },
        setSoundEffectTo: {
            opcode: "sound_seteffectto",
            parameters: ["effect", "value"],
            exampleParameters: { effect: Scratch3SoundBlocks.EFFECT_LIST, value: PrimProxy.DEFAULT_EFFECT },
        },
        changeSoundEffectBy: {
            opcode: "sound_changeeffectby",
            parameters: ["effect", "change"],
            exampleParameters: { effect: Scratch3SoundBlocks.EFFECT_LIST, change: PrimProxy.DEFAULT_CHANGE },
        },
        clearSoundEffects: {
            opcode: "sound_cleareffects",
            parameters: [],
            exampleParameters: {},
        },
        setVolumeTo: {
            opcode: "sound_setvolumeto",
            parameters: ["volume"],
            exampleParameters: { volume: PrimProxy.DEFAULT_VOLUME },
        },
        changeVolumeBy: {
            opcode: "sound_changevolumeby",
            parameters: ["change"],
            exampleParameters: { change: PrimProxy.DEFAULT_CHANGE },
        },
        getVolume: {
            opcode: "sound_volume",
            parameters: [],
            exampleParameters: {},
        },

        broadcast: {
            opcode: "event_broadcast",
            parameters: ["message"],
            exampleParameters: { message: PrimProxy.MESSAGE_NAMES },
        },
        broadcastAndWait: {
            opcode: "event_broadcastandwait",
            parameters: ["message"],
            exampleParameters: { message: PrimProxy.MESSAGE_NAMES },
        },

        isTouching: {
            opcode: "sensing_touchingobject",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.TOUCHING_OPTIONS },
        },
        isTouchingColor: {
            opcode: "sensing_touchingcolor",
            parameters: ["color"],
            exampleParameters: { color: PrimProxy.DEFAULT_EFFECT },
        },
        isColorTouchingColor: {
            opcode: "sensing_coloristouchingcolor",
            parameters: ["color1", "color2"],
            exampleParameters: { color1: PrimProxy.DEFAULT_EFFECT, color2: PrimProxy.DEFAULT_EFFECT },
        },
        distanceTo: {
            opcode: "sensing_distanceto",
            parameters: ["name"],
            exampleParameters: { name: PrimProxy.LOCATION_OPTIONS },
        },
        getTimer: {
            opcode: "sensing_timer",
            parameters: [],
            exampleParameters: {},
        },
        resetTimer: {
            opcode: "sensing_resettimer",
            parameters: [],
            exampleParameters: {},
        },
        getAttributeOf: {
            opcode: "sensing_of",
            parameters: ["object", "property"],
            exampleParameters: { object: PrimProxy.TARGET_NAMES, property: "x position" },
        },
        getMouseX: {
            opcode: "sensing_mousex",
            parameters: [],
            exampleParameters: {},
        },
        getMouseY: {
            opcode: "sensing_mousey",
            parameters: [],
            exampleParameters: {},
        },
        isMouseDown: {
            opcode: "sensing_mousedown",
            parameters: [],
            exampleParameters: {},
        },
        // setDragMode: {
        //     opcode: "sensing_setdragmode",
        //     parameters: ["degrees"],
        // },
        isKeyPressed: {
            opcode: "sensing_keypressed",
            parameters: ["key"],
            exampleParameters: { key: PrimProxy.KEY_DOWN_OPTIONS },
        },
        current: {
            opcode: "sensing_current",
            parameters: ["timeIncrement"],
            exampleParameters: { timeIncrement: Scratch3SensingBlocks.CURRENT_INCREMENT_OPTIONS },
        },
        daysSince2000: {
            opcode: "sensing_dayssince2000",
            parameters: [],
            exampleParameters: {},
        },
        getLoudness: {
            opcode: "sensing_loudness",
            parameters: [],
            exampleParameters: {},
        },
        getUsername: {
            opcode: "sensing_username",
            parameters: [],
            exampleParameters: {},
        },
        ask: {
            opcode: "sensing_askandwait",
            parameters: ["question"],
            exampleParameters: { question: PrimProxy.DEFAULT_QUESTION },
        },
        // getAnswer: {
        // opcode: "sensing_answer"
        // },

        wait: {
            opcode: "control_wait",
            parameters: ["seconds"],
            exampleParameters: { seconds: PrimProxy.DEFAULT_SECONDS },
        },
        // waitUntil: {
        //     opcode: "control_wait_until",
        //     parameters: ["condition"],
        // },
        stop: {
            opcode: "control_stop",
            parameters: ["option"],
            exampleParameters: { option: Scratch3ControlBlocks.STOP_OPTIONS },
        },
        createClone: {
            opcode: "control_create_clone_of",
            parameters: ["option"],
            exampleParameters: { option: PrimProxy.CLONE_OPTIONS },
        },
        deleteClone: {
            opcode: "control_delete_this_clone",
            parameters: [],
            exampleParameters: {},
        },

        erasePen: {
            opcode: "pen_clear",
            parameters: [],
            exampleParameters: {},
        },
        stampPen: {
            opcode: "pen_stamp",
            parameters: [],
            exampleParameters: {},
        },
        penDown: {
            opcode: "pen_pendown",
            parameters: [],
            exampleParameters: {},
        },
        penUp: {
            opcode: "pen_penup",
            parameters: [],
            exampleParameters: {},
        },
        setPenColor: {
            opcode: "pen_setpencolortocolor",
            parameters: ["color"],
            exampleParameters: { color: PrimProxy.DEFAULT_EFFECT },
        },
        changePenEffect: {
            opcode: "pen_changepencolorparamby",
            parameters: ["effect", "change"],
            exampleParameters: { effect: Scratch3PenBlocks.PEN_EFFECT_LIST, change: PrimProxy.DEFAULT_CHANGE },
        },
        setPenEffect: {
            opcode: "pen_setpencolorparamto",
            parameters: ["effect", "value"],
            exampleParameters: { effect: Scratch3PenBlocks.PEN_EFFECT_LIST, value: PrimProxy.DEFAULT_EFFECT },
        },
        changePenSize: {
            opcode: "pen_changepensizeby",
            parameters: ["change"],
            exampleParameters: { change: PrimProxy.DEFAULT_CHANGE },
        },
        setPenSize: {
            opcode: "pen_setpensizeto",
            parameters: ["size"],
            exampleParameters: { size: PrimProxy.DEFAULT_SIZE },
        },

        endThread: {
            opcode: "core_endthread",
            parameters: [],
            exampleParameters: {},
        },

        fetch: {
            opcode: "core_fetch",
            parameters: ["url", "method", "headers", "body"],
            exampleParameters: {
                url: "https://api.scratch.mit.edu",
                method: "GET",
                headers: "",
                body: "",
            },
        }
    };

    static interruptMap = {};

    constructor(threadId, interruptFunction, postFunction) {
        this.threadId = threadId;
        this.post = async (opCode, args) => {
            const retVal = await postFunction(this.threadId, opCode, args);
            if (retVal.id === "InterruptThread") {
                interruptFunction();
                return null;
            }
            if (retVal.id === "ResultValue") {
                return retVal.result;
            }
            return null;
        };
    }

    static getPrimNames() {
        return Object.keys(PrimProxy.patchApi);
    }

    static fillDynamicOptions(parameterOptions, vm) {
        const dynamicOptions = [];
        parameterOptions.forEach((option) => {
            if (option === PrimProxy.TARGET_NAMES) {
                const targets = vm.getAllRenderedTargets().filter((target) => !target.isStage);
                const targetNames = targets.map((target) => target.getName());
                dynamicOptions.push(...targetNames);
            } else if (option === PrimProxy.BACKDROP_NAMES) {
                const backdropNames = vm.runtime.getTargetForStage().sprite.costumes.map((costume) => costume.name);
                dynamicOptions.push(...backdropNames);
            } else if (option === PrimProxy.COSTUME_NAMES) {
                const costumeNames = vm.editingTarget.sprite.costumes.map((costume) => costume.name);
                dynamicOptions.push(...costumeNames);
            } else if (option === PrimProxy.SOUND_NAMES) {
                const soundNames = vm.editingTarget.getSounds().map((sound) => sound.name);
                dynamicOptions.push(...soundNames);
            } else if (option === PrimProxy.MESSAGE_NAMES) {
                const broadcastMessages = vm.getAllBroadcastMessages();
                dynamicOptions.push(...broadcastMessages);
            } else {
                dynamicOptions.push(option);
            }
        });
        return dynamicOptions;
    }

    static getDynamicFunctionInfo(functionName, vm) {
        const functionInfo = _.cloneDeep(PrimProxy.patchApi[functionName]);
        if (!functionInfo) {
            console.warn(`Function ${functionName} not found`);
        }
        functionInfo.parameters.forEach((param) => {
            let parameterOptions = functionInfo.exampleParameters[param];
            // Check if parameterOptions is a list
            if (Array.isArray(parameterOptions)) {
                parameterOptions = PrimProxy.fillDynamicOptions(parameterOptions, vm);
            } else if (typeof parameterOptions === "string") {
                parameterOptions = `'${parameterOptions}'`;
            }
            functionInfo.exampleParameters[param] = parameterOptions;
        });
        return functionInfo;
    }

    async move(steps) {
        await this.post(PrimProxy.patchApi.move.opcode, { STEPS: steps });
    }

    async goToXY(x, y) {
        await this.post(PrimProxy.patchApi.goToXY.opcode, { X: x, Y: y });
    }

    async goTo(targetName) {
        await this.post(PrimProxy.patchApi.goTo.opcode, { TO: targetName });
    }

    async turnRight(degrees) {
        await this.post(PrimProxy.patchApi.turnRight.opcode, { DEGREES: degrees });
    }

    async turnLeft(degrees) {
        await this.post(PrimProxy.patchApi.turnLeft.opcode, { DEGREES: degrees });
    }

    async pointInDirection(degrees) {
        await this.post(PrimProxy.patchApi.pointInDirection.opcode, { DIRECTION: degrees });
    }

    async pointTowards(targetName) {
        await this.post(PrimProxy.patchApi.pointTowards.opcode, { TOWARDS: targetName });
    }

    async glide(seconds, x, y) {
        await this.post(PrimProxy.patchApi.glide.opcode, { SECS: seconds, X: x, Y: y });
    }

    async glideTo(seconds, targetName) {
        await this.post(PrimProxy.patchApi.glideTo.opcode, {
            SECS: seconds,
            TO: targetName,
        });
    }

    async ifOnEdgeBounce() {
        await this.post(PrimProxy.patchApi.ifOnEdgeBounce.opcode, {});
    }

    async setRotationStyle(style) {
        await this.post(PrimProxy.patchApi.setRotationStyle.opcode, { STYLE: style });
    }

    async changeX(deltaX) {
        await this.post(PrimProxy.patchApi.changeX.opcode, { DX: deltaX });
    }

    async setX(x) {
        await this.post(PrimProxy.patchApi.setX.opcode, { X: x });
    }

    async changeY(deltaY) {
        await this.post(PrimProxy.patchApi.changeY.opcode, { DY: deltaY });
    }

    async setY(y) {
        await this.post(PrimProxy.patchApi.setY.opcode, { Y: y });
    }

    async getX() {
        const x = await this.post(PrimProxy.patchApi.getX.opcode, {});
        return x;
    }

    async getY() {
        const y = await this.post(PrimProxy.patchApi.getY.opcode, {});
        return y;
    }

    async getDirection() {
        const direction = await this.post(PrimProxy.patchApi.getDirection.opcode, {});
        return direction;
    }

    async say(message) {
        await this.post(PrimProxy.patchApi.say.opcode, { MESSAGE: message });
    }

    async sayFor(message, secs) {
        await this.post(PrimProxy.patchApi.sayFor.opcode, { MESSAGE: message, SECS: secs });
    }

    async think(message) {
        await this.post(PrimProxy.patchApi.think.opcode, { MESSAGE: message });
    }

    async thinkFor(message, secs) {
        await this.post(PrimProxy.patchApi.thinkFor.opcode, {
            MESSAGE: message,
            SECS: secs,
        });
    }

    async show() {
        await this.post(PrimProxy.patchApi.show.opcode, {});
    }

    async hide() {
        await this.post(PrimProxy.patchApi.hide.opcode, {});
    }

    async setCostumeTo(costume) {
        await this.post(PrimProxy.patchApi.setCostumeTo.opcode, { COSTUME: costume });
    }

    async setBackdropTo(backdrop) {
        await this.post(PrimProxy.patchApi.setBackdropTo.opcode, { BACKDROP: backdrop });
    }

    async setBackdropToAndWait(backdrop) {
        await this.post(PrimProxy.patchApi.setBackdropToAndWait.opcode, {
            BACKDROP: backdrop,
        });
    }

    async nextCostume() {
        await this.post(PrimProxy.patchApi.nextCostume.opcode, {});
    }

    async nextBackdrop() {
        await this.post(PrimProxy.patchApi.nextBackdrop.opcode, {});
    }

    async changeGraphicEffectBy(effect, change) {
        await this.post(PrimProxy.patchApi.changeGraphicEffectBy.opcode, {
            EFFECT: effect,
            CHANGE: change,
        });
    }

    async setGraphicEffectTo(effect, value) {
        await this.post(PrimProxy.patchApi.setGraphicEffectTo.opcode, {
            EFFECT: effect,
            VALUE: value,
        });
    }

    async clearGraphicEffects() {
        await this.post(PrimProxy.patchApi.clearGraphicEffects.opcode, {});
    }

    async changeSizeBy(change) {
        await this.post(PrimProxy.patchApi.changeSizeBy.opcode, { CHANGE: change });
    }

    async setSizeTo(size) {
        await this.post(PrimProxy.patchApi.setSizeTo.opcode, { SIZE: size });
    }

    async setLayerTo(frontBack) {
        await this.post(PrimProxy.patchApi.setLayerTo.opcode, { FRONT_BACK: frontBack });
    }

    async changeLayerBy(num) {
        await this.post(PrimProxy.patchApi.changeLayerBy.opcode, { NUM: num });
    }

    // as above, no tests for async functions
    async getSize() {
        const size = await this.post(this.patchApi.getSize.opcode, {});
        return size;
    }

    async getCostume() {
        const costume = await this.post(this.patchApi.getCostume.opcode, {
            NUMBER_NAME: "name",
        });
        return costume;
    }

    async getBackdrop() {
        const backdrop = await this.post(this.patchApi.getBackdrop.opcode, {
            NUMBER_NAME: "name",
        });
        return backdrop;
    }

    async playSound(soundMenu) {
        await this.post(PrimProxy.patchApi.playSound.opcode, { SOUND_MENU: soundMenu });
    }

    async playSoundUntilDone(soundMenu) {
        await this.post(PrimProxy.patchApi.playSoundUntilDone.opcode, { SOUND_MENU: soundMenu });
    }

    async stopAllSounds() {
        await this.post(PrimProxy.patchApi.stopAllSounds.opcode, {});
    }

    async setSoundEffectTo(effect, value) {
        await this.post(PrimProxy.patchApi.setSoundEffectTo.opcode, { EFFECT: effect, VALUE: value });
    }

    async changeSoundEffectBy(effect, value) {
        await this.post(PrimProxy.patchApi.changeSoundEffectBy.opcode, { EFFECT: effect, VALUE: value });
    }

    async clearSoundEffects() {
        await this.post(PrimProxy.patchApi.clearSoundEffects.opcode, {});
    }

    async setVolumeTo(volume) {
        await this.post(PrimProxy.patchApi.setVolumeTo.opcode, { VOLUME: volume });
    }

    async changeVolumeBy(volume) {
        await this.post(PrimProxy.patchApi.changeVolumeBy.opcode, { VOLUME: volume });
    }

    async getVolume() {
        const volume = await this.post(this.patchApi.getVolume.opcode, {});
        return volume;
    }

    async broadcast(messageName) {
        await this.post(PrimProxy.patchApi.broadcast.opcode, { BROADCAST_OPTION: { id: messageName, name: messageName } });
    }

    async broadcastAndWait(messageName) {
        await this.post(PrimProxy.patchApi.broadcastAndWait.opcode, { BROADCAST_OPTION: { id: messageName, name: messageName } });
    }

    async ask(message) {
        const answer = await this.post(PrimProxy.patchApi.ask.opcode, { QUESTION: message });
        return answer;
    }

    async isTouching(object) {
        const isTouching = await this.post(PrimProxy.patchApi.isTouching.opcode, { TOUCHINGOBJECTMENU: object });
        return isTouching;
    }

    async isTouchingColor(color) {
        const isTouching = await this.post(PrimProxy.patchApi.isTouchingColor.opcode, { COLOR: color });
        return isTouching;
    }

    async isColorTouchingColor(color, color2) {
        const isTouching = await this.post(PrimProxy.patchApi.isColorTouchingColor.opcode, { COLOR: color, COLOR2: color2 });
        return isTouching;
    }

    async distanceTo(object) {
        const distance = await this.post(PrimProxy.patchApi.distanceTo.opcode, { DISTANCETOMENU: object });
        return distance;
    }

    async getTimer() {
        const time = await this.post(PrimProxy.patchApi.getTimer.opcode, {});
        return time;
    }

    resetTimer() {
        this.post(PrimProxy.patchApi.resetTimer.opcode, {});
    }

    async getAttributeOf(object, property) {
        const value = await this.post(PrimProxy.patchApi.getAttributeOf.opcode, { OBJECT: object, PROPERTY: property });
        return value;
    }

    async getMouseX() {
        const mouseX = await this.post(PrimProxy.patchApi.getMouseX.opcode, {});
        return mouseX;
    }

    async getMouseY() {
        const mouseY = await this.post(PrimProxy.patchApi.getMouseY.opcode, {});
        return mouseY;
    }

    async isMouseDown() {
        const mouseDown = await this.post(PrimProxy.patchApi.isMouseDown.opcode, {});
        return mouseDown;
    }

    setDragMode(dragMode) {
        this.post(PrimProxy.patchApi.setDragMode.opcode, { DRAG_MODE: dragMode });
    }

    async isKeyPressed(key) {
        const keyPressed = await this.post(PrimProxy.patchApi.isKeyPressed.opcode, { KEY_OPTION: key });
        return keyPressed;
    }

    async current(timeIncrement) {
        const current = await this.post(PrimProxy.patchApi.current.opcode, { CURRENTMENU: timeIncrement });
        return current;
    }

    async daysSince2000() {
        const days = await this.post(PrimProxy.patchApi.daysSince2000.opcode, {});
        return days;
    }

    async getLoudness() {
        const loudness = await this.post(PrimProxy.patchApi.getLoudness.opcode, {});
        return loudness;
    }

    async getUsername() {
        const username = await this.post(PrimProxy.patchApi.getUsername.opcode, {});
        return username;
    }

    /*
    askAndWait(question) {
        // not returning answer since there's the separate answer bubble
        this.post(PrimProxy.patchApi.askAndWait.opcode, { QUESTION: question });
    }

    async getAnswer() {
        const answer = PrimProxy.post(this.patchApi.getAnswer.opcode, {});
        return answer;
    }
    */

    async wait(seconds) {
        await this.post(PrimProxy.patchApi.wait.opcode, { DURATION: seconds });
    }

    async stop(option) {
        await this.post(PrimProxy.patchApi.stop.opcode, { STOP_OPTION: option });
    }

    async createClone(option) {
        await this.post(PrimProxy.patchApi.createClone.opcode, { CLONE_OPTION: option });
    }

    async deleteClone() {
        await this.post(PrimProxy.patchApi.deleteClone.opcode, {});
    }

    async erasePen() {
        await this.post(PrimProxy.patchApi.erasePen.opcode, {});
    }

    async stampPen() {
        await this.post(PrimProxy.patchApi.stampPen.opcode, {});
    }

    async penDown() {
        await this.post(PrimProxy.patchApi.penDown.opcode, {});
    }

    async penUp() {
        await this.post(PrimProxy.patchApi.penUp.opcode, {});
    }

    async setPenColor(color) {
        await this.post(PrimProxy.patchApi.setPenColor.opcode, { COLOR: color });
    }

    async changePenEffect(effect, change) {
        await this.post(PrimProxy.patchApi.changePenEffect.opcode, { COLOR_PARAM: effect, VALUE: change });
    }

    async setPenEffect(effect, value) {
        await this.post(PrimProxy.patchApi.setPenEffect.opcode, { COLOR_PARAM: effect, VALUE: value });
    }

    async changePenSize(size) {
        await this.post(PrimProxy.patchApi.changePenSize.opcode, { SIZE: size });
    }

    async setPenSize(size) {
        await this.post(PrimProxy.patchApi.setPenSize.opcode, { SIZE: size });
    }

    async fetch(url, method, headers, body) {
        const response = await this.post(PrimProxy.patchApi.fetch.opcode, { URL: url, METHOD: method, HEADERS: headers, BODY: body });
        return response;
    }
}

export default PrimProxy;
