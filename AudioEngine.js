function AudioEngine () {

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

AudioEngine.prototype.playSound = function (soundNum) {
  this.soundSamplers[soundNum].triggerAttack();
};

AudioEngine.prototype.helloWorld = function () {
  console.log('it lives');
};

AudioEngine.prototype._loadSoundFiles = function(filenames) {
    var samplers = [];
    
    for (var name of filenames) {
        var sampler = new Tone.Sampler('sounds/' + name + '.mp3').toMaster();
        samplers.push(sampler);
    }

    return samplers;
};

AudioEngine.prototype._midiToFreq = function(midiNote) {
	var freq = this.tone.intervalToFrequencyRatio(midiNote - 60) * 261.63; // 60 is C4
	return freq;
};

AudioEngine.prototype.clamp = function(input, min, max) {
    return Math.min(Math.max(input, min), max);
};

AudioEngine.prototype.playNoteForBeats = function(note, beats) {
    var freq = this._midiToFreq(note);
    this.synth.triggerAttackRelease(freq, beats);        
};

AudioEngine.prototype.stopAllSounds = function() {
	// stop sounds triggered with playSound
    for (var i=0; i<this.soundSamplers.length; i++) {
        this.soundSamplers[i].triggerRelease();
    }
};