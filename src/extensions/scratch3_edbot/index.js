/*
 * Edbot Scratch 3.0 extension.
 */

const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const edbot = require("edbot");

const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnMTAiCiAgIHdpZHRoPSI1NC4wODQ1MDciCiAgIGhlaWdodD0iNTQuMDg0NTA3IgogICB2aWV3Qm94PSIwIDAgNTQuMDg0NTA3IDU0LjA4NDUwNyIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZWRib3Qtc21hbGwuc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkyLjMgKDI0MDU1NDYsIDIwMTgtMDMtMTEpIj4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGExNiI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGRlZnMKICAgICBpZD0iZGVmczE0IiAvPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iNjQwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjQ4MCIKICAgICBpZD0ibmFtZWR2aWV3MTIiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIGlua3NjYXBlOnpvb209IjQuMzYzNTQxNyIKICAgICBpbmtzY2FwZTpjeD0iMjcuMDQyMjUzIgogICAgIGlua3NjYXBlOmN5PSIyNy4wNDIyNTMiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjM0NiIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iNjMiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJzdmcxMCIgLz4KICA8aW1hZ2UKICAgICB3aWR0aD0iNTQuMDg0NTA3IgogICAgIGhlaWdodD0iNTQuMDg0NTA3IgogICAgIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiCiAgICAgc3R5bGU9ImltYWdlLXJlbmRlcmluZzpvcHRpbWl6ZVNwZWVkIgogICAgIHhsaW5rOmhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQ2dBQUFBb0NBTUFBQUM3SUVoZkFBQUFMSFJGV0hSRGNtVmhkR2x2YmlCVWFXMWxBRlJvCmRTQXhOeUJLWVc0Z01qQXhPU0F3T1Rvd09Eb3hNQ0F0TURBd01ESkd3R29BQUFBSGRFbE5SUWZqQVJFTkt5OWN1SW1sQUFBQUNYQkkKV1hNQUFBcndBQUFLOEFGQ3JEU1lBQUFBQkdkQlRVRUFBTEdQQy94aEJRQUFBd0JRVEZSRkFBQUFBUUVCQWdJQ0F3TURCQVFFQmdZRwpDQWdJQ3dzTERnNE9EdzhQRWhJU0V4TVRGUlVWRmhZV0dCZ1lHUmtaR2hvYUd4c2JJaUlpSXlNaktDZ29LU2twTEN3c0xTMHRNVEV4Ck5EUTBOVFUxTnpjM096czdQajQrUHo4L1FFQkFRME5EUlVWRlJrWkdTa3BLVEV4TVRVMU5VRkJRVVZGUlZsWldXMXRiWDE5ZloyZG4KYTJ0cmJXMXRjSEJ3Y25KeWQzZDNlWGw1ZTN0N2lvcUtqNCtQa0pDUWtaR1JrcEtTbHBhV21KaVltcHFhb2FHaHBxYW1yS3lzczdPegp0YlcxdXJxNmtzWCtrOGIrbE1iK2xjZitsc2YrbDhqK21NaittOHIrbk1yK3A5RCtyTlArcnRUK3Vkcit2dHordnQzK3dNREF5OHZMCnpNek0wZEhSMHRMUzA5UFQxdGJXMTlmWDJOalkydHJhM2QzZDN0N2UzOS9mMHVmLzF1bi8yT3IvM096LzMrNy80T0RnNHVMaTV1Ym0KNStmbjZ1cnE1L0wvNi9YLzdmWC84UER3OGZIeDh2THk5UFQwOXZiMjkvZjM4L24vOWZyLytmbjUrL3Y3K1B2Ly9QejgvUDMvL1A3LwovdjcrL3Y3Ly8vLy9BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBCkFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUEKQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQQpBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBCkFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUEKQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQQpBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBCkFBQUFBQUFBQUFBQTVZeHNpQUFBQUh0MFVrNVQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8KLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLwovLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLzhBazhPbzZnQUFBYnBKUkVGVWVOcTFsZXRQZ2xBWWgxOUt4R3dyCjBQS1dhZmZVbWJPMGk2bXAzWFhUWVZqenN1WmNXWnV5TWIrZDlkY25vSEJPSWRSYXYwOW5EdytIODc0Y0R2RHh3OEJ2eEhiTUh6U0wKUDZHSzdiM2pWOUVzTC9FRFJkdy9RUllSSTJsWmREV3RSRlQweUNJcjRLelhlNWJUNitGUVlMK0wxZkxsOWQzMVpibHFKYUxhYmFsVQp1cTBoUzNGVXVTbmRWRWJXSW5xL3Y3cC9SeVppUnhENnlxQmI3WktBRUJ1eE5jN0pKdnZhTERqQXhJdmd3eUR2QUx1M05mRUlvSXNOCmR4MGg2WndDVzJDb3prY0FYWXlzRHNaWDJ3d0FuVkZFRW1oaVo1SE9Td2dkQWNDY1Q1THJVSUEwQlpvb09NRnh5aC9Panprc2lmS2kKU0tDTEM2QmxXUkZKb0lsOVZzUHpHL0lTdndDOW1DUTk1ZmFDVWd3SmRMSHZ0YW1ZanFwdEpBSFc4RmFBbmh0WGFJK0trNFlUQUgrRgp3OHhXS0xSVDBEY0NEb3gzajBIK1cwd0JSOXlTc3pGRlEvR1JvMEoxekhOVDRhSHhvN01jNWNxOXFlT1hGQU5lZnRZYWVRL1F2blJUCkdqNGtQVUJ0dE5Bc0VUV2pEcURZVU1BSndHRmZoVkhWZk1MdG9Ka0ZYNnBoMlo1WGdhOExiMy9xNDhxVHBaaGJsOFZFWExUdzJwdDUKNVdnK2lCUUZzeFIzenlhSGZUcHNlb1p2WjMvelYvZ0VNanN4QlRXQVRLb0FBQUFBU1VWT1JLNUNZSUk9CiIKICAgICBpZD0iaW1hZ2UxOCIKICAgICB4PSIwIgogICAgIHk9IjAiIC8+Cjwvc3ZnPgo=';

const USER = "Scratcher";
const CLIENT = "Scratch 3.0";

var robots = {};	// robot name to client map
var names = [];		// sorted robot names
var motions = {};	// motions object

class Scratch3EdbotBlocks {
    static get EXTENSION_ID() {
        return 'edbot';
    }

	constructor() {
		console.log("Edbot extension constructor");
	}

	init() {
		var instance = this;
		var client = null;
		var host = "localhost";
		var port = 8080;

		return new edbot.EdbotClient(host, port, {
			user: USER,
			client: CLIENT,
			onopen: function(event) {
				console.log("Connected to server " + host + ":" + port);
			},
			onclose: function(event) {
				console.log("Closed connection to server " + host + ":" + port);
				instance.reconnect(host, port);
			}
		})
		.connect()
		.then(function(response) {
			client = response;

			// Server version check!
			var version = "";
			try {
				version = client.getData()["server"]["version"];
			} catch(err) {}
			if(!version.startsWith("5")) {
				throw "Requires Edbot Software version 5+";
			}

			var names = client.getRobotNames("edbot");
			for(var i = 0; i < names.length; i++) {
				robots[names[i]] = client;
			}
			return Promise.resolve(client.getDefaultMotions("edbot"));
		})
		.then(function(response) {
			motions = response.data;
			return client.getRemoteServers();
		})
		.then(function(response) {
			if(response.status.success) {
				var promises = [];
				var servers = response.data;
				for(var i = 0; i < servers.length; i++) {
					var host = servers[i].host;
					var port = servers[i].port;
					promises.push(new Promise(
						function(resolve, reject) {
							return new edbot.EdbotClient(host, port, {
								user: USER,
								client: CLIENT,
								onopen: function(event) {
									console.log("Connected to server " + host + ":" + port);
								},
								onclose: function(event) {
									console.log("Closed connection to server " + host + ":" + port);
									instance.reconnect(host, port);
								}
							})
							.connect()
							.then(function(client) {
								var names = client.getRobotNames("edbot");
								for(var i = 0; i < names.length; i++) {
									robots[names[i]] = client;
								}
								return resolve();
							})
						}
					));
				}
				return Promise.all(promises)
				.then(function(promises) {
					if(Object.keys(robots).length == 0) {
						if(!confirm("No Edbots found.\nContinue in Demo mode?")) {
							return Promise.reject();
						}
						instance.demoMode();
					}
					names = Object.keys(robots).sort();
					return Promise.resolve();
				});
			}
		})
		.catch(err => {
			if(!confirm("Unable to connect to the Edbot Software.\nContinue in Demo mode?")) {
				return Promise.reject();
			}
			instance.demoMode();
			return Promise.resolve();
		});
	}

	reconnect(host, port) {
		var instance = this;

		console.log("Reconnecting to server " + host + ":" + port);
		return new edbot.EdbotClient(host, port, {
			user: USER,
			client: CLIENT,
			onopen: function(event) {
				console.log("Connected to server " + host + ":" + port);
			},
			onclose: function(event) {
				console.log("Closed connection to server " + host + ":" + port);
				instance.reconnect(host, port);
			}
		})
		.connect()
		.then(function(client) {
			var names = client.getRobotNames("edbot");
			for(var i = 0; i < names.length; i++) {
				robots[names[i]] = client;
			}
		})
		.catch(err => {
			instance.reconnect(host, port);
		});
	}

	getClient(name) {
		if(name in robots) {
			return robots[name];
		}
		return null;
	}

	demoMode() {
		robots["Demo"] = null;
		names = Object.keys(robots).sort();
		motions = {
			"All": [
				{ "name": "backward roll", "id": 24 },
				{ "name": "bow 1", "id": 5 },
				{ "name": "bow 2", "id": 6 },
				{ "name": "break dance", "id": 40 },
				{ "name": "break dance flip", "id": 41 },
				{ "name": "crouch", "id": 3 },
				{ "name": "forward roll", "id": 21 },
				{ "name": "gangnam", "id": 42 },
				{ "name": "get up", "id": 2 },
				{ "name": "goalie block", "id": 34 },
				{ "name": "goalie left", "id": 35 },
				{ "name": "goalie right", "id": 36 },
				{ "name": "goalie spread", "id": 37 },
				{ "name": "head stand", "id": 38 },
				{ "name": "initial position", "id": 1 },
				{ "name": "karate left 1", "id": 25 },
				{ "name": "karate left 2", "id": 27 },
				{ "name": "karate right 1", "id": 26 },
				{ "name": "karate right 2", "id": 28 },
				{ "name": "left hook", "id": 11 },
				{ "name": "left jab", "id": 10 },
				{ "name": "left kick", "id": 30 },
				{ "name": "left side kick", "id": 32 },
				{ "name": "left uppercut", "id": 12 },
				{ "name": "left wave", "id": 14 },
				{ "name": "push", "id": 29 },
				{ "name": "push up", "id": 23 },
				{ "name": "right hook", "id": 8 },
				{ "name": "right jab", "id": 7 },
				{ "name": "right kick", "id": 31 },
				{ "name": "right side kick", "id": 33 },
				{ "name": "right uppercut", "id": 9 },
				{ "name": "right wave", "id": 13 },
				{ "name": "run forwards", "id": 39 },
				{ "name": "sidestep left", "id": 18 },
				{ "name": "sidestep right", "id": 17 },
				{ "name": "sit up", "id": 22 },
				{ "name": "stand", "id": 4 },
				{ "name": "turn left", "id": 16 },
				{ "name": "turn right", "id": 15 },
				{ "name": "walk backwards", "id": 20 },
				{ "name": "walk forwards", "id": 19 }
			],
			"Basic": [
				{ "name": "crouch", "id": 3 },
				{ "name": "get up", "id": 2 },
				{ "name": "initial position", "id": 1 },
				{ "name": "run forwards", "id": 39 },
				{ "name": "sidestep left", "id": 18 },
				{ "name": "sidestep right", "id": 17 },
				{ "name": "stand", "id": 4 },
				{ "name": "turn left", "id": 16 },
				{ "name": "turn right", "id": 15 },
				{ "name": "walk backwards", "id": 20 },
				{ "name": "walk forwards", "id": 19 }
			],
			"Sport": [
				{ "name": "goalie block", "id": 34 },
				{ "name": "goalie left", "id": 35 },
				{ "name": "goalie right", "id": 36 },
				{ "name": "goalie spread", "id": 37 },
				{ "name": "left kick", "id": 30 },
				{ "name": "left side kick", "id": 32 },
				{ "name": "right kick", "id": 31 },
				{ "name": "right side kick", "id": 33}
			],
			"Greet": [
				{ "name": "bow 1", "id": 5 },
				{ "name": "bow 2", "id": 6 },
				{ "name": "left wave", "id": 14 },
				{ "name": "right wave", "id": 13 }
			],
			"Dance": [
				{ "name": "break dance", "id": 40 },
				{ "name": "break dance flip", "id": 41 },
				{ "name": "gangnam", "id": 42 }
			],
			"Gym": [
				{ "name": "backward roll", "id": 24 },
				{ "name": "forward roll", "id": 21 },
				{ "name": "head stand", "id": 38 },
				{ "name": "push up", "id": 23 },
				{ "name": "sit up", "id": 22 }
			],
			"Fight": [
				{ "name": "karate left 1", "id": 25 },
				{ "name": "karate left 2", "id": 27 },
				{ "name": "karate right 1", "id": 26 },
				{ "name": "karate right 2", "id": 28 },
				{ "name": "left hook", "id": 11 },
				{ "name": "left jab", "id": 10 },
				{ "name": "left uppercut", "id": 12 },
				{ "name": "push", "id": 29 },
				{ "name": "right hook", "id": 8 },
				{ "name": "right jab", "id": 7 },
				{ "name": "right uppercut", "id": 9 }
			]
		};
	}

	getInfo() {
		return {
			id: Scratch3EdbotBlocks.EXTENSION_ID,
			name: "Edbot",
            blockIconURI: blockIconURI,
			blocks: [
				{
					opcode: "runBasicMotion",
					text: "[NAME] basic motion [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							menu: "basicMotionMenu",
							defaultValue: motions["Basic"][0].id
						}
					}
				},
				{
					opcode: "runSportMotion",
					text: "[NAME] sport motion [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							menu: "sportMotionMenu",
							defaultValue: motions["Sport"][0].id
						}
					}
				},
				{
					opcode: "runGreetMotion",
					text: "[NAME] greet motion [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							menu: "greetMotionMenu",
							defaultValue: motions["Greet"][0].id
						}
					}
				},
				{
					opcode: "runDanceMotion",
					text: "[NAME] dance motion [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							menu: "danceMotionMenu",
							defaultValue: motions["Dance"][0].id
						}
					}
				},
				{
					opcode: "runGymMotion",
					text: "[NAME] gym motion [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							menu: "gymMotionMenu",
							defaultValue: motions["Gym"][0].id
						}
					}
				},
				{
					opcode: "runFightMotion",
					text: "[NAME] fight motion [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							menu: "fightMotionMenu",
							defaultValue: motions["Fight"][0].id
						}
					}
				},
				{
					opcode: "runMotion",
					text: "[NAME] motion number [MOTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MOTION: {
							type: ArgumentType.NUMBER,
							defaultValue: 1
						}
					}
				},
				{
					opcode: "setMotionLights",
					text: "[NAME] set motion lights [TOGGLE]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						TOGGLE: {
							type: ArgumentType.NUMBER,
							menu: "toggleMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "motionName",
					text: "name of motion number [MOTION]",
					blockType: BlockType.REPORTER,
					arguments: {
						MOTION: {
							type: ArgumentType.NUMBER,
							defaultValue: 1
						}
					}
				},
				"---",
				{
					opcode: "setServoTorque",
					text: "[NAME] set servo [SERVO] [TOGGLE]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						SERVO: {
							type: ArgumentType.NUMBER,
							menu: "servoAllMenu",
							defaultValue: 1
						},
						TOGGLE: {
							type: ArgumentType.NUMBER,
							menu: "toggleMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "setServoLED",
					text: "[NAME] set servo [SERVO] colour [COLOUR]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						SERVO: {
							type: ArgumentType.NUMBER,
							menu: "servoAllMenu",
							defaultValue: 1
						},
						COLOUR: {
							type: ArgumentType.NUMBER,
							menu: "colourMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "setServoSpeed",
					text: "[NAME] set servo [SERVO] speed [SPEED]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						SERVO: {
							type: ArgumentType.NUMBER,
							menu: "servoAllMenu",
							defaultValue: 1
						},
						SPEED: {
							type: ArgumentType.NUMBER,
							defaultValue: 100
						}
					}
				},
				{
					opcode: "setServoPosition",
					text: "[NAME] set servo [SERVO] position [POSITION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						SERVO: {
							type: ArgumentType.NUMBER,
							menu: "servoMenu",
							defaultValue: 1
						},
						POSITION: {
							type: ArgumentType.NUMBER,
							defaultValue: 150
						}
					}
				},
				{
					opcode: "getServoPosition",
					text: "[NAME] servo [SERVO] position",
					blockType: BlockType.REPORTER,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						SERVO: {
							type: ArgumentType.NUMBER,
							menu: "servoMenu",
							defaultValue: 1
						}
					}
				},
				{
					opcode: "getServoLoad",
					text: "[NAME] servo [SERVO] load",
					blockType: BlockType.REPORTER,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						SERVO: {
							type: ArgumentType.NUMBER,
							menu: "servoMenu",
							defaultValue: 1
						}
					}
				},
				"---",
				{
					opcode: "setServoTorques",
					text: "[NAME] set servos [PATH]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PATH: {
							type: ArgumentType.STRING,
							defaultValue: "0/1"
						}
					}
				},
				{
					opcode: "setServoLEDs",
					text: "[NAME] set servo colours [PATH]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PATH: {
							type: ArgumentType.STRING,
							defaultValue: "0/3"
						}
					}
				},
				{
					opcode: "setServoSpeeds",
					text: "[NAME] set servo speeds [PATH]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PATH: {
							type: ArgumentType.STRING,
							defaultValue: "0/50"
						}
					}
				},
				{
					opcode: "setServoPositions",
					text: "[NAME] set servo positions [PATH]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PATH: {
							type: ArgumentType.STRING,
							defaultValue: "1/200/2/100"
						}
					}
				},
				{
					opcode: "getServoPositions",
					text: "[NAME] servo positions",
					blockType: BlockType.REPORTER,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						}
					}
				},
				"---",
				{
					opcode: "setHeadIRSensor",
					text: "[NAME] set head IR sensor [TOGGLE]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						TOGGLE: {
							type: ArgumentType.NUMBER,
							menu: "toggleMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "getHeadIRSensor",
					text: "[NAME] head [UNIT]",
					blockType: BlockType.REPORTER,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						UNIT: {
							type: ArgumentType.NUMBER,
							menu: "unitMenu",
							defaultValue: 0
						}
					}
				},
				"---",
				{
					opcode: "say",
					text: "[NAME] say [TEXT]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						TEXT: {
							type: ArgumentType.STRING,
							defaultValue: "Hello!"
						}
					}
				},
				{
					opcode: "sayWait",
					text: "[NAME] say [TEXT] until done",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						TEXT: {
							type: ArgumentType.STRING,
							defaultValue: "Hello!"
						}
					}
				},
				{
					opcode: "getCurrentWord",
					text: "[NAME] current word",
					blockType: BlockType.REPORTER,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						}
					}
				},
				"---",
				{
					opcode: "reset",
					text: "[NAME] reset",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						}
					}
				},
				{
					opcode: "getStatus",
					text: "[NAME] [STATUS]",
					blockType: BlockType.REPORTER,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						STATUS: {
							type: ArgumentType.NUMBER,
							menu: "statusMenu",
							defaultValue: 0
						}
					}
				}
			],
			menus: {
				nameMenu: names.map(name => ({ text: name, value: name })),
				basicMotionMenu: motions["Basic"].map(motion => ({ text: motion.name, value: motion.id })),
				sportMotionMenu: motions["Sport"].map(motion => ({ text: motion.name, value: motion.id })),
				greetMotionMenu: motions["Greet"].map(motion => ({ text: motion.name, value: motion.id })),
				danceMotionMenu: motions["Dance"].map(motion => ({ text: motion.name, value: motion.id })),
				gymMotionMenu:   motions["Gym"].map(motion => ({ text: motion.name, value: motion.id })),
				fightMotionMenu: motions["Fight"].map(motion => ({ text: motion.name, value: motion.id })),
				statusMenu: [
					{ text: "connected", value: 0 },
					{ text: "enabled", value: 1 }
				],
				toggleMenu: [
					{ text: "off", value: 0 },
					{ text: "on", value: 1 }
				],
				colourMenu: [
					{ text: "off",     value: 0 },
					{ text: "red",     value: 1 },
					{ text: "green",   value: 2 },
					{ text: "yellow",  value: 3 },
					{ text: "blue",    value: 4 },
					{ text: "magenta", value: 5 },
					{ text: "cyan",    value: 6 },
					{ text: "white",   value: 7 }
				],
				servoMenu: new Array(16).fill().map(
					(e, i) => {
						var servo = i + 1;
						return { text: servo.toString(), value: servo };
					}
				),
				servoAllMenu: new Array(17).fill().map(
					(e, i) => {
						if(i < 16) {
							var servo = i + 1;
							return { text: servo.toString(), value: servo };
						} else {
							return { text: "All", value: 0 };
						}
					}
				),
				unitMenu: [
					{ text: "IR sensor", value: 0 },
					{ text: "IR raw value", value: 1 }
				]
			}
		};
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
		const { NAME, MOTION } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.runMotion(NAME, MOTION)
				.then(function(status) {
					console.log(status);
				});
	}

	motionName(args) {
		const { MOTION } = args;
		try {
			var motion = motions["All"].find(function(motion) { return motion.id == MOTION; });
			return motion.name;
		} catch(err) {
			return "";
		}
	}

	setMotionLights(args) {
		const { NAME, TOGGLE } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setOptions(NAME, "motion_leds/" + TOGGLE)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoTorque(args) {
		const { NAME, SERVO, TOGGLE } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoTorque(NAME, SERVO + "/" + TOGGLE)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoLED(args) {
		const { NAME, SERVO, COLOUR } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoLED(NAME, SERVO + "/" + COLOUR)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoSpeed(args) {
		const { NAME, SERVO, SPEED } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoSpeed(NAME, SERVO + "/" + SPEED)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoPosition(args) {
		const { NAME, SERVO, POSITION } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoPosition(NAME, SERVO + "/" + POSITION)
				.then(function(status) {
					console.log(status);
				});
	}

	getServoPosition(args) {
		const { NAME, SERVO } = args;
		try {
			var client = this.getClient(NAME);
			var fservo = "servo-" + ("00" + SERVO).slice(-2);
			return client.getData().robots[NAME].reporters[fservo].position;
		} catch(e) {
			return "";
		}
	}

	getServoLoad(args) {
		const { NAME, SERVO } = args;
		try {
			var client = this.getClient(NAME);
			var fservo = "servo-" + ("00" + SERVO).slice(-2);
			return client.getData().robots[NAME].reporters[fservo].load;
		} catch(e) {
			return "";
		}
	}

	setServoTorques(args) {
		const { NAME, PATH } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoTorque(NAME, PATH)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoLEDs(args) {
		const { NAME, PATH } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoLED(NAME, PATH)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoSpeeds(args) {
		const { NAME, PATH } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoSpeed(NAME, PATH)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoPositions(args) {
		const { NAME, PATH } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoPosition(NAME, PATH)
				.then(function(status) {
					console.log(status);
				});
	}

	getServoPositions(args) {
		const { NAME } = args;
		try {
			var client = this.getClient(NAME);
			var path = "";
			for(servo = 1; servo <= 16; servo++) {
				if(servo > 1) {
					path += "/";
				}
				var fservo = "servo-" + ("00" + servo).slice(-2);
				var position = client.getData().robots[NAME].reporters[fservo].position;
				path += servo + "/" + position;
			}
			return path;
		} catch(e) {
			return "";
		}
	}

	setHeadIRSensor(args) {
		const { NAME, TOGGLE } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setOptions(NAME, "sensor_data/" + TOGGLE)
				.then(function(status) {
					console.log(status);
				});
	}

	getHeadIRSensor(args) {
		const { NAME, UNIT } = args;
		if(UNIT == 0) {
			try {
				var client = this.getClient(NAME);
				var raw = client.getData().robots[NAME].reporters["port1"];
				return edbot.util.rawToIRSS10Dist(raw);
			} catch(e) {
				return 100;
			}
		} else {
			try {
				var client = this.getClient(NAME);
				return client.getData().robots[NAME].reporters["port1"];
			} catch(e) {
				return 0;
			}
		}
	}

	say(args) {
		const { NAME, TEXT } = args;
		var client = this.getClient(NAME);
		if(client != null) {
			client.say(NAME, TEXT)
				.then(function(status) {
					console.log(status);
				});
			return Promise.resolve();
		}
	}

	sayWait(args) {
		const { NAME, TEXT } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.say(NAME, TEXT)
				.then(function(status) {
					console.log(status);
				});
	}

	getCurrentWord(args) {
		const { NAME } = args;
		try {
			var client = this.getClient(NAME);
			var word = client.getData().robots[NAME].reporters["speechCurrentWord"];
			if(word != null) {
				return word;
			}
			return "";
		} catch(e) {
			return "";
		}
	}

	reset(args) {
		const { NAME } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.reset(NAME)
				.then(function(status) {
					console.log(status);
				});
	}

	getStatus(args) {
		const { NAME, STATUS } = args;
		try {
			var client = this.getClient(NAME);
			if(STATUS == 0) {
				return client.getData().robots[NAME].connected;
			} else if(STATUS == 1) {
				return client.getData().robots[NAME].enabled;
			} else {
				return false;
			}
		} catch(e) {
			return false;
		}
	}
}

module.exports = Scratch3EdbotBlocks;