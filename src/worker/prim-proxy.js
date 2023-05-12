
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
        playSound: "sound_play",
        playSoundUntilDone: "sound_playuntildone",
        stopAllSounds: "sound_stopallsounds",
        setSoundEffectTo: "sound_seteffectto",
        changeSoundEffectBy: "sound_changeeffectby",
        clearSoundEffects: "sound_cleareffects",
        setVolumeTo: "sound_setvolumeto",
        changeVolumeBy: "sound_changevolumeby",
        getVolume: "sound_volume"
    };
    constructor(targetId, postFunction) {
        this.targetId = targetId;
        this.post = function (opCode, args) {
            postFunction(this.targetId, opCode, args);
        }
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
        this.post(PrimProxy.opcodeMap.glideTo, { SECS: seconds, TO: targetName });
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
        let x = await PrimProxy.post(this.opcodeMap.getX, {});
        return x;
    }

    async getY() {
        let y = PrimProxy.post(this.opcodeMap.getY, {});
        return y;
    }

    async getDirection() {
        let direction = PrimProxy.post(this.opcodeMap.getDirection, {});
        return direction;
    }

    playSound(sound_menu) {
        this.post(PrimProxy.opcodeMap.playSound, { SOUND_MENU: sound_menu });
    }

    playSoundUntilDone(sound_menu) {
        this.post(PrimProxy.opcodeMap.playSoundUntilDone, { SOUND_MENU: sound_menu });
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
        let volume = PrimProxy.post(this.opcodeMap.getVolume, {});
        return volume;
    }
}

export default PrimProxy;