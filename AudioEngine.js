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

    var soundFileNames = ['meow','boing','cave','drip_drop','drum_machine','eggs','zoop'];
    this.soundSamplers = this._loadSoundFiles(soundFileNames);
}

AudioEngine.prototype.playSound = function (soundNum) {
    this.soundSamplers[soundNum].triggerAttack();
};

AudioEngine.prototype.getSoundDuration = function (soundNum) {
    return this.soundSamplers[soundNum].player.buffer.duration;
};

AudioEngine.prototype.playNoteForBeats = function(note, beats) {
    var freq = this._midiToFreq(note);
    this.synth.triggerAttackRelease(freq, beats);        
};

AudioEngine.prototype.playDrumForBeats = function(drumNum, beats) {
    this.drumSamplers[drumNum].triggerAttack();        
};

AudioEngine.prototype.stopAllSounds = function() {
    // stop synth notes
    this.synth.releaseAll();
    // stop drum notes
    for (var i=0; i<this.drumSamplers.length; i++) {
        this.drumSamplers[i].triggerRelease();
    }
    // stop sounds triggered with playSound
    for (var i=0; i<this.soundSamplers.length; i++) {
        this.soundSamplers[i].triggerRelease();
    }
};

AudioEngine.prototype.setEffect = function(effect, value) {
    switch (effect) {
        case 'ECHO':
            this.delay.wet.value = (value / 100) / 2; // max 50% wet (need dry signal too)
            break;
        case 'PAN':
            this.panner.pan.value = value / 100;
            break;
        case 'REVERB':
            this.reverb.wet.value = value / 100;
            break;
        case 'PITCH':
            this.pitchShift.pitch = value / 20; // arbitrary scaling of 20 per semitone, for now... default 100 is a perfect fourth
            break;
    }
}

AudioEngine.prototype.changeEffect = function(effect, value) {
    switch (effect) {
        case 'ECHO':
            this.delay.wet.value += (value / 100) / 2; // max 50% wet (need dry signal too)
            this.delay.wet.value = this._clamp(this.delay.wet.value, 0, 0.5);
            break;
        case 'PAN':
            this.panner.pan.value += value / 100;
            this.panner.pan.value = this._clamp(this.panner.pan.value, -1, 1);
            break;
        case 'REVERB':
            this.reverb.wet.value += value / 100;
            this.reverb.wet.value = this._clamp(this.reverb.wet.value, 0, 1);
            break;
        case 'PITCH':
            this.pitchShift.pitch += value / 20;
            break;
    }
} 

AudioEngine.prototype.clearEffects = function() {
    this.delay.wet.value = 0;
    this.panner.pan.value = 0;
    this.reverb.wet.value = 0;
    this.pitchShift.pitch = 0;
}

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

AudioEngine.prototype._clamp = function(input, min, max) {
    return Math.min(Math.max(input, min), max);
};

