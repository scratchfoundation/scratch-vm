import InterruptError from "./errors/interruptError.mjs";

class PrimProxy {
    static opcodeMap = {
        move: "motion_movesteps",
        goToXY: "motion_gotoxy",
        goTo: "motion_goto",
        turnRight: "motion_turnright",
        turnLeft: "motion_turnleft",
        pointInDirection: "motion_pointindirection",
        pointTowards: "motion_pointtowards",
        glide: "motion_glidesecstoxy",
        glideTo: "motion_glideto",
        ifOnEdgeBounce: "motion_ifonedgebounce",
        setRotationStyle: "motion_setrotationstyle",
        changeX: "motion_changexby",
        setX: "motion_setx",
        changeY: "motion_changeyby",
        setY: "motion_sety",
        getX: "motion_xposition",
        getY: "motion_yposition",
        getDirection: "motion_direction",

        say: "looks_say",
        sayFor: "looks_sayforsecs",
        think: "looks_think",
        thinkFor: "looks_thinkforsecs",
        show: "looks_show",
        hide: "looks_hide",
        setCostumeTo: "looks_switchcostumeto",
        setBackdropTo: "looks_switchbackdropto",
        setBackdropToAndWait: "looks_switchbackdroptoandwait",
        nextCostume: "looks_nextcostume",
        nextBackdrop: "looks_nextbackdrop",
        changeGraphicEffectBy: "looks_changeeffectby",
        setGraphicEffectTo: "looks_seteffectto",
        clearGraphicEffects: "looks_cleargraphiceffects",
        changeSizeBy: "looks_changesizeby",
        setSizeTo: "looks_setsizeto",
        setLayerTo: "looks_gotofrontback",
        changeLayerBy: "looks_goforwardbackwardlayers",
        getSize: "looks_size",
        getCostume: "looks_costumenumbername",
        getBackdrop: "looks_backdropnumbername",

        playSound: "sound_play",
        playSoundUntilDone: "sound_playuntildone",
        stopAllSounds: "sound_stopallsounds",
        setSoundEffectTo: "sound_seteffectto",
        changeSoundEffectBy: "sound_changeeffectby",
        clearSoundEffects: "sound_cleareffects",
        setVolumeTo: "sound_setvolumeto",
        changeVolumeBy: "sound_changevolumeby",
        getVolume: "sound_volume",

        broadcast: "event_broadcast",
        broadcastAndWait: "event_broadcastandwait",
        whenTouchingObject: "event_whentouchingobject",
        whenGreaterThan: "event_whengreaterthan",

        isTouching: "sensing_touchingobject",
        isTouchingColor: "sensing_touchingcolor",
        isColorTouchingColor: "sensing_coloristouchingcolor",
        distanceTo: "sensing_distanceto",
        getTimer: "sensing_timer",
        resetTimer: "sensing_resettimer",
        getAttributeOf: "sensing_of",
        getMouseX: "sensing_mousex",
        getMouseY: "sensing_mousey",
        isMouseDown: "sensing_mousedown",
        setDragMode: "sensing_setdragmode",
        isKeyPressed: "sensing_keypressed",
        current: "sensing_current",
        daysSince2000: "sensing_dayssince2000",
        getLoudness: "sensing_loudness",
        getUsername: "sensing_username",
        // askAndWait: "sensing_askandwait",
        // getAnswer: "sensing_answer",

        wait: "control_wait",
        waitUntil: "control_wait_until",
        stop: "control_stop",
        createClone: "control_create_clone_of",
        deleteClone: "control_delete_this_clone",

        endThread: "core_endthread",
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
        return Object.keys(PrimProxy.opcodeMap);
    }

    async move(steps) {
        await this.post(PrimProxy.opcodeMap.move, { STEPS: steps });
    }

    async goToXY(x, y) {
        await this.post(PrimProxy.opcodeMap.goToXY, { X: x, Y: y });
    }

    async goTo(targetName) {
        await this.post(PrimProxy.opcodeMap.goTo, { TO: targetName });
    }

    async turnRight(degrees) {
        await this.post(PrimProxy.opcodeMap.turnRight, { DEGREES: degrees });
    }

    async turnLeft(degrees) {
        await this.post(PrimProxy.opcodeMap.turnLeft, { DEGREES: degrees });
    }

    async pointInDirection(degrees) {
        await this.post(PrimProxy.opcodeMap.pointInDirection, { DIRECTION: degrees });
    }

    async pointTowards(targetName) {
        await this.post(PrimProxy.opcodeMap.pointTowards, { TOWARDS: targetName });
    }

    async glide(seconds, x, y) {
        await this.post(PrimProxy.opcodeMap.glide, { SECS: seconds, X: x, Y: y });
    }

    async glideTo(seconds, targetName) {
        await this.post(PrimProxy.opcodeMap.glideTo, {
            SECS: seconds,
            TO: targetName,
        });
    }

    async ifOnEdgeBounce() {
        await this.post(PrimProxy.opcodeMap.ifOnEdgeBounce, {});
    }

    async setRotationStyle(style) {
        await this.post(PrimProxy.opcodeMap.setRotationStyle, { STYLE: style });
    }

    async changeX(deltaX) {
        await this.post(PrimProxy.opcodeMap.changeX, { DX: deltaX });
    }

    async setX(x) {
        await this.post(PrimProxy.opcodeMap.setX, { X: x });
    }

    async changeY(deltaY) {
        await this.post(PrimProxy.opcodeMap.changeY, { DY: deltaY });
    }

    async setY(y) {
        await this.post(PrimProxy.opcodeMap.setY, { Y: y });
    }

    async getX() {
        const x = await this.post(PrimProxy.opcodeMap.getX, {});
        return x;
    }

    async getY() {
        const y = await this.post(PrimProxy.opcodeMap.getY, {});
        return y;
    }

    async getDirection() {
        const direction = await this.post(PrimProxy.opcodeMap.getDirection, {});
        return direction;
    }

    async say(message) {
        await this.post(PrimProxy.opcodeMap.say, { MESSAGE: message });
    }

    async sayFor(message, secs) {
        await this.post(PrimProxy.opcodeMap.sayFor, { MESSAGE: message, SECS: secs });
    }

    async think(message) {
        await this.post(PrimProxy.opcodeMap.think, { MESSAGE: message });
    }

    async thinkFor(message, secs) {
        await this.post(PrimProxy.opcodeMap.thinkFor, {
            MESSAGE: message,
            SECS: secs,
        });
    }

    async show() {
        await this.post(PrimProxy.opcodeMap.show, {});
    }

    async hide() {
        await this.post(PrimProxy.opcodeMap.hide, {});
    }

    async setCostumeTo(costume) {
        await this.post(PrimProxy.opcodeMap.setCostumeTo, { COSTUME: costume });
    }

    async setBackdropTo(backdrop) {
        await this.post(PrimProxy.opcodeMap.setBackdropTo, { BACKDROP: backdrop });
    }

    async setBackdropToAndWait(backdrop) {
        await this.post(PrimProxy.opcodeMap.setBackdropToAndWait, {
            BACKDROP: backdrop,
        });
    }

    async nextCostume() {
        await this.post(PrimProxy.opcodeMap.nextCostume, {});
    }

    async nextBackdrop() {
        await this.post(PrimProxy.opcodeMap.nextBackdrop, {});
    }

    async changeGraphicEffectBy(effect, change) {
        await this.post(PrimProxy.opcodeMap.changeGraphicEffectBy, {
            EFFECT: effect,
            CHANGE: change,
        });
    }

    async setGraphicEffectTo(effect, value) {
        await this.post(PrimProxy.opcodeMap.setGraphicEffectTo, {
            EFFECT: effect,
            VALUE: value,
        });
    }

    async clearGraphicEffects() {
        await this.post(PrimProxy.opcodeMap.clearGraphicEffects, {});
    }

    async changeSizeBy(change) {
        await this.post(PrimProxy.opcodeMap.changeSizeBy, { CHANGE: change });
    }

    async setSizeTo(size) {
        await this.post(PrimProxy.opcodeMap.setSizeTo, { SIZE: size });
    }

    async setLayerTo(frontBack) {
        await this.post(PrimProxy.opcodeMap.setLayerTo, { FRONT_BACK: frontBack });
    }

    async changeLayerBy(num) {
        await this.post(PrimProxy.opcodeMap.changeLayerBy, { NUM: num });
    }

    // as above, no tests for async functions
    async getSize() {
        const size = await this.post(this.opcodeMap.getSize, {});
        return size;
    }

    async getCostume() {
        const costume = await this.post(this.opcodeMap.getCostume, {
            NUMBER_NAME: "name",
        });
        return costume;
    }

    async getBackdrop() {
        const backdrop = await this.post(this.opcodeMap.getBackdrop, {
            NUMBER_NAME: "name",
        });
        return backdrop;
    }

    async playSound(soundMenu) {
        await this.post(PrimProxy.opcodeMap.playSound, { SOUND_MENU: soundMenu });
    }

    async playSoundUntilDone(soundMenu) {
        await this.post(PrimProxy.opcodeMap.playSoundUntilDone, { SOUND_MENU: soundMenu });
    }

    async stopAllSounds() {
        await this.post(PrimProxy.opcodeMap.stopAllSounds, {});
    }

    async setSoundEffectTo(effect, value) {
        await this.post(PrimProxy.opcodeMap.setSoundEffectTo, { EFFECT: effect, VALUE: value });
    }

    async changeSoundEffectBy(effect, value) {
        await this.post(PrimProxy.opcodeMap.changeSoundEffectBy, { EFFECT: effect, VALUE: value });
    }

    async clearSoundEffects() {
        await this.post(PrimProxy.opcodeMap.clearSoundEffects, {});
    }

    async setVolumeTo(volume) {
        await this.post(PrimProxy.opcodeMap.setVolumeTo, { VOLUME: volume });
    }

    async changeVolumeBy(volume) {
        await this.post(PrimProxy.opcodeMap.changeVolumeBy, { VOLUME: volume });
    }

    async getVolume() {
        const volume = await this.post(this.opcodeMap.getVolume, {});
        return volume;
    }

    async broadcast(messageName) {
        await this.post(PrimProxy.opcodeMap.broadcast, { BROADCAST_OPTION: { id: messageName, name: messageName } });
    }

    async broadcastAndWait(messageName) {
        await this.post(PrimProxy.opcodeMap.broadcastAndWait, { BROADCAST_OPTION: { id: messageName, name: messageName } });
    }

    async isTouching(object) {
        const isTouching = await this.post(PrimProxy.opcodeMap.isTouching, { TOUCHINGOBJECTMENU: object });
        return isTouching;
    }

    async isTouchingColor(color) {
        const isTouching = await this.post(PrimProxy.opcodeMap.isTouchingColor, { COLOR: color });
        return isTouching;
    }

    async isColorTouchingColor(color, color2) {
        const isTouching = await this.post(PrimProxy.opcodeMap.isColorTouchingColor, { COLOR: color, COLOR2: color2 });
        return isTouching;
    }

    async distanceTo(object) {
        const distance = await this.post(PrimProxy.opcodeMap.distanceTo, { DISTANCETOMENU: object });
        return distance;
    }

    async getTimer() {
        const time = await this.post(PrimProxy.opcodeMap.getTimer, {});
        return time;
    }

    resetTimer() {
        this.post(PrimProxy.opcodeMap.resetTimer, {});
    }

    async getAttributeOf(object, property) {
        const value = await this.post(PrimProxy.opcodeMap.getAttributeOf, { OBJECT: object, PROPERTY: property });
        return value;
    }

    async getMouseX() {
        const mouseX = await this.post(PrimProxy.opcodeMap.getMouseX, {});
        return mouseX;
    }

    async getMouseY() {
        const mouseY = await this.post(PrimProxy.opcodeMap.getMouseY, {});
        return mouseY;
    }

    async isMouseDown() {
        const mouseDown = await this.post(PrimProxy.opcodeMap.isMouseDown, {});
        return mouseDown;
    }

    setDragMode(dragMode) {
        this.post(PrimProxy.opcodeMap.setDragMode, { DRAG_MODE: dragMode });
    }

    async isKeyPressed(key) {
        const keyPressed = await this.post(PrimProxy.opcodeMap.isKeyPressed, { KEY_OPTION: key });
        return keyPressed;
    }

    async current(timeIncrement) {
        const current = await this.post(PrimProxy.opcodeMap.current, { CURRENTMENU: timeIncrement });
        return current;
    }

    async daysSince2000() {
        const days = await this.post(PrimProxy.opcodeMap.daysSince2000, {});
        return days;
    }

    async getLoudness() {
        const loudness = await this.post(PrimProxy.opcodeMap.getLoudness, {});
        return loudness;
    }

    async getUsername() {
        const username = await this.post(PrimProxy.opcodeMap.getUsername, {});
        return username;
    }

    /*
    askAndWait(question) {
        // not returning answer since there's the separate answer bubble
        this.post(PrimProxy.opcodeMap.askAndWait, { QUESTION: question });
    }

    async getAnswer() {
        const answer = PrimProxy.post(this.opcodeMap.getAnswer, {});
        return answer;
    }
    */

    async stop(option) {
        await this.post(PrimProxy.opcodeMap.stop, { STOP_OPTION: option });
    }

    async createClone(option) {
        await this.post(PrimProxy.opcodeMap.createClone, { CLONE_OPTION: option });
    }

    async deleteClone() {
        await this.post(PrimProxy.opcodeMap.deleteClone, {});
    }
}

export default PrimProxy;
