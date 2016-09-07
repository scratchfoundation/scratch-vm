function AudioWorker () {

}

AudioWorker.prototype.playSound = function (soundNum) {
	self.postMessage({
	    type: 'audio',
	    method: 'playSound',
	    value: soundNum
	});
};

module.exports = AudioWorker;