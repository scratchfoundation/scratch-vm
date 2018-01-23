/**
 * @fileoverview
 * The specMap below handles a few pieces of "translation" work between
 * the SB2 JSON format and the data we need to run a project
 * in the Scratch 3.0 VM.
 * Notably:
 *  - Map 2.0 and 1.4 opcodes (forward:) into 3.0-format (motion_movesteps).
 *  - Map ordered, unnamed args to unordered, named inputs and fields.
 * Keep this up-to-date as 3.0 blocks are renamed, changed, etc.
 * Originally this was generated largely by a hand-guided scripting process.
 * The relevant data lives here:
 * https://github.com/LLK/scratch-flash/blob/master/src/Specs.as
 * (for the old opcode and argument order).
 * and here:
 * https://github.com/LLK/scratch-blocks/tree/develop/blocks_vertical
 * (for the new opcodes and argument names).
 * and here:
 * https://github.com/LLK/scratch-blocks/blob/develop/tests/
 * (for the shadow blocks created for each block).
 * I started with the `commands` array in Specs.as, and discarded irrelevant
 * properties. By hand, I matched the opcode name to the 3.0 opcode.
 * Finally, I filled in the expected arguments as below.
 */

const Variable = require('../engine/variable');

/**
 * @typedef {object} SB2SpecMap_blockInfo
 * @property {string} opcode - the Scratch 3.0 block opcode. Use 'extensionID.opcode' for extension opcodes.
 * @property {Array.<SB2SpecMap_argInfo>} argMap - metadata for this block's arguments.
 */

/**
 * @typedef {object} SB2SpecMap_argInfo
 * @property {string} type - the type of this arg (such as 'input' or 'field')
 * @property {string} inputOp - the scratch-blocks shadow type for this arg
 * @property {string} inputName - the name this argument will take when provided to the block implementation
 */

/**
 * Mapping of Scratch 2.0 opcode to Scratch 3.0 block metadata.
 * @type {object.<SB2SpecMap_blockInfo>}
 */
const specMap = {
    'forward:': {
        opcode: 'motion_movesteps',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'STEPS'
            }
        ]
    },
    'turnRight:': {
        opcode: 'motion_turnright',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DEGREES'
            }
        ]
    },
    'turnLeft:': {
        opcode: 'motion_turnleft',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DEGREES'
            }
        ]
    },
    'heading:': {
        opcode: 'motion_pointindirection',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_angle',
                inputName: 'DIRECTION'
            }
        ]
    },
    'pointTowards:': {
        opcode: 'motion_pointtowards',
        argMap: [
            {
                type: 'input',
                inputOp: 'motion_pointtowards_menu',
                inputName: 'TOWARDS'
            }
        ]
    },
    'gotoX:y:': {
        opcode: 'motion_gotoxy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'X'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'Y'
            }
        ]
    },
    'gotoSpriteOrMouse:': {
        opcode: 'motion_goto',
        argMap: [
            {
                type: 'input',
                inputOp: 'motion_goto_menu',
                inputName: 'TO'
            }
        ]
    },
    'glideSecs:toX:y:elapsed:from:': {
        opcode: 'motion_glidesecstoxy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SECS'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'X'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'Y'
            }
        ]
    },
    'changeXposBy:': {
        opcode: 'motion_changexby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DX'
            }
        ]
    },
    'xpos:': {
        opcode: 'motion_setx',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'X'
            }
        ]
    },
    'changeYposBy:': {
        opcode: 'motion_changeyby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DY'
            }
        ]
    },
    'ypos:': {
        opcode: 'motion_sety',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'Y'
            }
        ]
    },
    'bounceOffEdge': {
        opcode: 'motion_ifonedgebounce',
        argMap: [
        ]
    },
    'setRotationStyle': {
        opcode: 'motion_setrotationstyle',
        argMap: [
            {
                type: 'field',
                fieldName: 'STYLE'
            }
        ]
    },
    'xpos': {
        opcode: 'motion_xposition',
        argMap: [
        ]
    },
    'ypos': {
        opcode: 'motion_yposition',
        argMap: [
        ]
    },
    'heading': {
        opcode: 'motion_direction',
        argMap: [
        ]
    },
    'say:duration:elapsed:from:': {
        opcode: 'looks_sayforsecs',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SECS'
            }
        ]
    },
    'say:': {
        opcode: 'looks_say',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE'
            }
        ]
    },
    'think:duration:elapsed:from:': {
        opcode: 'looks_thinkforsecs',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SECS'
            }
        ]
    },
    'think:': {
        opcode: 'looks_think',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'MESSAGE'
            }
        ]
    },
    'show': {
        opcode: 'looks_show',
        argMap: [
        ]
    },
    'hide': {
        opcode: 'looks_hide',
        argMap: [
        ]
    },
    'lookLike:': {
        opcode: 'looks_switchcostumeto',
        argMap: [
            {
                type: 'input',
                inputOp: 'looks_costume',
                inputName: 'COSTUME'
            }
        ]
    },
    'nextCostume': {
        opcode: 'looks_nextcostume',
        argMap: [
        ]
    },
    'startScene': {
        opcode: 'looks_switchbackdropto',
        argMap: [
            {
                type: 'input',
                inputOp: 'looks_backdrops',
                inputName: 'BACKDROP'
            }
        ]
    },
    'changeGraphicEffect:by:': {
        opcode: 'looks_changeeffectby',
        argMap: [
            {
                type: 'field',
                fieldName: 'EFFECT'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'CHANGE'
            }
        ]
    },
    'setGraphicEffect:to:': {
        opcode: 'looks_seteffectto',
        argMap: [
            {
                type: 'field',
                fieldName: 'EFFECT'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VALUE'
            }
        ]
    },
    'filterReset': {
        opcode: 'looks_cleargraphiceffects',
        argMap: [
        ]
    },
    'changeSizeBy:': {
        opcode: 'looks_changesizeby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'CHANGE'
            }
        ]
    },
    'setSizeTo:': {
        opcode: 'looks_setsizeto',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SIZE'
            }
        ]
    },
    'comeToFront': {
        opcode: 'looks_gotofrontback',
        argMap: [
        ]
    },
    'goBackByLayers:': {
        opcode: 'looks_goforwardbackwardlayers',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'NUM'
            }
        ]
    },
    'costumeIndex': {
        opcode: 'looks_costumenumbername',
        argMap: [
        ]
    },
    'sceneName': {
        opcode: 'looks_backdropnumbername',
        argMap: [
        ]
    },
    'scale': {
        opcode: 'looks_size',
        argMap: [
        ]
    },
    'startSceneAndWait': {
        opcode: 'looks_switchbackdroptoandwait',
        argMap: [
            {
                type: 'input',
                inputOp: 'looks_backdrops',
                inputName: 'BACKDROP'
            }
        ]
    },
    'nextScene': {
        opcode: 'looks_nextbackdrop',
        argMap: [
        ]
    },
    'backgroundIndex': {
        opcode: 'looks_backdropnumbername',
        argMap: [
        ]
    },
    'playSound:': {
        opcode: 'sound_play',
        argMap: [
            {
                type: 'input',
                inputOp: 'sound_sounds_menu',
                inputName: 'SOUND_MENU'
            }
        ]
    },
    'doPlaySoundAndWait': {
        opcode: 'sound_playuntildone',
        argMap: [
            {
                type: 'input',
                inputOp: 'sound_sounds_menu',
                inputName: 'SOUND_MENU'
            }
        ]
    },
    'stopAllSounds': {
        opcode: 'sound_stopallsounds',
        argMap: [
        ]
    },
    'playDrum': {
        opcode: 'music.playDrumForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'DRUM'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS'
            }
        ]
    },
    'rest:elapsed:from:': {
        opcode: 'music.restForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS'
            }
        ]
    },
    'noteOn:duration:elapsed:from:': {
        opcode: 'music.playNoteForBeats',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NOTE'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'BEATS'
            }
        ]
    },
    'instrument:': {
        opcode: 'music.setInstrument',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'INSTRUMENT'
            }
        ]
    },
    'changeVolumeBy:': {
        opcode: 'sound_changevolumeby',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VOLUME'
            }
        ]
    },
    'setVolumeTo:': {
        opcode: 'sound_setvolumeto',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VOLUME'
            }
        ]
    },
    'volume': {
        opcode: 'sound_volume',
        argMap: [
        ]
    },
    'changeTempoBy:': {
        opcode: 'music.changeTempo',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TEMPO'
            }
        ]
    },
    'setTempoTo:': {
        opcode: 'music.setTempo',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TEMPO'
            }
        ]
    },
    'tempo': {
        opcode: 'music.getTempo',
        argMap: [
        ]
    },
    'clearPenTrails': {
        opcode: 'pen.clear',
        argMap: [
        ]
    },
    'stampCostume': {
        opcode: 'pen.stamp',
        argMap: [
        ]
    },
    'putPenDown': {
        opcode: 'pen.penDown',
        argMap: [
        ]
    },
    'putPenUp': {
        opcode: 'pen.penUp',
        argMap: [
        ]
    },
    'penColor:': {
        opcode: 'pen.setPenColorToColor',
        argMap: [
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR'
            }
        ]
    },
    'changePenHueBy:': {
        opcode: 'pen.changePenHueBy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'HUE'
            }
        ]
    },
    'setPenHueTo:': {
        opcode: 'pen.setPenHueToNumber',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'HUE'
            }
        ]
    },
    'changePenShadeBy:': {
        opcode: 'pen.changePenShadeBy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SHADE'
            }
        ]
    },
    'setPenShadeTo:': {
        opcode: 'pen.setPenShadeToNumber',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SHADE'
            }
        ]
    },
    'changePenSizeBy:': {
        opcode: 'pen.changePenSizeBy',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SIZE'
            }
        ]
    },
    'penSize:': {
        opcode: 'pen.setPenSizeTo',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'SIZE'
            }
        ]
    },
    'whenGreenFlag': {
        opcode: 'event_whenflagclicked',
        argMap: [
        ]
    },
    'whenKeyPressed': {
        opcode: 'event_whenkeypressed',
        argMap: [
            {
                type: 'field',
                fieldName: 'KEY_OPTION'
            }
        ]
    },
    'whenClicked': {
        opcode: 'event_whenthisspriteclicked',
        argMap: [
        ]
    },
    'whenSceneStarts': {
        opcode: 'event_whenbackdropswitchesto',
        argMap: [
            {
                type: 'field',
                fieldName: 'BACKDROP'
            }
        ]
    },
    'whenSensorGreaterThan': {
        opcode: 'event_whengreaterthan',
        argMap: [
            {
                type: 'field',
                fieldName: 'WHENGREATERTHANMENU'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VALUE'
            }
        ]
    },
    'whenIReceive': {
        opcode: 'event_whenbroadcastreceived',
        argMap: [
            {
                type: 'field',
                fieldName: 'BROADCAST_OPTION',
                variableType: Variable.BROADCAST_MESSAGE_TYPE
            }
        ]
    },
    'broadcast:': {
        opcode: 'event_broadcast',
        argMap: [
            {
                type: 'input',
                inputOp: 'event_broadcast_menu',
                inputName: 'BROADCAST_INPUT',
                variableType: Variable.BROADCAST_MESSAGE_TYPE
            }
        ]
    },
    'doBroadcastAndWait': {
        opcode: 'event_broadcastandwait',
        argMap: [
            {
                type: 'input',
                inputOp: 'event_broadcast_menu',
                inputName: 'BROADCAST_INPUT',
                variableType: Variable.BROADCAST_MESSAGE_TYPE
            }
        ]
    },
    'wait:elapsed:from:': {
        opcode: 'control_wait',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_positive_number',
                inputName: 'DURATION'
            }
        ]
    },
    'doRepeat': {
        opcode: 'control_repeat',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_whole_number',
                inputName: 'TIMES'
            },
            {
                type: 'input',
                inputName: 'SUBSTACK'
            }
        ]
    },
    'doForever': {
        opcode: 'control_forever',
        argMap: [
            {
                type: 'input',
                inputName: 'SUBSTACK'
            }
        ]
    },
    'doIf': {
        opcode: 'control_if',
        argMap: [
            {
                type: 'input',
                inputName: 'CONDITION'
            },
            {
                type: 'input',
                inputName: 'SUBSTACK'
            }
        ]
    },
    'doIfElse': {
        opcode: 'control_if_else',
        argMap: [
            {
                type: 'input',
                inputName: 'CONDITION'
            },
            {
                type: 'input',
                inputName: 'SUBSTACK'
            },
            {
                type: 'input',
                inputName: 'SUBSTACK2'
            }
        ]
    },
    'doWaitUntil': {
        opcode: 'control_wait_until',
        argMap: [
            {
                type: 'input',
                inputName: 'CONDITION'
            }
        ]
    },
    'doUntil': {
        opcode: 'control_repeat_until',
        argMap: [
            {
                type: 'input',
                inputName: 'CONDITION'
            },
            {
                type: 'input',
                inputName: 'SUBSTACK'
            }
        ]
    },
    'stopScripts': {
        opcode: 'control_stop',
        argMap: [
            {
                type: 'field',
                fieldName: 'STOP_OPTION'
            }
        ]
    },
    'whenCloned': {
        opcode: 'control_start_as_clone',
        argMap: [
        ]
    },
    'createCloneOf': {
        opcode: 'control_create_clone_of',
        argMap: [
            {
                type: 'input',
                inputOp: 'control_create_clone_of_menu',
                inputName: 'CLONE_OPTION'
            }
        ]
    },
    'deleteClone': {
        opcode: 'control_delete_this_clone',
        argMap: [
        ]
    },
    'touching:': {
        opcode: 'sensing_touchingobject',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_touchingobjectmenu',
                inputName: 'TOUCHINGOBJECTMENU'
            }
        ]
    },
    'touchingColor:': {
        opcode: 'sensing_touchingcolor',
        argMap: [
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR'
            }
        ]
    },
    'color:sees:': {
        opcode: 'sensing_coloristouchingcolor',
        argMap: [
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR'
            },
            {
                type: 'input',
                inputOp: 'colour_picker',
                inputName: 'COLOR2'
            }
        ]
    },
    'distanceTo:': {
        opcode: 'sensing_distanceto',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_distancetomenu',
                inputName: 'DISTANCETOMENU'
            }
        ]
    },
    'doAsk': {
        opcode: 'sensing_askandwait',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'QUESTION'
            }
        ]
    },
    'answer': {
        opcode: 'sensing_answer',
        argMap: [
        ]
    },
    'keyPressed:': {
        opcode: 'sensing_keypressed',
        argMap: [
            {
                type: 'field',
                fieldName: 'KEY_OPTION'
            }
        ]
    },
    'mousePressed': {
        opcode: 'sensing_mousedown',
        argMap: [
        ]
    },
    'mouseX': {
        opcode: 'sensing_mousex',
        argMap: [
        ]
    },
    'mouseY': {
        opcode: 'sensing_mousey',
        argMap: [
        ]
    },
    'soundLevel': {
        opcode: 'sensing_loudness',
        argMap: [
        ]
    },
    'senseVideoMotion': {
        opcode: 'sensing_videoon',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_videoonmenuone',
                inputName: 'VIDEOONMENU1'
            },
            {
                type: 'input',
                inputOp: 'sensing_videoonmenutwo',
                inputName: 'VIDEOONMENU2'
            }
        ]
    },
    'setVideoState': {
        opcode: 'sensing_videotoggle',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_videotogglemenu',
                inputName: 'VIDEOTOGGLEMENU'
            }
        ]
    },
    'setVideoTransparency': {
        opcode: 'sensing_setvideotransparency',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TRANSPARENCY'
            }
        ]
    },
    'timer': {
        opcode: 'sensing_timer',
        argMap: [
        ]
    },
    'timerReset': {
        opcode: 'sensing_resettimer',
        argMap: [
        ]
    },
    'getAttribute:of:': {
        opcode: 'sensing_of',
        argMap: [
            {
                type: 'field',
                fieldName: 'PROPERTY'
            },
            {
                type: 'input',
                inputOp: 'sensing_of_object_menu',
                inputName: 'OBJECT'
            }
        ]
    },
    'timeAndDate': {
        opcode: 'sensing_current',
        argMap: [
            {
                type: 'input',
                inputOp: 'sensing_currentmenu',
                inputName: 'CURRENTMENU'
            }
        ]
    },
    'timestamp': {
        opcode: 'sensing_dayssince2000',
        argMap: [
        ]
    },
    'getUserName': {
        opcode: 'sensing_username',
        argMap: [
        ]
    },
    '+': {
        opcode: 'operator_add',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2'
            }
        ]
    },
    '-': {
        opcode: 'operator_subtract',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2'
            }
        ]
    },
    '*': {
        opcode: 'operator_multiply',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2'
            }
        ]
    },
    '/': {
        opcode: 'operator_divide',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2'
            }
        ]
    },
    'randomFrom:to:': {
        opcode: 'operator_random',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'FROM'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'TO'
            }
        ]
    },
    '<': {
        opcode: 'operator_lt',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND1'
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND2'
            }
        ]
    },
    '=': {
        opcode: 'operator_equals',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND1'
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND2'
            }
        ]
    },
    '>': {
        opcode: 'operator_gt',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND1'
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'OPERAND2'
            }
        ]
    },
    '&': {
        opcode: 'operator_and',
        argMap: [
            {
                type: 'input',
                inputName: 'OPERAND1'
            },
            {
                type: 'input',
                inputName: 'OPERAND2'
            }
        ]
    },
    '|': {
        opcode: 'operator_or',
        argMap: [
            {
                type: 'input',
                inputName: 'OPERAND1'
            },
            {
                type: 'input',
                inputName: 'OPERAND2'
            }
        ]
    },
    'not': {
        opcode: 'operator_not',
        argMap: [
            {
                type: 'input',
                inputName: 'OPERAND'
            }
        ]
    },
    'concatenate:with:': {
        opcode: 'operator_join',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING1'
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING2'
            }
        ]
    },
    'letter:of:': {
        opcode: 'operator_letter_of',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_whole_number',
                inputName: 'LETTER'
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING'
            }
        ]
    },
    'stringLength:': {
        opcode: 'operator_length',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'STRING'
            }
        ]
    },
    '%': {
        opcode: 'operator_mod',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM1'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM2'
            }
        ]
    },
    'rounded': {
        opcode: 'operator_round',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM'
            }
        ]
    },
    'computeFunction:of:': {
        opcode: 'operator_mathop',
        argMap: [
            {
                type: 'field',
                fieldName: 'OPERATOR'
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'NUM'
            }
        ]
    },
    'readVariable': {
        opcode: 'data_variable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                variableType: Variable.SCALAR_TYPE
            }
        ]
    },
    'setVar:to:': {
        opcode: 'data_setvariableto',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                variableType: Variable.SCALAR_TYPE
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'VALUE'
            }
        ]
    },
    'changeVar:by:': {
        opcode: 'data_changevariableby',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                variableType: Variable.SCALAR_TYPE
            },
            {
                type: 'input',
                inputOp: 'math_number',
                inputName: 'VALUE'
            }
        ]
    },
    'showVariable:': {
        opcode: 'data_showvariable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                variableType: Variable.SCALAR_TYPE
            }
        ]
    },
    'hideVariable:': {
        opcode: 'data_hidevariable',
        argMap: [
            {
                type: 'field',
                fieldName: 'VARIABLE',
                variableType: Variable.SCALAR_TYPE
            }
        ]
    },
    'contentsOfList:': {
        opcode: 'data_listcontents',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'append:toList:': {
        opcode: 'data_addtolist',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM'
            },
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'deleteLine:ofList:': {
        opcode: 'data_deleteoflist',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX'
            },
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'insert:at:ofList:': {
        opcode: 'data_insertatlist',
        argMap: [
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM'
            },
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX'
            },
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'setLine:ofList:to:': {
        opcode: 'data_replaceitemoflist',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX'
            },
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM'
            }
        ]
    },
    'getLine:ofList:': {
        opcode: 'data_itemoflist',
        argMap: [
            {
                type: 'input',
                inputOp: 'math_integer',
                inputName: 'INDEX'
            },
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'lineCountOfList:': {
        opcode: 'data_lengthoflist',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'list:contains:': {
        opcode: 'data_listcontainsitem',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            },
            {
                type: 'input',
                inputOp: 'text',
                inputName: 'ITEM'
            }
        ]
    },
    'showList:': {
        opcode: 'data_showlist',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'hideList:': {
        opcode: 'data_hidelist',
        argMap: [
            {
                type: 'field',
                fieldName: 'LIST',
                variableType: Variable.LIST_TYPE
            }
        ]
    },
    'procDef': {
        opcode: 'procedures_definition',
        argMap: []
    },
    'getParam': {
        // Doesn't map to single opcode. Import step assigns final correct opcode.
        opcode: 'argument_reporter_string_number',
        argMap: [
            {
                type: 'field',
                fieldName: 'VALUE'
            }
        ]
    },
    'call': {
        opcode: 'procedures_call',
        argMap: []
    }
};

/**
 * Add to the specMap entries for an opcode from a Scratch 2.0 extension. Two entries will be made with the same
 * metadata; this is done to support projects saved by both older and newer versions of the Scratch 2.0 editor.
 * @param {string} sb2Extension - the Scratch 2.0 name of the extension
 * @param {string} sb2Opcode - the Scratch 2.0 opcode
 * @param {SB2SpecMap_blockInfo} blockInfo - the Scratch 3.0 block info
 */
const addExtensionOp = function (sb2Extension, sb2Opcode, blockInfo) {
    /**
     * This string separates the name of an extension and the name of an opcode in more recent Scratch 2.0 projects.
     * Earlier projects used '.' as a separator, up until we added the 'LEGO WeDo 2.0' extension...
     * @type {string}
     */
    const sep = '\u001F'; // Unicode Unit Separator

    // make one entry for projects saved by recent versions of the Scratch 2.0 editor
    specMap[`${sb2Extension}${sep}${sb2Opcode}`] = blockInfo;

    // make a second for projects saved by older versions of the Scratch 2.0 editor
    specMap[`${sb2Extension}.${sb2Opcode}`] = blockInfo;
};

const weDo2 = 'LEGO WeDo 2.0';

addExtensionOp(weDo2, 'motorOnFor', {
    opcode: 'wedo2.motorOnFor',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.motorID',
            inputName: 'MOTOR_ID'
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'DURATION'
        }
    ]
});

addExtensionOp(weDo2, 'motorOn', {
    opcode: 'wedo2.motorOn',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.motorID',
            inputName: 'MOTOR_ID'
        }
    ]
});

addExtensionOp(weDo2, 'motorOff', {
    opcode: 'wedo2.motorOff',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.motorID',
            inputName: 'MOTOR_ID'
        }
    ]
});

addExtensionOp(weDo2, 'startMotorPower', {
    opcode: 'wedo2.startMotorPower',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.motorID',
            inputName: 'MOTOR_ID'
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'POWER'
        }
    ]
});

addExtensionOp(weDo2, 'setMotorDirection', {
    opcode: 'wedo2.setMotorDirection',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.motorID',
            inputName: 'MOTOR_ID'
        },
        {
            type: 'input',
            inputOp: 'wedo2.menu.motorDirection',
            inputName: 'DIRECTION'
        }
    ]
});

addExtensionOp(weDo2, 'setLED', {
    opcode: 'wedo2.setLightHue',
    argMap: [
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'HUE'
        }
    ]
});

addExtensionOp(weDo2, 'playNote', {
    opcode: 'wedo2.playNoteFor',
    argMap: [
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'NOTE'
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'DURATION'
        }
    ]
});

addExtensionOp(weDo2, 'whenDistance', {
    opcode: 'wedo2.whenDistance',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.lessMore',
            inputName: 'OP'
        },
        {
            type: 'input',
            inputOp: 'math_number',
            inputName: 'REFERENCE'
        }
    ]
});

addExtensionOp(weDo2, 'whenTilted', {
    opcode: 'wedo2.whenTilted',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.tiltDirectionAny',
            inputName: 'DIRECTION'
        }
    ]
});

addExtensionOp(weDo2, 'getDistance', {
    opcode: 'wedo2.getDistance',
    argMap: []
});

addExtensionOp(weDo2, 'isTilted', {
    opcode: 'wedo2.isTilted',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.tiltDirectionAny',
            inputName: 'DIRECTION'
        }
    ]
});

addExtensionOp(weDo2, 'getTilt', {
    opcode: 'wedo2.getTiltAngle',
    argMap: [
        {
            type: 'input',
            inputOp: 'wedo2.menu.tiltDirection',
            inputName: 'DIRECTION'
        }
    ]
});

module.exports = specMap;
