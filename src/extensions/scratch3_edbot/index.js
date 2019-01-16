/*
 * Edbot Scratch 3.0 extension.
 */
 
const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const edbot = require("edbot");

var ec = null;
var info = null;

class Scratch3EdbotBlocks {
    static get EXTENSION_ID() {
        return 'edbot';
    }

	constructor() {
		console.log("Constructor called");
	}

	/*
	 * Return metadata for the extension.
	 */
	getInfo() {
		var server = "localhost";
		var port = 8080;
		var i = this;
		if(info == null) {
			info = new edbot.EdbotClient(
				server, port, {
					user: "Scratcher",
					client: "Scratch 3.0",
					onopen: function(event) {
						console.log("Connected to server " + server + ":" + port);
					},
					onclose: function(event) {
						console.log("Connection to server closed");
					}
				}).connect().then(
					function(client) {
						ec = client;
						return ec.getDefaultMotions("edbot").then(
							function(motions) {
								var names = ec.getRobotNames();
								return {
									id: Scratch3EdbotBlocks.EXTENSION_ID,
									name: "Edbot",
									blocks: [
										{
											opcode: "runBasicMotion",
											text: "[name] basic motion [motion]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												motion: {
													type: ArgumentType.STRING,
													menu: "basicMotionMenu",
													defaultValue: motions.data["Basic"][0].id
												}
											}
										},
										{
											opcode: "runSportMotion",
											text: "[name] sport motion [motion]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												motion: {
													type: ArgumentType.STRING,
													menu: "sportMotionMenu",
													defaultValue: motions.data["Sport"][0].id
												}
											}
										},
										{
											opcode: "runGreetMotion",
											text: "[name] greet motion [motion]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												motion: {
													type: ArgumentType.STRING,
													menu: "greetMotionMenu",
													defaultValue: motions.data["Greet"][0].id
												}
											}
										},
										{
											opcode: "runDanceMotion",
											text: "[name] dance motion [motion]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												motion: {
													type: ArgumentType.STRING,
													menu: "danceMotionMenu",
													defaultValue: motions.data["Dance"][0].id
												}
											}
										},
										{
											opcode: "runGymMotion",
											text: "[name] gym motion [motion]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												motion: {
													type: ArgumentType.STRING,
													menu: "gymMotionMenu",
													defaultValue: motions.data["Gym"][0].id
												}
											}
										},
										{
											opcode: "runFightMotion",
											text: "[name] fight motion [motion]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												motion: {
													type: ArgumentType.STRING,
													menu: "fightMotionMenu",
													defaultValue: motions.data["Fight"][0].id
												}
											}
										},
										"---",
										{
											opcode: "say",
											text: "[name] say [text]",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												text: {
													type: ArgumentType.STRING,
													defaultValue: "Hello!"
												}
											}
										},
										{
											opcode: "sayWait",
											text: "[name] say [text] until done",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												text: {
													type: ArgumentType.STRING,
													defaultValue: "Hello!"
												}
											}
										},
										{
											opcode: "getCurrentWord",
											text: "[name] current word",
											blockType: BlockType.REPORTER,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												}
											}
										},
										"---",
										{
											opcode: "reset",
											text: "[name] reset",
											blockType: BlockType.COMMAND,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												}
											}
										},
										{
											opcode: "getStatus",
											text: "[name] [status]",
											blockType: BlockType.REPORTER,
											arguments: {
												name: {
													type: ArgumentType.STRING,
													menu: "nameMenu",
													defaultValue: names[0]
												},
												status: {
													type: ArgumentType.STRING,
													menu: "statusMenu",
													defaultValue: 1
												}
											}
										}
									],
									menus: {
										nameMenu: names.map(name => ({ text: name, value: name })),
										basicMotionMenu: motions.data["Basic"].map(motion => ({ text: motion.name, value: motion.id })),
										sportMotionMenu: motions.data["Sport"].map(motion => ({ text: motion.name, value: motion.id })),
										greetMotionMenu: motions.data["Greet"].map(motion => ({ text: motion.name, value: motion.id })),
										danceMotionMenu: motions.data["Dance"].map(motion => ({ text: motion.name, value: motion.id })),
										gymMotionMenu: motions.data["Gym"].map(motion => ({ text: motion.name, value: motion.id })),
										fightMotionMenu: motions.data["Fight"].map(motion => ({ text: motion.name, value: motion.id })),
										statusMenu: [{ text: "connected", value: 1 }, { text: "enabled", value: 2 }]
									}
								};
							}
						);
					}
				);
		}
		return info;
	}

	runBasicMotion(args) {
		return this.runMotion(args);
	}
	runSportMotion(args) {
		return this.runMotion(args);
	}
	runGreetMotion(args) {
		return this.runMotion(args);
	}
	runDanceMotion(args) {
		return this.runMotion(args);
	}
	runGymMotion(args) {
		return this.runMotion(args);
	}
	runFightMotion(args) {
		return this.runMotion(args);
	}
	runMotion(args) {
		const { name, motion } = args;
		return ec.runMotion(name, motion)
			.then(function(status) {
				console.log(status);
			});
	}

	say(args) {
		const { name, text } = args;
		ec.say(name, text)
			.then(function(status) {
				console.log(status);
			});
	}

	sayWait(args) {
		const { name, text } = args;
		return ec.say(name, text)
			.then(function(status) {
				console.log(status);
			});
	}

	getCurrentWord(args) {
		try {
			var word = ec.getData().robots[args.name].reporters["speech-current-word"];
			if(word != null) {
				return word;
			}
			return "";
		} catch(e) {
			return "";
		}
	}

	reset(args) {
		return ec.reset(args.name)
			.then(function(status) {
				console.log(status);
			});
	}

	getStatus(args) {
		try {
			const { name, status } = args;
			if(status == 1) {
				return ec.getData().robots[name].connected;
			} else if(status == 2) {
				return ec.getData().robots[name].enabled;
			} else {
				return false;
			}
		} catch(e) {
			return false;
		}
	}
}

module.exports = Scratch3EdbotBlocks;