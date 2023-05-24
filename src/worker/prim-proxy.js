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

        endThread: "core_endthread",
    };

    constructor(threadId, postFunction) {
        this.threadId = threadId;
        this.post = async function (opCode, args) {
            const retVal = await postFunction(this.threadId, opCode, args);
            return retVal;
        };
    }

    static getPrimNames() {
        return Object.keys(PrimProxy.opcodeMap);
    }

    move(steps) {
        this.post(PrimProxy.opcodeMap.move, { STEPS: steps });
    }

    goToXY(x, y) {
        this.post(PrimProxy.opcodeMap.goToXY, { X: x, Y: y });
    }

    goTo(targetName) {
        this.post(PrimProxy.opcodeMap.goTo, { TO: targetName });
    }

    turnRight(degrees) {
        this.post(PrimProxy.opcodeMap.turnRight, { DEGREES: degrees });
    }

    turnLeft(degrees) {
        this.post(PrimProxy.opcodeMap.turnLeft, { DEGREES: degrees });
    }

    pointInDirection(degrees) {
        this.post(PrimProxy.opcodeMap.pointInDirection, { DIRECTION: degrees });
    }

    pointTowards(targetName) {
        this.post(PrimProxy.opcodeMap.pointTowards, { TOWARDS: targetName });
    }

    glide(seconds, x, y) {
        this.post(PrimProxy.opcodeMap.glide, { SECS: seconds, X: x, Y: y });
    }

    glideTo(seconds, targetName) {
        this.post(PrimProxy.opcodeMap.glideTo, {
            SECS: seconds,
            TO: targetName,
        });
    }

    ifOnEdgeBounce() {
        this.post(PrimProxy.opcodeMap.ifOnEdgeBounce, {});
    }

    setRotationStyle(style) {
        this.post(PrimProxy.opcodeMap.setRotationStyle, { STYLE: style });
    }

    changeX(deltaX) {
        this.post(PrimProxy.opcodeMap.changeX, { DX: deltaX });
    }

    setX(x) {
        this.post(PrimProxy.opcodeMap.setX, { X: x });
    }

    changeY(deltaY) {
        this.post(PrimProxy.opcodeMap.changeY, { DY: deltaY });
    }

    setY(y) {
        this.post(PrimProxy.opcodeMap.setY, { Y: y });
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

    say(message) {
        this.post(PrimProxy.opcodeMap.say, { MESSAGE: message });
    }

    sayFor(message, secs) {
        this.post(PrimProxy.opcodeMap.sayFor, { MESSAGE: message, SECS: secs });
    }

    think(message) {
        this.post(PrimProxy.opcodeMap.think, { MESSAGE: message });
    }

    thinkFor(message, secs) {
        this.post(PrimProxy.opcodeMap.thinkFor, {
            MESSAGE: message,
            SECS: secs,
        });
    }

    show() {
        this.post(PrimProxy.opcodeMap.show, {});
    }

    hide() {
        this.post(PrimProxy.opcodeMap.hide, {});
    }

    setCostumeTo(costume) {
        this.post(PrimProxy.opcodeMap.setCostumeTo, { COSTUME: costume });
    }

    setBackdropTo(backdrop) {
        this.post(PrimProxy.opcodeMap.setBackdropTo, { BACKDROP: backdrop });
    }

    setBackdropToAndWait(backdrop) {
        this.post(PrimProxy.opcodeMap.setBackdropToAndWait, {
            BACKDROP: backdrop,
        });
    }

    nextCostume() {
        this.post(PrimProxy.opcodeMap.nextCostume, {});
    }

    nextBackdrop() {
        this.post(PrimProxy.opcodeMap.nextBackdrop, {});
    }

    changeGraphicEffectBy(effect, change) {
        this.post(PrimProxy.opcodeMap.changeGraphicEffectBy, {
            EFFECT: effect,
            CHANGE: change,
        });
    }

    setGraphicEffectTo(effect, value) {
        this.post(PrimProxy.opcodeMap.setGraphicEffectTo, {
            EFFECT: effect,
            VALUE: value,
        });
    }

    clearGraphicEffects() {
        this.post(PrimProxy.opcodeMap.clearGraphicEffects, {});
    }

    changeSizeBy(change) {
        this.post(PrimProxy.opcodeMap.changeSizeBy, { CHANGE: change });
    }

    setSizeTo(size) {
        this.post(PrimProxy.opcodeMap.setSizeTo, { SIZE: size });
    }

    setLayerTo(frontBack) {
        this.post(PrimProxy.opcodeMap.setLayerTo, { FRONT_BACK: frontBack });
    }

    changeLayerBy(num) {
        this.post(PrimProxy.opcodeMap.changeLayerBy, { NUM: num });
    }

    // as above, no tests for async functions
    async getSize() {
        const size = PrimProxy.post(this.opcodeMap.getSize, {});
        return size;
    }

    async getCostume() {
        const costume = await PrimProxy.post(this.opcodeMap.getCostume, {
            NUMBER_NAME: "name",
        });
        return costume;
    }

    async getBackdrop() {
        const backdrop = await PrimProxy.post(this.opcodeMap.getBackdrop, {
            NUMBER_NAME: "name",
        });
        return backdrop;
    }

    playSound(soundMenu) {
        this.post(PrimProxy.opcodeMap.playSound, { SOUND_MENU: soundMenu });
    }

    playSoundUntilDone(soundMenu) {
        this.post(PrimProxy.opcodeMap.playSoundUntilDone, { SOUND_MENU: soundMenu });
    }

    stopAllSounds() {
        this.post(PrimProxy.opcodeMap.stopAllSounds, {});
    }

    setSoundEffectTo(effect, value) {
        this.post(PrimProxy.opcodeMap.setSoundEffectTo, { EFFECT: effect, VALUE: value });
    }

    changeSoundEffectBy(effect, value) {
        this.post(PrimProxy.opcodeMap.changeSoundEffectBy, { EFFECT: effect, VALUE: value });
    }

    clearSoundEffects() {
        this.post(PrimProxy.opcodeMap.clearSoundEffects, {});
    }

    setVolumeTo(volume) {
        this.post(PrimProxy.opcodeMap.setVolumeTo, { VOLUME: volume });
    }

    changeVolumeBy(volume) {
        this.post(PrimProxy.opcodeMap.changeVolumeBy, { VOLUME: volume });
    }

    async getVolume() {
        const volume = PrimProxy.post(this.opcodeMap.getVolume, {});
        return volume;
    }

    broadcast(messageName) {
        this.post(PrimProxy.opcodeMap.broadcast, { BROADCAST_OPTION: { id: messageName, name: messageName } });
    }

    async broadcastAndWait(messageName) {
        await this.post(PrimProxy.opcodeMap.broadcastAndWait, { BROADCAST_OPTION: { id: messageName, name: messageName } });
    }
}

export default PrimProxy;
