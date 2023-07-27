export default class ConversionLayer {
    static patchApi = {
        // Motion blocks:
        move: {
            opcode: "motion_movesteps",
            parameters: ["STEPS"],
        },
        goToXY: {
            opcode: "motion_gotoxy",
            parameters: ["X", "Y"],
        },
        goTo: {
            opcode: "motion_goto",
            parameters: ["TO"],
        },
        turnRight: {
            opcode: "motion_turnright",
            parameters: ["DEGREES"],
        },
        turnLeft: {
            opcode: "motion_turnleft",
            parameters: ["DEGREES"],
        },
        pointInDirection: {
            opcode: "motion_pointindirection",
            parameters: ["DIRECTION"],
        },
        pointTowards: {
            opcode: "motion_pointtowards",
            parameters: ["TOWARDS"],
        },
        glide: {
            opcode: "motion_glidesecstoxy",
            parameters: ["SECS", "X", "Y"],
        },
        glideTo: {
            opcode: "motion_glideto",
            parameters: ["SECS", "TO"],
        },
        ifOnEdgeBounce: {
            opcode: "motion_ifonedgebounce",
            parameters: [],
        },
        setRotationStyle: {
            opcode: "motion_setrotationstyle",
            parameters: ["STYLE"],
        },
        changeX: {
            opcode: "motion_changexby",
            parameters: ["DX"],
        },
        setX: {
            opcode: "motion_setx",
            parameters: ["X"],
        },
        changeY: {
            opcode: "motion_changeyby",
            parameters: ["DY"],
        },
        setY: {
            opcode: "motion_sety",
            parameters: ["Y"],
        },
        getX: {
            opcode: "motion_xposition",
            parameters: [],
        },
        getY: {
            opcode: "motion_yposition",
            parameters: [],
        },
        getDirection: {
            opcode: "motion_direction",
            parameters: [],
        },
        goToMenu: {
            opcode: "motion_goto_menu",
            parameters: ["TO"],
            returnParametersInstead: ["TO"],
        },
        glideToMenu: {
            opcode: "motion_glideto_menu",
            parameters: ["TO"],
            returnParametersInstead: ["TO"],
        },
        pointTowardsMenu: {
            opcode: "motion_pointtowards_menu",
            parameters: ["TOWARDS"],
            returnParametersInstead: ["TOWARDS"],
        },

        // Looks blocks:
        say: {
            opcode: "looks_say",
            parameters: ["MESSAGE"],
        },
        sayFor: {
            opcode: "looks_sayforsecs",
            parameters: ["MESSAGE", "SECS"],
        },
        think: {
            opcode: "looks_think",
            parameters: ["MESSAGE"],
        },
        thinkFor: {
            opcode: "looks_thinkforsecs",
            parameters: ["MESSAGE", "SECS"],
        },
        show: {
            opcode: "looks_show",
            parameters: [],
        },
        hide: {
            opcode: "looks_hide",
            parameters: [],
        },
        setCostumeTo: {
            opcode: "looks_switchcostumeto",
            parameters: ["COSTUME"],
        },
        setBackdropTo: {
            opcode: "looks_switchbackdropto",
            parameters: ["BACKDROP"],
        },
        setBackdropToAndWait: {
            opcode: "looks_switchbackdroptoandwait",
            parameters: ["BACKDROP"],
        },
        nextCostume: {
            opcode: "looks_nextcostume",
            parameters: [],
        },
        nextBackdrop: {
            opcode: "looks_nextbackdrop",
            parameters: [],
        },
        changeGraphicEffectBy: {
            opcode: "looks_changeeffectby",
            parameters: ["EFFECT", "CHANGE"],
        },
        setGraphicEffectTo: {
            opcode: "looks_seteffectto",
            parameters: ["EFFECT", "VALUE"],
        },
        clearGraphicEffects: {
            opcode: "looks_cleargraphiceffects",
            parameters: [],
        },
        changeSizeBy: {
            opcode: "looks_changesizeby",
            parameters: ["CHANGE"],
        },
        setSizeTo: {
            opcode: "looks_setsizeto",
            parameters: ["SIZE"],
        },
        setLayerTo: {
            opcode: "looks_gotofrontback",
            parameters: ["FRONT_BACK"],
        },
        changeLayerBy: {
            opcode: "looks_goforwardbackwardlayers",
            parameters: ["FORWARD_BACKWARD", "NUM"],
        },
        getSize: {
            opcode: "looks_size",
            parameters: [],
        },
        getCostume: {
            opcode: "looks_costumenumbername",
            parameters: [],
        },
        getBackdrop: {
            opcode: "looks_backdropnumbername",
            parameters: [],
        },
        costume: {
            opcode: "looks_costume",
            parameters: ["COSTUME"],
            returnParametersInstead: ["COSTUME"],
        },
        backdrops: {
            opcode: "looks_backdrops",
            parameters: ["BACKDROP"],
            returnParametersInstead: ["BACKDROP"],
        },

        // Sound blocks:
        playSound: {
            opcode: "sound_play",
            parameters: ["SOUND_MENU"],
        },
        playSoundUntilDone: {
            opcode: "sound_playuntildone",
            parameters: ["SOUND_MENU"],
        },
        stopAllSounds: {
            opcode: "sound_stopallsounds",
            parameters: [],
        },
        setSoundEffectTo: {
            opcode: "sound_seteffectto",
            parameters: ["EFFECT", "VALUE"],
        },
        changeSoundEffectBy: {
            opcode: "sound_changeeffectby",
            parameters: ["EFFECT", "VALUE"],
        },
        clearSoundEffects: {
            opcode: "sound_cleareffects",
            parameters: [],
        },
        setVolumeTo: {
            opcode: "sound_setvolumeto",
            parameters: ["VOLUME"],
        },
        changeVolumeBy: {
            opcode: "sound_changevolumeby",
            parameters: ["VOLUME"],
        },
        getVolume: {
            opcode: "sound_volume",
            parameters: [],
        },
        soundsMenu: {
            opcode: "sound_sounds_menu",
            parameters: ["SOUND_MENU"],
            returnParametersInstead: ["SOUND_MENU"],
        },

        // Broadcast blocks:
        // The way these work in Scratch is that you have to create each broadcast, then it becomes an option in the dropdown
        // on the blocks. However, in Patch, it will just accept any string on both the send and recieve. For this reason,
        // broadcasts are removed from each Scratch target in the conversion from Scratch to Patch.
        broadcast: {
            opcode: "event_broadcast",
            parameters: ["BROADCAST_INPUT"],
        },
        broadcastAndWait: {
            opcode: "event_broadcastandwait",
            parameters: ["BROADCAST_INPUT"],
        },

        // Sensing blocks:
        isTouching: {
            opcode: "sensing_touchingobject",
            parameters: ["TOUCHINGOBJECTMENU"],
        },
        isTouchingColor: {
            opcode: "sensing_touchingcolor",
            parameters: ["COLOR"],
        },
        isColorTouchingColor: {
            opcode: "sensing_coloristouchingcolor",
            parameters: ["COLOR", "COLOR2"],
        },
        distanceTo: {
            opcode: "sensing_distanceto",
            parameters: ["DISTANCETOMENU"],
        },
        getTimer: {
            opcode: "sensing_timer",
            parameters: [],
        },
        resetTimer: {
            opcode: "sensing_resettimer",
            parameters: [],
        },
        getAttributeOf: {
            opcode: "sensing_of",
            parameters: ["OBJECT", "PROPERTY"],
        },
        getMouseX: {
            opcode: "sensing_mousex",
            parameters: [],
        },
        getMouseY: {
            opcode: "sensing_mousey",
            parameters: [],
        },
        isMouseDown: {
            opcode: "sensing_mousedown",
            parameters: [],
        },
        // setDragMode: {
        //     opcode: "sensing_setdragmode",
        //     parameters: ["degrees"],
        // },
        isKeyPressed: {
            opcode: "sensing_keypressed",
            parameters: ["KEY_OPTION"],
        },
        current: {
            opcode: "sensing_current",
            parameters: ["CURRENTMENU"],
        },
        daysSince2000: {
            opcode: "sensing_dayssince2000",
            parameters: [],
        },
        getLoudness: {
            opcode: "sensing_loudness",
            parameters: [],
        },
        getUsername: {
            opcode: "sensing_username",
            parameters: [],
        },
        ask: {
            opcode: "sensing_askandwait",
            parameters: ["QUESTION"],
        },
        // getAnswer: {
        // opcode: "sensing_answer"
        // },
        getAnswer: {
            opcode: "sensing_answer",
            parameters: [],
            returnInstead: ["_patchAnswer"],
        },
        touchingObjectMenu: {
            opcode: "sensing_touchingobjectmenu",
            parameters: ["TOUCHINGOBJECTMENU"],
            returnParametersInstead: ["TOUCHINGOBJECTMENU"]
        },
        distanceToMenu: {
            opcode: "sensing_distancetomenu",
            parameters: ["DISTANCETOMENU"],
            returnParametersInstead: ["DISTANCETOMENU"]
        },
        keyOptions: {
            opcode: "sensing_keyoptions",
            parameters: ["KEY_OPTION"],
            returnParametersInstead: ["KEY_OPTION"]
        },
        getAttributeOfObjectMenu: {
            opcode: "sensing_of_object_menu",
            parameters: ["OBJECT"],
            returnParametersInstead: ["OBJECT"]
        },

        wait: {
            opcode: "control_wait",
            parameters: ["DURATION"],
        },
        // waitUntil: {
        //     opcode: "control_wait_until",
        //     parameters: ["condition"],
        // },
        stop: {
            opcode: "control_stop",
            parameters: ["STOP_OPTION"],
        },
        createClone: {
            opcode: "control_create_clone_of",
            parameters: ["CLONE_OPTION"],
        },
        deleteClone: {
            opcode: "control_delete_this_clone",
            parameters: [],
        },
        createCloneMenu: {
            opcode: "control_create_clone_of_menu",
            parameters: ["CLONE_OPTION"],
            returnParametersInstead: ["CLONE_OPTION"],
        },

        erasePen: {
            opcode: "pen_clear",
            parameters: [],
        },
        stampPen: {
            opcode: "pen_stamp",
            parameters: [],
        },
        penDown: {
            opcode: "pen_pendown",
            parameters: [],
        },
        penUp: {
            opcode: "pen_penup",
            parameters: [],
        },
        setPenColor: {
            opcode: "pen_setpencolortocolor",
            parameters: ["color"],
        },
        changePenEffect: {
            opcode: "pen_changepencolorparamby",
            parameters: ["effect", "change"],
        },
        setPenEffect: {
            opcode: "pen_setpencolorparamto",
            parameters: ["effect", "value"],
        },
        changePenSize: {
            opcode: "pen_changepensizeby",
            parameters: ["change"],
        },
        setPenSize: {
            opcode: "pen_setpensizeto",
            parameters: ["size"],
        },

        endThread: {
            opcode: "core_endthread",
            parameters: [],
        },
    };
}