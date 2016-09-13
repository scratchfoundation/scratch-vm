function AudioWorker () {

}

AudioWorker.prototype.playSound = function (soundNum) {
	self.postMessage({
	    type: 'audio',
	    method: 'playSound',
	    value: soundNum
	});
};

AudioWorker.prototype.stopAllSounds = function () {
	self.postMessage({
	    type: 'audio',
	    method: 'stopAllSounds'
	});
};

AudioWorker.prototype.playNoteForBeats = function (note, beats) {
	self.postMessage({
	    type: 'audio',
	    method: 'playNoteForBeats',
	    note: note,
	    beats: beats
	});
};

module.exports = AudioWorker;