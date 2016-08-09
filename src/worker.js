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
	var options = {modulationEnvelope:{attack:0.1}};
	var synth = new Tone.PolySynth(6, Tone.Synth).toMaster();
	var tone = new Tone();
	
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

    // onmessage calls are converted into emitted events.
    instance.vmWorker.onmessage = function (e) {
		if (e.data.method == 'playnote') {
			var midiNote = scaleNoteToMidiNote(e.data.note, currentScale, rootNote);
			var freq = midiToFreq(midiNote);
			synth.triggerAttackRelease(freq, e.data.beats);
		}
		if (e.data.method == 'setkey') {
			rootNote = e.data.root + 60;
			currentScale = scales[e.data.scale];
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
