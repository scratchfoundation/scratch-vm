function AudioLocal () {

	this.tone = new Tone();

	// effects setup

    this.delay = new Tone.FeedbackDelay(0.25, 0.5);
    this.delay.wet.value = 0;
    
    this.pitchShift = new Tone.PitchShift();

    this.panner = new Tone.Panner();

    this.reverb = new Tone.Freeverb();
    this.reverb.wet.value = 0;

    Tone.Master.chain(this.delay, this.pitchShift, this.panner, this.reverb);

    // synth setup for play note block
    
	this.synth = new Tone.PolySynth(6, Tone.Synth).toMaster();
	
    // drum sounds

    var drumFileNames = ['high_conga', 'small_cowbell', 'snare_drum', 'splash cymbal'];
    this.drumSamplers = this._loadSoundFiles(drumFileNames);

    // sound files

    var soundFileNames = ['meow','boing','this_is_a_test','who_put_the_bomp','cave','drip_drop','drum_machine','eggs','zoop'];
    this.soundSamplers = this._loadSoundFiles(soundFileNames);
}

AudioLocal.prototype.helloWorld = function () {
  console.log('it lives');
};

AudioLocal.prototype._loadSoundFiles = function(filenames) {
    var samplers = [];
    
    for (var name of filenames) {

    	// create an array of samplers for each sound (a hack to get polyphony for each sound)
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
};

AudioLocal.prototype.midiToFreq = function(midiNote) {
	var freq = tone.intervalToFrequencyRatio(midiNote - 60) * 261.63; // 60 is C4
	return freq;
};

AudioLocal.prototype.clamp = function(input, min, max) {
    return Math.min(Math.max(input, min), max);
};

AudioLocal.prototype.playNoteForBeats = function(note, beats) {
    var midiNote = scaleNoteToMidiNote(note, currentScale, rootNote);
    var freq = midiToFreq(midiNote);
    synth.triggerAttackRelease(freq, beats, quantizeUnit);        
};


AudioLocal.prototype.connectWorker = function(worker) {
    var instance = this;
    worker.addEventListener('message', function (event) {
        instance._onWorkerMessage(worker, event);
    });
};

AudioLocal.prototype._onWorkerMessage = function(worker, message) {
    if (message.data.type == 'audio') {
    	switch(message.data.method) {
    		case 'playSound' :
                this.soundSamplers[message.data.value].nextVoice().triggerAttack();
    			break;
    	}
    }
};