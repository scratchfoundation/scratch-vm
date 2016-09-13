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
        var sampler = new Tone.Sampler('sounds/' + name + '.mp3').toMaster();
        samplers.push(sampler);
    }

    return samplers;
};

AudioLocal.prototype._midiToFreq = function(midiNote) {
	var freq = this.tone.intervalToFrequencyRatio(midiNote - 60) * 261.63; // 60 is C4
	return freq;
};

AudioLocal.prototype.clamp = function(input, min, max) {
    return Math.min(Math.max(input, min), max);
};

AudioLocal.prototype.playNoteForBeats = function(note, beats) {
    var freq = this._midiToFreq(note);
    this.synth.triggerAttackRelease(freq, beats);        
};

AudioLocal.prototype.stopAllSounds = function() {
	// stop sounds triggered with playSound
    for (var i=0; i<this.soundSamplers.length; i++) {
        this.soundSamplers[i].triggerRelease();
    }
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
                this.soundSamplers[message.data.value].triggerRelease();
                this.soundSamplers[message.data.value].triggerAttack();
    			break;
    		case 'stopAllSounds' :
    			this.stopAllSounds();
    			break;
    		case 'playNoteForBeats' :
    			this.playNoteForBeats(message.data.note, message.data.beats);
    			break;
    	}
    }
};