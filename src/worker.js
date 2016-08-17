var EventEmitter = require('events');
var util = require('util');
var Tone = require('tone');

function VirtualMachine () {
    if (!window.Worker) {
        console.error('WebWorkers not supported in this environment.' +
            ' Please use the non-worker version (vm.js or vm.min.js).');
        return;
    }
    var instance = this;
    EventEmitter.call(instance);
    instance.vmWorker = new Worker('../vm.js');

	// MUSIC STUFF by ericr

    // tone setup
    
    var tone = new Tone();

    Tone.Transport.start();

    // var quantizeUnit = '@8n';
    var quantizeUnit = '';

    // effects 

    var delay = new Tone.FeedbackDelay(0.25, 0.5);
    delay.wet.value = 0;
    
    var pitchShift = new Tone.PitchShift();

    var panner = new Tone.Panner();

    var reverb = new Tone.Freeverb();
    reverb.wet.value = 0;

    Tone.Master.chain(delay, pitchShift, panner, reverb);

    // synth setup for play note block
    
	var synth = new Tone.PolySynth(6, Tone.Synth).toMaster();
	
    // drum sounds

    var drumFileNames = ['high_conga', 'small_cowbell', 'snare_drum', 'splash cymbal'];
    var drumSamplers = loadSoundFiles(drumFileNames);

    // sounds

    var soundFileNames = ['meow','boing','this_is_a_test','who_put_the_bomp','cave','drip_drop','drum_machine','eggs','zoop'];
    var soundSamplers = loadSoundFiles(soundFileNames);

    // polyphonic samplers

    function loadSoundFiles(filenames) {
        var samplers = [];
        
        for (var name of filenames) {

            var myVoices = [];
            for (var i=0; i<6; i++) {
                var p = new Tone.Sampler('sounds/' + name + '.mp3').toMaster();
                myVoices.push(p);
            }

            var polySampler = {
                voices : myVoices,
                currentVoice : 0,
                nextVoice : function() {return this.voices[this.currentVoice++ % this.voices.length];},
                stopAllVoices : function() {for (var i=0;i<this.voices.length;i++) {this.voices[i].triggerRelease()}},
            };

            samplers.push(polySampler);
        }

        return samplers;
    }
	
    // should fire once all sounds are loaded - seems to not work
    Tone.Buffer.onload = function() {
        console.log('loaded audio samples');
    };

    // scales and keys data

	var scales = {
		'MAJOR' : [0,2,4,5,7,9,11],
		'MINOR' : [0,2,3,5,7,8,10],
		'PENTATONIC': [0, 2, 4, 7, 9],
		'CHROMATIC' : [0,1,2,3,4,5,6,7,8,9,10,11],
	};
	
	var currentScale = scales['MAJOR'];
	var rootNote = 60;
	

    function scaleNoteToMidiNote(scaleNote, scale, root) {
		var scaleIndex = (Math.round(scaleNote) - 1) % scale.length;
		if (scaleIndex < 0) {
			scaleIndex += scale.length;
		}
		var octave = Math.floor((scaleNote - 1) / scale.length);
		var midiNote = root + (octave * 12) + scale[scaleIndex]; 
		return midiNote;
	} 
	
	function midiToFreq(midiNote) {
		var freq = tone.intervalToFrequencyRatio(midiNote - 60) * 261.63; // 60 is C4
		return freq;
	}

    function clamp(input, min, max) {
        return Math.min(Math.max(input, min), max);
    };

    function playNoteForBeats(note, beats) {
        var midiNote = scaleNoteToMidiNote(note, currentScale, rootNote);
        var freq = midiToFreq(midiNote);
        synth.triggerAttackRelease(freq, beats, quantizeUnit);        
    }

    // onmessage calls are converted into emitted events.
    instance.vmWorker.onmessage = function (e) {
        switch (e.data.method) {
            case 'playsound':
                soundSamplers[e.data.soundnum].nextVoice().triggerAttack(0, quantizeUnit);
                break;
            case 'playsoundwithpitch':
                soundSamplers[e.data.soundnum].nextVoice().triggerAttack(e.data.pitch, quantizeUnit);
                break;
            case 'playnoteforbeats':
                playNoteForBeats(e.data.note, e.data.beats);
                break;
            case 'playnote':
                playNoteForBeats(e.data.note, 0.25);
                break;
            case 'setkey':
                rootNote = parseInt(e.data.root) + 60;
                currentScale = scales[e.data.scale];
                break;
            case 'playdrumforbeats':
            case 'playdrum':
                var drumNum = e.data.drum - 1; // one-indexing
                drumSamplers[drumNum].nextVoice().triggerAttack(0, quantizeUnit);
                break;
            case 'seteffect' :
                switch (e.data.effect) {
                    case 'ECHO':
                        delay.wet.value = (e.data.value / 100) / 2; // max 50% wet (need dry signal too)
                        break;
                    case 'PAN':
                        panner.pan.value = e.data.value / 100;
                        break;
                    case 'REVERB':
                        reverb.wet.value = e.data.value / 100;
                        break;
                    case 'PITCH':
                        pitchShift.pitch = e.data.value;
                        break;
                }
                break;
            case 'changeeffect' :
                switch (e.data.effect) {
                    case 'ECHO':
                        delay.wet.value += (e.data.value / 100) / 2; // max 50% wet (need dry signal too)
                        delay.wet.value = clamp(delay.wet.value, 0, 0.5);
                        break;
                    case 'PAN':
                        panner.pan.value += e.data.value / 100;
                        panner.pan.value = clamp(panner.pan.value, -1, 1);
                        break;
                    case 'REVERB':
                        reverb.wet.value += e.data.value / 100;
                        reverb.wet.value = clamp(reverb.wet.value, 0, 1);
                        break;
                    case 'PITCH':
                        pitchShift.pitch += e.data.value;
                        break;
                }
                break;
            case 'cleareffects' :
                delay.wet.value = 0;
                panner.pan.value = 0;
                reverb.wet.value = 0;
                pitchShift.pitch = 0;
                break;
            case 'stopallsounds' :
                // stop sounds from the play sound block
                // to do: stop sounds from play note and play drum blocks
                for (var i=0; i<soundSamplers.length; i++) {
                    soundSamplers[i].stopAllVoices();
                }
                break;
        }
        instance.emit(e.data.method, e.data);
    };

    instance.blockListener = function (e) {
        // Messages from Blockly are not serializable by default.
        // Pull out the necessary, serializable components to pass across.
        var serializableE = {
            blockId: e.blockId,
            element: e.element,
            type: e.type,
            name: e.name,
            newValue: e.newValue,
            oldParentId: e.oldParentId,
            oldInputName: e.oldInputName,
            newParentId: e.newParentId,
            newInputName: e.newInputName,
            xml: {
                outerHTML: (e.xml) ? e.xml.outerHTML : null
            }
        };
        instance.vmWorker.postMessage({
            method: 'blockListener',
            args: serializableE
        });
    };
}

/**
 * Inherit from EventEmitter
 */
util.inherits(VirtualMachine, EventEmitter);

// For documentation, please see index.js.
// These mirror the functionality provided there, with the worker wrapper.
VirtualMachine.prototype.getPlaygroundData = function () {
    this.vmWorker.postMessage({method: 'getPlaygroundData'});
};

VirtualMachine.prototype.postIOData = function (device, data) {
    this.vmWorker.postMessage({
        method: 'postIOData',
        device: device,
        data: data
    });
};

VirtualMachine.prototype.start = function () {
    this.vmWorker.postMessage({method: 'start'});
};

VirtualMachine.prototype.greenFlag = function () {
    this.vmWorker.postMessage({method: 'greenFlag'});
};

VirtualMachine.prototype.stopAll = function () {
    this.vmWorker.postMessage({method: 'stopAll'});
};

VirtualMachine.prototype.animationFrame = function () {
    this.vmWorker.postMessage({method: 'animationFrame'});
};

/**
 * Export and bind to `window`
 */
module.exports = VirtualMachine;
if (typeof window !== 'undefined') window.VirtualMachine = module.exports;
