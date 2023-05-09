
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
        switchCostumeTo: "looks_switchcostumeto",
        switchBackdropTo: "looks_switchbackdropto",
        switchBackdropToAndWait: "looks_switchbackdroptoandwait",
        nextCostume: "looks_nextCostume",
        nextBackdrop: "looks_nextBackdrop",
        changeEffectBy: "looks_changeeffectby",
        setEffectTo: "looks_seteffectto",
        clearGraphicEffects: "looks_cleargraphiceffects",
        changeSizeBy: "looks_changesizeby",
        setSizeTo: "looks_setsizeto",
        goToLayer: "looks_gotofrontback",
        changeLayer: "looks_goforwardbackwardlayers",
        getSize: "looks_size"
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
        this.post(PrimProxy.opcodeMap.thinkFor, { MESSAGE: message, SECS: secs });
    }
}

export default PrimProxy;