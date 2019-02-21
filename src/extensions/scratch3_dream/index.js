/*
 * Edbot Dream Scratch 3.0 extension.
 */
 
const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const edbot = require("edbot");

const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iQ2FwYV8xIgogICB4PSIwcHgiCiAgIHk9IjBweCIKICAgd2lkdGg9IjYxMnB4IgogICBoZWlnaHQ9IjYxMnB4IgogICB2aWV3Qm94PSIwIDAgNjEyIDYxMiIKICAgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjEyIDYxMjsiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImVkYm90LWRyZWFtLXNtYWxsLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45Mi4zICgyNDA1NTQ2LCAyMDE4LTAzLTExKSI+PG1ldGFkYXRhCiAgIGlkPSJtZXRhZGF0YTQ1Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzCiAgIGlkPSJkZWZzNDMiIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICBib3JkZXJvcGFjaXR5PSIxIgogICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICBncmlkdG9sZXJhbmNlPSIxMCIKICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSI3NzAiCiAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjY1NSIKICAgaWQ9Im5hbWVkdmlldzQxIgogICBzaG93Z3JpZD0iZmFsc2UiCiAgIGlua3NjYXBlOnpvb209IjAuMzg1NjIwOTIiCiAgIGlua3NjYXBlOmN4PSIzMDYiCiAgIGlua3NjYXBlOmN5PSIzMDYiCiAgIGlua3NjYXBlOndpbmRvdy14PSIyNDciCiAgIGlua3NjYXBlOndpbmRvdy15PSI0NCIKICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIKICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0iQ2FwYV8xIiAvPgo8ZwogICBpZD0iZzgiPgoJPGcKICAgaWQ9Imc2Ij4KCQk8cGF0aAogICBkPSJNMjU0LjQxNyw0NTguNzk5Yy0zMy4xODcsMC02MC4xODcsMjcuMDEtNjAuMTg3LDYwLjIwOWMwLDMzLjE4OCwyNyw2MC4xODgsNjAuMTg3LDYwLjE4OHM2MC4xODctMjcsNjAuMTg3LTYwLjE4OCAgICBDMzE0LjYwNCw0ODUuODA5LDI4Ny42MDQsNDU4Ljc5OSwyNTQuNDE3LDQ1OC43OTl6IE0yNTQuNDE3LDU2NC4xNDVjLTI0Ljg4NCwwLTQ1LjEzMi0yMC4yNDgtNDUuMTMyLTQ1LjEzMyAgICBjMC0yNC45LDIwLjI0NC00NS4xNTYsNDUuMTMyLTQ1LjE1NmMyNC44ODksMCw0NS4xMzMsMjAuMjU2LDQ1LjEzMyw0NS4xNTZDMjk5LjU0OSw1NDMuODk2LDI3OS4zMDEsNTY0LjE0NSwyNTQuNDE3LDU2NC4xNDV6IgogICBpZD0icGF0aDIiIC8+CgkJPHBhdGgKICAgZD0iTTYxMiwxODEuODgzYzAtODIuMi02Ni44NzktMTQ5LjA3OS0xNDkuMDgyLTE0OS4wNzljLTM5LjEsMC03NS42NTksMTQuODkzLTEwMy42MzgsNDIuMDc3ICAgIGMtMjEuMjc1LTEzLjE4OC00NS42MjktMjAuMTI3LTcwLjgzLTIwLjEyN2MtNjIuMzk2LDAtMTE1LjQxNyw0MS45MDctMTMwLjQ2LDEwMS4yODVjLTE2Ljc3LTExLjYwNi0zNi42NjEtMTcuODkyLTU3LjE3Ni0xNy44OTIgICAgQzQ1LjIyNywxMzguMTQ3LDAsMTgzLjM2MiwwLDIzOC45MzhjMCw1NC4xOTIsNDMuMDEsOTguNTM0LDk2LjY5MywxMDAuNzAyYzIuNzQsNTkuODE0LDUyLjI2NSwxMDcuNjIzLDExMi43NDksMTA3LjYyMyAgICBjMjcuNDg5LDAsNTMuMzY4LTkuNzM2LDczLjg3NS0yNy42MDljMjEuNTEzLDM0Ljg2OSw1OS4yMTIsNTYuMTQxLDEwMC42LDU2LjE0MWM2NS4yNiwwLDExOC4zNTMtNTMuMDg2LDExOC4zNTMtMTE4LjM0MiAgICBjMC0xMC4zMjQtMS4zOTYtMjAuNjQzLTQuMTYyLTMwLjc4OUM1NjQuNTkxLDMxMC42MDcsNjEyLDI1MS4wMTYsNjEyLDE4MS44ODN6IE00ODcuMTI5LDMxMy42MDcgICAgYy0yLjE2NCwwLjM5NS00LjA0NiwxLjcxNy01LjE1MiwzLjYxN3MtMS4zMjgsNC4xODktMC42MDYsNi4yNjZjMy44ODEsMTEuMTI5LDUuODQ2LDIyLjU1NSw1Ljg0NiwzMy45NTkgICAgYzAsNTYuOTU1LTQ2LjM0MSwxMDMuMjg3LTEwMy4yOTksMTAzLjI4N2MtMzkuMDMyLDAtNzQuMzA4LTIxLjY5My05Mi4wNjQtNTYuNjA3Yy0xLjEwMy0yLjE3Mi0zLjE4OC0zLjY3NC01LjU5Mi00LjAzMSAgICBjLTAuMzczLTAuMDYxLTAuNzQ1LTAuMDgyLTEuMTE0LTAuMDgyYy0yLjAyOCwwLTMuOTg1LDAuODItNS40MTYsMi4yOTVjLTE4LjYxMSwxOS4yNzctNDMuNTc1LDI5Ljg5NS03MC4yODUsMjkuODk1ICAgIGMtNTMuOTM2LDAtOTcuODExLTQzLjg2Ny05Ny44MTEtOTcuNzkzYzAtMC4yODksMC4wMjItMC41NzIsMC4wNDItMC44NTdjMC4wMjYtMC40MzgsMC4wNTYtMC44NzcsMC4wNjctMS4zMjQgICAgYzAuMDUzLTIuMDY2LTAuNzQ5LTQuMDY0LTIuMjEzLTUuNTI1Yy0xLjQ2NC0xLjQ2MS0zLjQ4OS0yLjM2My01LjUyOS0yLjE5MWMtMC41NjgsMC4wMTYtMS4xMjksMC4wNDktMS42ODYsMC4wODQgICAgYy0wLjQ5NywwLjAyOS0wLjk5LDAuMDY2LTEuNDk0LDAuMDY2Yy00Ny4yOTYsMC4wMDgtODUuNzY4LTM4LjQ1MS04NS43NjgtODUuNzI2YzAtNDcuMjc0LDM4LjQ3MS04NS43MzQsODUuNzYtODUuNzM0ICAgIGMyMS4wMjcsMCw0MS4yOTQsNy43NzIsNTcuMDcxLDIxLjg4OWMyLjA1MSwxLjg0LDQuOTM4LDIuNDA1LDcuNTQyLDEuNDg2YzIuNTkzLTAuOTI2LDQuNDc5LTMuMTk1LDQuOTEyLTUuOTEzICAgIGM5LjI3My01OC40NCw1OC45NDgtMTAwLjg1OSwxMTguMTEyLTEwMC44NTljMjQuMjYzLDAsNDcuNjQzLDcuMjQxLDY3LjYwNSwyMC45MzdjMy4wNTIsMi4wOTMsNy4xNzMsMS42NTIsOS43MTctMS4wMjMgICAgYzI1LjYxOS0yNi45OTYsNjAuMTE5LTQxLjg2Miw5Ny4xNDYtNDEuODYyYzczLjkwNSwwLDEzNC4wMzEsNjAuMTI2LDEzNC4wMzEsMTM0LjAyNCAgICBDNTk2Ljk0NSwyNDYuNTgzLDU1MC43NiwzMDEuOTgyLDQ4Ny4xMjksMzEzLjYwN3oiCiAgIGlkPSJwYXRoNCIgLz4KCTwvZz4KPC9nPgo8ZwogICBpZD0iZzEwIj4KPC9nPgo8ZwogICBpZD0iZzEyIj4KPC9nPgo8ZwogICBpZD0iZzE0Ij4KPC9nPgo8ZwogICBpZD0iZzE2Ij4KPC9nPgo8ZwogICBpZD0iZzE4Ij4KPC9nPgo8ZwogICBpZD0iZzIwIj4KPC9nPgo8ZwogICBpZD0iZzIyIj4KPC9nPgo8ZwogICBpZD0iZzI0Ij4KPC9nPgo8ZwogICBpZD0iZzI2Ij4KPC9nPgo8ZwogICBpZD0iZzI4Ij4KPC9nPgo8ZwogICBpZD0iZzMwIj4KPC9nPgo8ZwogICBpZD0iZzMyIj4KPC9nPgo8ZwogICBpZD0iZzM0Ij4KPC9nPgo8ZwogICBpZD0iZzM2Ij4KPC9nPgo8ZwogICBpZD0iZzM4Ij4KPC9nPgo8cGF0aAogICBzdHlsZT0iZmlsbDojZmZmZmZmO3N0cm9rZS13aWR0aDoyLjU5MzIyMDIzIgogICBkPSJtIDM1OS43NjkwNSw0NTYuODYyNTkgYyAtMjQuMDUwOSwtNi4wNzM5NCAtNDYuMzE0NjMsLTIxLjg5ODY4IC02MC4xNjQwNCwtNDIuNzYzNjYgLTUuMzQ4MDUsLTguMDU3MjEgLTExLjM3Mzk0LC0xNC4yMjQzNSAtMTMuODk4NTQsLTE0LjIyNDM1IC0yLjQ1MTM1LDAgLTguNzUxNTIsMy41Mzk5MiAtMTQuMDAwNDEsNy44NjY1IC01LjI0ODg4LDQuMzI2NTYgLTE2LjMwOTA0LDExLjAzNjUyIC0yNC41NzgxMywxNC45MTEwMiAtMTIuOTk5OTksNi4wOTExNCAtMTguMTkzMjksNy4wMjE5MiAtMzguMzczNjksNi44Nzc1NiAtMTkuMzI1NzksLTAuMTM4MjIgLTI1Ljc5MTQ5LC0xLjMwMzEyIC0zNy42MDE3LC02Ljc3NDQ1IC0zMS42MzY3MiwtMTQuNjU2MzcgLTUyLjU4NTg0LC00My4xNDYyMSAtNTYuODgxMzksLTc3LjM1NjEzIC0xLjI4MjMxLC0xMC4yMTIzMyAtMi43MjAyMywtMTguOTMwNTYgLTMuMTk1MzgsLTE5LjM3MzgyIC0wLjQ3NTE1LC0wLjQ0MzI4IC04LjgyMjM4LC0yLjAzMTYgLTE4LjU0OTM5OSwtMy41Mjk2NiBDIDcwLjM0NDYyMywzMTkuMDc5NDggNTUuMjExMzEzLDMxMS44MzE2NiA0MS4yMzA3ODcsMjk3LjkyODU1IDguMzgwODExNCwyNjUuMjYwNTEgOC40OTcwNDM0LDIxMi40NDUzMyA0MS40OTE1MjUsMTc5LjQ1MDg1IGMgMjguMjk4OCwtMjguMjk4OCA3My42MzYxNTUsLTMyLjY0OTQ0IDEwNS45NTM0MjUsLTEwLjE2NzQ0IDE2Ljg0ODQ3LDExLjcyMDkgMjAuOTIwMTgsOS44OTQ5IDI3LjcyMjkxLC0xMi40MzI2NCAxMC40MjcyMiwtMzQuMjIzNTkgMzEuNjAzMzIsLTU5LjIyNTcyNSA2Mi41NTgzNiwtNzMuODYxMjIxIDM0LjEyMDgzLC0xNi4xMzIyNzYgNzEuMDUzNTYsLTE1LjQ1NDYwNyAxMDUuMTY1MjQsMS45Mjk2NDkgOS42NjQ4Myw0LjkyNTQ1OSAxOC4wNTkxOSw4Ljk1NTM3OCAxOC42NTQxNSw4Ljk1NTM3OCAwLjU5NDk3LDAgNy4wMjQ3OCwtNS4wNzI4OTEgMTQuMjg4NTIsLTExLjI3MzA5NCAzNC4zNzk3NSwtMjkuMzQ2MDMgNzguMzY2NTIsLTM5Ljg1NjkzNiAxMjAuNjc2OTEsLTI4LjgzNjQ4MSA2My41MTUwNCwxNi41NDM1NjkgMTA3LjQ4NDI2LDgyLjQ4MTE0OSA5Ny42NDUxMSwxNDYuNDMxNjA5IC03Ljc4MTgxLDUwLjU3ODcgLTQzLjEzODI0LDkyLjI1MDUzIC05MS4xOTgxMSwxMDcuNDg4MDUgLTIzLjkzMzg0LDcuNTg4MjggLTI0LjU1OTM1LDguMzQxMiAtMjAuNjA5MzEsMjQuODA2ODIgNC45NzI4NCwyMC43MjkxMiAyLjI2MjQzLDUwLjE0ODk0IC02LjI3MTMxLDY4LjA3MTI2IC0xNi4xMDIxMSwzMy44MTcxMiAtNDkuMzM5NjcsNTYuMDQzODIgLTg2LjQ0ODAzLDU3LjgwOTY1IC0xMS4wNTI1MiwwLjUyNTk2IC0yNC40ODk2OCwtMC4xNTM1MiAtMjkuODYwMzQsLTEuNTA5OCB6IgogICBpZD0icGF0aDUzIgogICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIiAvPjxwYXRoCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIuNTkzMjIwMjMiCiAgIGQ9Im0gMjQyLjQ2NjEsNTYxLjM4NTg0IGMgLTkuNzgzNiwtMi4zNzY4MSAtMjIuNjYxODUsLTE0LjQzODg2IC0yNy43ODc2LC0yNi4wMjY0NiAtMTMuMzQ4NTIsLTMwLjE3NjU0IDEyLjIyNzA1LC02My45MjA5OCA0NS4xMDQ2OCwtNTkuNTExMTYgMjcuMTM2ODEsMy42Mzk4MSA0NS4xNTkwNSwzMi45NjU1NSAzNS42Nzg5Niw1OC4wNTY2OSAtNy45MjI2MiwyMC45Njg5NiAtMzAuODU0MTYsMzIuODYwMDQgLTUyLjk5NjA0LDI3LjQ4MDkzIHoiCiAgIGlkPSJwYXRoNTUiCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiIC8+PC9zdmc+';

const USER = "Scratcher";
const CLIENT = "Scratch 3.0";

var robots = {};	// robot name to client map
var names = [];		// sorted robot names

class Scratch3DreamBlocks {
    static get EXTENSION_ID() {
        return 'dream';
    }

	constructor() {
		console.log("Edbot Dream extension constructor");
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

			var names = client.getRobotNames("dream");
			for(var i = 0; i < names.length; i++) {
				robots[names[i]] = client;
			}
			return Promise.resolve(client.getRemoteServers());
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
								var names = client.getRobotNames("dream");
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
						if(!confirm("No Edbot Dreams found.\nContinue in Demo mode?")) {
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
			var names = client.getRobotNames("dream");
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
	}

	getInfo() {
		return {
			id: Scratch3DreamBlocks.EXTENSION_ID,
			name: "Edbot Dream",
            blockIconURI: blockIconURI,
			blocks: [
				{
					opcode: "setMotor",
					text: "[NAME] set [PORT] motor speed [SPEED] [DIRECTION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PORT: {
							type: ArgumentType.NUMBER,
							menu: "portsAllMenu",
							defaultValue: 1
						},
						SPEED: {
							type: ArgumentType.NUMBER,
							defaultValue: 100
						},
						DIRECTION: {
							type: ArgumentType.NUMBER,
							menu: "directionMenu",
							defaultValue: -1
						}
					}
				},
				{
					opcode: "setServoTorque",
					text: "[NAME] set [PORT] servo [TOGGLE]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PORT: {
							type: ArgumentType.NUMBER,
							menu: "ports34Menu",
							defaultValue: 3
						},
						TOGGLE: {
							type: ArgumentType.NUMBER,
							defaultValue: 0
						}
					}
				},
				{
					opcode: "setServoPosition",
					text: "[NAME] set [PORT] servo position [POSITION] speed [SPEED]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PORT: {
							type: ArgumentType.NUMBER,
							menu: "ports34Menu",
							defaultValue: 3
						},
						POSITION: {
							type: ArgumentType.NUMBER,
							defaultValue: 150
						},
						SPEED: {
							type: ArgumentType.NUMBER,
							defaultValue: 100
						}
					}
				},
				{
					opcode: "setMotors",
					text: "[NAME] set motor speeds [PATH]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PATH: {
							type: ArgumentType.STRING,
							defaultValue: "1/50/2/50/3/50/4/50"
						}
					}
				},
				{
					opcode: "setTorque",
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
							defaultValue: "3/0/4/0"
						}
					}
				},
				{
					opcode: "setPosition",
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
							defaultValue: "3/150/50/4/150/100"
						}
					}
				},
				{
					opcode: "setLEDModule",
					text: "[NAME] set [PORT] LED module [VALUE]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PORT: {
							type: ArgumentType.NUMBER,
							menu: "ports34Menu",
							defaultValue: 3
						},
						VALUE: {
							type: ArgumentType.NUMBER,
							defaultValue: 0
						}
					}
				},
				{
					opcode: "setBuzzerNote",
					text: "[NAME] buzzer pitch [PITCH] duration [DURATION]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PITCH: {
							type: ArgumentType.NUMBER,
							defaultValue: 0
						},
						DURATION: {
							type: ArgumentType.NUMBER,
							defaultValue: 3
						}
					}
				},
				{
					opcode: "setBuzzerMelody",
					text: "[NAME] buzzer melody [MELODY]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						MELODY: {
							type: ArgumentType.NUMBER,
							defaultValue: 0
						}
					}
				},
				"---",
				{
					opcode: "getPort34",
					text: "[NAME] [PORT] [UNITS_ALL]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						PORT: {
							type: ArgumentType.NUMBER,
							menu: "ports34Menu",
							defaultValue: 3
						},
						UNITS_ALL: {
							type: ArgumentType.NUMBER,
							menu: "unitsAllMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "getLeftIR",
					text: "[NAME] left [UNITS_IR]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						UNITS_IR: {
							type: ArgumentType.NUMBER,
							menu: "unitsIRMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "getRightIR",
					text: "[NAME] right [UNITS_IR]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						UNITS_IR: {
							type: ArgumentType.NUMBER,
							menu: "unitsIRMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "getCentreIR",
					text: "[NAME] centre [UNITS_IR]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						UNITS_IR: {
							type: ArgumentType.NUMBER,
							menu: "unitsIRMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "getClapCount",
					text: "[NAME] clap count [CLAP]",
					blockType: BlockType.COMMAND,
					arguments: {
						NAME: {
							type: ArgumentType.STRING,
							menu: "nameMenu",
							defaultValue: names[0]
						},
						CLAP: {
							type: ArgumentType.NUMBER,
							menu: "clapMenu",
							defaultValue: 0
						}
					}
				},
				{
					opcode: "clapCountReset",
					text: "[NAME] clap count reset",
					blockType: BlockType.COMMAND,
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
				directionMenu: [
					{ text: "clockwise", value: -1 },
					{ text: "anti-clockwise", value: 1 }
				],
				toggleMenu: [
					{ text: "off", value: 0 },
					{ text: "on", value: 1 }
				],
				ports34Menu: [
					{ text: "port-3", value: 3 },
					{ text: "port-4", value: 4 }
				],
				portsAllMenu: [
					{ text: "port-1", value: 1 },
					{ text: "port-2", value: 2 },
					{ text: "port-3", value: 3 },
					{ text: "port-4", value: 4 }
				],
				unitsIRMenu: [
					{ text: "IR-sensor", value: 0 },
					{ text: "IR-raw-value", value: 1 }
				],
				unitsAllMenu: [
					{ text: "servo-position", value: 0 },
					{ text: "IR-sensor", value: 1 },
					{ text: "DMS-sensor", value: 2 },
					{ text: "temperature-sensor", value: 3 },
					{ text: "touch-sensor", value: 4 },
					{ text: "magnetic-sensor", value: 5 },
					{ text: "raw-value", value: 6 }
				],
				clapMenu: [
					{ text: "live", value: 0 },
					{ text: "last", value: 1 }
				],
				statusMenu: [
					{ text: "connected", value: 0 },
					{ text: "enabled", value: 1 }
				]
			}
		};
	}

	setMotor(args) {
		const { NAME, PORT, SPEED, DIRECTION } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoCombined(NAME, PORT + "/0/" + (SPEED * DIRECTION) + "/0")
				.then(function(status) {
					console.log(status);
				});
	}

	setServoTorque(args) {
		const { NAME, PORT, TOGGLE } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoTorque(NAME, PORT + "/" + TOGGLE)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoPosition(args) {
		const { NAME, PORT, POSITION, SPEED } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoCombined(NAME, PORT + "/1/" + SPEED + "/" + POSITION)
				.then(function(status) {
					console.log(status);
				});
	}

	setMotors(args) {
		const { NAME, PATH } = args;
		var parts = PATH.split("/");
		if((parts.length % 2) != 0) {
			console.log("Invalid number of parameters");
			return;
		}
		var path = "";
		for(i = 0; i < parts.length; i += 2) {
			if(i > 0) {
				path += "/";
			}
			path += parts[i] + "/0/" + parts[i + 1] + "/0";
		}
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoCombined(NAME, path)
				.then(function(status) {
					console.log(status);
				});
	}

	setTorque(args) {
		const { NAME, PATH } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoTorque(NAME, PATH)
				.then(function(status) {
					console.log(status);
				});
	}

	setPosition(args) {
		const { NAME, PATH } = args;
		var parts = PATH.split("/");
		if((parts.length % 3) != 0) {
			console.log("Invalid number of parameters");
			return;
		}
		var path = "";
		for(i = 0; i < parts.length; i += 3) {
			if(i > 0) {
				path += "/";
			}
			path += parts[i] + "/1/" + parts[i + 2] + "/" + parts[i + 1];
		}
		var client = this.getClient(NAME);
		if(client != null)
			return client.setServoCombined(NAME, path)
				.then(function(status) {
					console.log(status);
				});
	}

	setLEDModule(args) {
		const { NAME, PORT, VALUE } = args;
		var address = 212;		// default port 3
		if(PORT == 4) {
			address = 213;
		}
		var client = this.getClient(NAME);
		if(client != null)
			return client.setCustom(NAME, address + "/1/" + VALUE)
				.then(function(status) {
					console.log(status);
				});
	}

	setBuzzerNote(args) {
		const { NAME, PITCH, DURATION } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setBuzzer(NAME, PITCH + "/" + DURATION)
				.then(function(status) {
					console.log(status);
				});
	}

	setBuzzerMelody(args) {
		const { NAME, MELODY } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setBuzzer(NAME, MELODY + "/255")
				.then(function(status) {
					console.log(status);
				});
	}

	getPort34(args) {
		const { NAME, PORT, UNITS_ALL } = args;
		try {
			var client = this.getClient(NAME);
			var raw = client.getData().robots[NAME].reporters["port3"];
			if(PORT == 4) {
				raw = client.getData().robots[NAME].reporters["port4"];
			}
			switch(UNITS_ALL) {
				case 0:
					return edbot.util.rawToSM10Angle(raw);
				case 1:
					return edbot.util.rawToIRSS10Dist(raw);
				case 2:
					return edbot.util.rawToDMS80Dist(raw);
				case 3:
					return edbot.util.rawToTPS10Temp(raw);
				case 4:
					return edbot.util.rawToTS10Touch(raw);
				case 5:
					return edbot.util.rawToMGSS10Mag(raw);
				case 6:
				default:
					return raw;
			}
		} catch(e) {
			return 0;
		}
	}

	getLeftIR(args) {
		const { NAME, UNITS_IR } = args;
		try {
			var client = this.getClient(NAME);
			if(UNITS_IR == 0) {
				var raw = client.getData().robots[NAME].reporters["leftIR"];
				return edbot.util.rawToCM150Dist(raw);
			} else {
				return client.getData().robots[NAME].reporters["leftIR"];
			}
		} catch(e) {
			return 0;
		}
	}

	getRightIR(args) {
		const { NAME, UNITS_IR } = args;
		try {
			var client = this.getClient(NAME);
			if(UNITS_IR == 0) {
				var raw = client.getData().robots[NAME].reporters["rightIR"];
				return edbot.util.rawToCM150Dist(raw);
			} else {
				return client.getData().robots[NAME].reporters["rightIR"];
			}
		} catch(e) {
			return 0;
		}
	}

	getCentreIR(args) {
		const { NAME, UNITS_IR } = args;
		try {
			var client = this.getClient(NAME);
			if(UNITS_IR == 0) {
				var raw = client.getData().robots[NAME].reporters["centreIR"];
				return edbot.util.rawToCM150Dist(raw);
			} else {
				return client.getData().robots[NAME].reporters["centreIR"];
			}
		} catch(e) {
			return 0;
		}
	}

	getClapCount(args) {
		const { NAME, CLAP } = args;
		try {
			var client = this.getClient(NAME);
			if(CLAP == 0) {
				return client.getData().robots[NAME].reporters["clapCountLive"];
			} else {
				return client.getData().robots[NAME].reporters["clapCountLast"];
			}
		} catch(e) {
			return 0;
		}
	}

	clapCountReset(args) {
		const { NAME } = args;
		var client = this.getClient(NAME);
		if(client != null)
			return client.setCustom(NAME, "86/1/0")
				.then(function(status) {
					console.log(status);
				});
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
		try {
			var client = this.getClient(NAME);
			const { NAME, STATUS } = args;
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

module.exports = Scratch3DreamBlocks;