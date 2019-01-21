/*
 * Edbot Dream Scratch 3.0 extension.
 */
 
const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const edbot = require("edbot");

const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iQ2FwYV8xIgogICB4PSIwcHgiCiAgIHk9IjBweCIKICAgd2lkdGg9IjYxMnB4IgogICBoZWlnaHQ9IjYxMnB4IgogICB2aWV3Qm94PSIwIDAgNjEyIDYxMiIKICAgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjEyIDYxMjsiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImVkYm90LWRyZWFtLXNtYWxsLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45Mi4zICgyNDA1NTQ2LCAyMDE4LTAzLTExKSI+PG1ldGFkYXRhCiAgIGlkPSJtZXRhZGF0YTQ1Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzCiAgIGlkPSJkZWZzNDMiIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICBib3JkZXJvcGFjaXR5PSIxIgogICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICBncmlkdG9sZXJhbmNlPSIxMCIKICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSI3NzAiCiAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjY1NSIKICAgaWQ9Im5hbWVkdmlldzQxIgogICBzaG93Z3JpZD0iZmFsc2UiCiAgIGlua3NjYXBlOnpvb209IjAuMzg1NjIwOTIiCiAgIGlua3NjYXBlOmN4PSIzMDYiCiAgIGlua3NjYXBlOmN5PSIzMDYiCiAgIGlua3NjYXBlOndpbmRvdy14PSIyNDciCiAgIGlua3NjYXBlOndpbmRvdy15PSI0NCIKICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIKICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0iQ2FwYV8xIiAvPgo8ZwogICBpZD0iZzgiPgoJPGcKICAgaWQ9Imc2Ij4KCQk8cGF0aAogICBkPSJNMjU0LjQxNyw0NTguNzk5Yy0zMy4xODcsMC02MC4xODcsMjcuMDEtNjAuMTg3LDYwLjIwOWMwLDMzLjE4OCwyNyw2MC4xODgsNjAuMTg3LDYwLjE4OHM2MC4xODctMjcsNjAuMTg3LTYwLjE4OCAgICBDMzE0LjYwNCw0ODUuODA5LDI4Ny42MDQsNDU4Ljc5OSwyNTQuNDE3LDQ1OC43OTl6IE0yNTQuNDE3LDU2NC4xNDVjLTI0Ljg4NCwwLTQ1LjEzMi0yMC4yNDgtNDUuMTMyLTQ1LjEzMyAgICBjMC0yNC45LDIwLjI0NC00NS4xNTYsNDUuMTMyLTQ1LjE1NmMyNC44ODksMCw0NS4xMzMsMjAuMjU2LDQ1LjEzMyw0NS4xNTZDMjk5LjU0OSw1NDMuODk2LDI3OS4zMDEsNTY0LjE0NSwyNTQuNDE3LDU2NC4xNDV6IgogICBpZD0icGF0aDIiIC8+CgkJPHBhdGgKICAgZD0iTTYxMiwxODEuODgzYzAtODIuMi02Ni44NzktMTQ5LjA3OS0xNDkuMDgyLTE0OS4wNzljLTM5LjEsMC03NS42NTksMTQuODkzLTEwMy42MzgsNDIuMDc3ICAgIGMtMjEuMjc1LTEzLjE4OC00NS42MjktMjAuMTI3LTcwLjgzLTIwLjEyN2MtNjIuMzk2LDAtMTE1LjQxNyw0MS45MDctMTMwLjQ2LDEwMS4yODVjLTE2Ljc3LTExLjYwNi0zNi42NjEtMTcuODkyLTU3LjE3Ni0xNy44OTIgICAgQzQ1LjIyNywxMzguMTQ3LDAsMTgzLjM2MiwwLDIzOC45MzhjMCw1NC4xOTIsNDMuMDEsOTguNTM0LDk2LjY5MywxMDAuNzAyYzIuNzQsNTkuODE0LDUyLjI2NSwxMDcuNjIzLDExMi43NDksMTA3LjYyMyAgICBjMjcuNDg5LDAsNTMuMzY4LTkuNzM2LDczLjg3NS0yNy42MDljMjEuNTEzLDM0Ljg2OSw1OS4yMTIsNTYuMTQxLDEwMC42LDU2LjE0MWM2NS4yNiwwLDExOC4zNTMtNTMuMDg2LDExOC4zNTMtMTE4LjM0MiAgICBjMC0xMC4zMjQtMS4zOTYtMjAuNjQzLTQuMTYyLTMwLjc4OUM1NjQuNTkxLDMxMC42MDcsNjEyLDI1MS4wMTYsNjEyLDE4MS44ODN6IE00ODcuMTI5LDMxMy42MDcgICAgYy0yLjE2NCwwLjM5NS00LjA0NiwxLjcxNy01LjE1MiwzLjYxN3MtMS4zMjgsNC4xODktMC42MDYsNi4yNjZjMy44ODEsMTEuMTI5LDUuODQ2LDIyLjU1NSw1Ljg0NiwzMy45NTkgICAgYzAsNTYuOTU1LTQ2LjM0MSwxMDMuMjg3LTEwMy4yOTksMTAzLjI4N2MtMzkuMDMyLDAtNzQuMzA4LTIxLjY5My05Mi4wNjQtNTYuNjA3Yy0xLjEwMy0yLjE3Mi0zLjE4OC0zLjY3NC01LjU5Mi00LjAzMSAgICBjLTAuMzczLTAuMDYxLTAuNzQ1LTAuMDgyLTEuMTE0LTAuMDgyYy0yLjAyOCwwLTMuOTg1LDAuODItNS40MTYsMi4yOTVjLTE4LjYxMSwxOS4yNzctNDMuNTc1LDI5Ljg5NS03MC4yODUsMjkuODk1ICAgIGMtNTMuOTM2LDAtOTcuODExLTQzLjg2Ny05Ny44MTEtOTcuNzkzYzAtMC4yODksMC4wMjItMC41NzIsMC4wNDItMC44NTdjMC4wMjYtMC40MzgsMC4wNTYtMC44NzcsMC4wNjctMS4zMjQgICAgYzAuMDUzLTIuMDY2LTAuNzQ5LTQuMDY0LTIuMjEzLTUuNTI1Yy0xLjQ2NC0xLjQ2MS0zLjQ4OS0yLjM2My01LjUyOS0yLjE5MWMtMC41NjgsMC4wMTYtMS4xMjksMC4wNDktMS42ODYsMC4wODQgICAgYy0wLjQ5NywwLjAyOS0wLjk5LDAuMDY2LTEuNDk0LDAuMDY2Yy00Ny4yOTYsMC4wMDgtODUuNzY4LTM4LjQ1MS04NS43NjgtODUuNzI2YzAtNDcuMjc0LDM4LjQ3MS04NS43MzQsODUuNzYtODUuNzM0ICAgIGMyMS4wMjcsMCw0MS4yOTQsNy43NzIsNTcuMDcxLDIxLjg4OWMyLjA1MSwxLjg0LDQuOTM4LDIuNDA1LDcuNTQyLDEuNDg2YzIuNTkzLTAuOTI2LDQuNDc5LTMuMTk1LDQuOTEyLTUuOTEzICAgIGM5LjI3My01OC40NCw1OC45NDgtMTAwLjg1OSwxMTguMTEyLTEwMC44NTljMjQuMjYzLDAsNDcuNjQzLDcuMjQxLDY3LjYwNSwyMC45MzdjMy4wNTIsMi4wOTMsNy4xNzMsMS42NTIsOS43MTctMS4wMjMgICAgYzI1LjYxOS0yNi45OTYsNjAuMTE5LTQxLjg2Miw5Ny4xNDYtNDEuODYyYzczLjkwNSwwLDEzNC4wMzEsNjAuMTI2LDEzNC4wMzEsMTM0LjAyNCAgICBDNTk2Ljk0NSwyNDYuNTgzLDU1MC43NiwzMDEuOTgyLDQ4Ny4xMjksMzEzLjYwN3oiCiAgIGlkPSJwYXRoNCIgLz4KCTwvZz4KPC9nPgo8ZwogICBpZD0iZzEwIj4KPC9nPgo8ZwogICBpZD0iZzEyIj4KPC9nPgo8ZwogICBpZD0iZzE0Ij4KPC9nPgo8ZwogICBpZD0iZzE2Ij4KPC9nPgo8ZwogICBpZD0iZzE4Ij4KPC9nPgo8ZwogICBpZD0iZzIwIj4KPC9nPgo8ZwogICBpZD0iZzIyIj4KPC9nPgo8ZwogICBpZD0iZzI0Ij4KPC9nPgo8ZwogICBpZD0iZzI2Ij4KPC9nPgo8ZwogICBpZD0iZzI4Ij4KPC9nPgo8ZwogICBpZD0iZzMwIj4KPC9nPgo8ZwogICBpZD0iZzMyIj4KPC9nPgo8ZwogICBpZD0iZzM0Ij4KPC9nPgo8ZwogICBpZD0iZzM2Ij4KPC9nPgo8ZwogICBpZD0iZzM4Ij4KPC9nPgo8cGF0aAogICBzdHlsZT0iZmlsbDojZmZmZmZmO3N0cm9rZS13aWR0aDoyLjU5MzIyMDIzIgogICBkPSJtIDM1OS43NjkwNSw0NTYuODYyNTkgYyAtMjQuMDUwOSwtNi4wNzM5NCAtNDYuMzE0NjMsLTIxLjg5ODY4IC02MC4xNjQwNCwtNDIuNzYzNjYgLTUuMzQ4MDUsLTguMDU3MjEgLTExLjM3Mzk0LC0xNC4yMjQzNSAtMTMuODk4NTQsLTE0LjIyNDM1IC0yLjQ1MTM1LDAgLTguNzUxNTIsMy41Mzk5MiAtMTQuMDAwNDEsNy44NjY1IC01LjI0ODg4LDQuMzI2NTYgLTE2LjMwOTA0LDExLjAzNjUyIC0yNC41NzgxMywxNC45MTEwMiAtMTIuOTk5OTksNi4wOTExNCAtMTguMTkzMjksNy4wMjE5MiAtMzguMzczNjksNi44Nzc1NiAtMTkuMzI1NzksLTAuMTM4MjIgLTI1Ljc5MTQ5LC0xLjMwMzEyIC0zNy42MDE3LC02Ljc3NDQ1IC0zMS42MzY3MiwtMTQuNjU2MzcgLTUyLjU4NTg0LC00My4xNDYyMSAtNTYuODgxMzksLTc3LjM1NjEzIC0xLjI4MjMxLC0xMC4yMTIzMyAtMi43MjAyMywtMTguOTMwNTYgLTMuMTk1MzgsLTE5LjM3MzgyIC0wLjQ3NTE1LC0wLjQ0MzI4IC04LjgyMjM4LC0yLjAzMTYgLTE4LjU0OTM5OSwtMy41Mjk2NiBDIDcwLjM0NDYyMywzMTkuMDc5NDggNTUuMjExMzEzLDMxMS44MzE2NiA0MS4yMzA3ODcsMjk3LjkyODU1IDguMzgwODExNCwyNjUuMjYwNTEgOC40OTcwNDM0LDIxMi40NDUzMyA0MS40OTE1MjUsMTc5LjQ1MDg1IGMgMjguMjk4OCwtMjguMjk4OCA3My42MzYxNTUsLTMyLjY0OTQ0IDEwNS45NTM0MjUsLTEwLjE2NzQ0IDE2Ljg0ODQ3LDExLjcyMDkgMjAuOTIwMTgsOS44OTQ5IDI3LjcyMjkxLC0xMi40MzI2NCAxMC40MjcyMiwtMzQuMjIzNTkgMzEuNjAzMzIsLTU5LjIyNTcyNSA2Mi41NTgzNiwtNzMuODYxMjIxIDM0LjEyMDgzLC0xNi4xMzIyNzYgNzEuMDUzNTYsLTE1LjQ1NDYwNyAxMDUuMTY1MjQsMS45Mjk2NDkgOS42NjQ4Myw0LjkyNTQ1OSAxOC4wNTkxOSw4Ljk1NTM3OCAxOC42NTQxNSw4Ljk1NTM3OCAwLjU5NDk3LDAgNy4wMjQ3OCwtNS4wNzI4OTEgMTQuMjg4NTIsLTExLjI3MzA5NCAzNC4zNzk3NSwtMjkuMzQ2MDMgNzguMzY2NTIsLTM5Ljg1NjkzNiAxMjAuNjc2OTEsLTI4LjgzNjQ4MSA2My41MTUwNCwxNi41NDM1NjkgMTA3LjQ4NDI2LDgyLjQ4MTE0OSA5Ny42NDUxMSwxNDYuNDMxNjA5IC03Ljc4MTgxLDUwLjU3ODcgLTQzLjEzODI0LDkyLjI1MDUzIC05MS4xOTgxMSwxMDcuNDg4MDUgLTIzLjkzMzg0LDcuNTg4MjggLTI0LjU1OTM1LDguMzQxMiAtMjAuNjA5MzEsMjQuODA2ODIgNC45NzI4NCwyMC43MjkxMiAyLjI2MjQzLDUwLjE0ODk0IC02LjI3MTMxLDY4LjA3MTI2IC0xNi4xMDIxMSwzMy44MTcxMiAtNDkuMzM5NjcsNTYuMDQzODIgLTg2LjQ0ODAzLDU3LjgwOTY1IC0xMS4wNTI1MiwwLjUyNTk2IC0yNC40ODk2OCwtMC4xNTM1MiAtMjkuODYwMzQsLTEuNTA5OCB6IgogICBpZD0icGF0aDUzIgogICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIiAvPjxwYXRoCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIuNTkzMjIwMjMiCiAgIGQ9Im0gMjQyLjQ2NjEsNTYxLjM4NTg0IGMgLTkuNzgzNiwtMi4zNzY4MSAtMjIuNjYxODUsLTE0LjQzODg2IC0yNy43ODc2LC0yNi4wMjY0NiAtMTMuMzQ4NTIsLTMwLjE3NjU0IDEyLjIyNzA1LC02My45MjA5OCA0NS4xMDQ2OCwtNTkuNTExMTYgMjcuMTM2ODEsMy42Mzk4MSA0NS4xNTkwNSwzMi45NjU1NSAzNS42Nzg5Niw1OC4wNTY2OSAtNy45MjI2MiwyMC45Njg5NiAtMzAuODU0MTYsMzIuODYwMDQgLTUyLjk5NjA0LDI3LjQ4MDkzIHoiCiAgIGlkPSJwYXRoNTUiCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiIC8+PC9zdmc+';

var ec = null;
var rn = null;

class Scratch3DreamBlocks {
    static get EXTENSION_ID() {
        return 'dream';
    }

	constructor() {
		console.log("Edbot Dream extension constructor");
	}

	init() {
		var server = "localhost";
		var port = 8080;
		var instance = this;
		return new edbot.EdbotClient(server, port, {
			user: "Scratcher",
			client: "Scratch 3.0",
			onopen: function(event) {
				console.log("Connected to server " + server + ":" + port);
			},
			onclose: function(event) {
				console.log("Connection to server closed");
			}
		}).connect().then(function(client) {
			ec = client;
			rn = ec.getRobotNames("dream");
			if(rn.length < 1) {
				if(!confirm("No Edbot Dreams found on the network.\nContinue in Demo mode?")) {
					return Promise.reject();
				}
				rn = [ "Demo" ];
			}
			return Promise.resolve();
		})
		.catch(err => {
			if(!confirm("Could not find an Edbot server on the network.\nContinue in Demo mode?")) {
				return Promise.reject();
			}
			rn = [ "Demo" ];
		});
	}

	/*
	 * Return metadata for the extension.
	 */
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
						},
						PORT: {
							type: ArgumentType.STRING,
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
						},
						MELODY: {
							type: ArgumentType.NUMBER,
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
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
							defaultValue: rn[0]
						},
						STATUS: {
							type: ArgumentType.NUMBER,
							menu: "statusMenu",
							defaultValue: 1
						}
					}
				}
			],
			menus: {
				nameMenu: rn.map(name => ({ text: name, value: name })),
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
					{ text: "connected", value: 1 },
					{ text: "enabled", value: 2 }
				]
			}
		};
	}

	setMotor(args) {
		const { NAME, PORT, SPEED, DIRECTION } = args;
		if(ec != null)
			return ec.setServoCombined(NAME, PORT + "/0/" + (SPEED * DIRECTION) + "/0")
				.then(function(status) {
					console.log(status);
				});
	}

	setServoTorque(args) {
		const { NAME, PORT, TOGGLE } = args;
		if(ec != null)
			return ec.setServoTorque(NAME, PORT + "/" + TOGGLE)
				.then(function(status) {
					console.log(status);
				});
	}

	setServoPosition(args) {
		const { NAME, PORT, POSITION, SPEED } = args;
		if(ec != null)
			return ec.setServoCombined(NAME, PORT + "/1/" + SPEED + "/" + POSITION)
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
		if(ec != null)
			return ec.setServoCombined(NAME, path)
				.then(function(status) {
					console.log(status);
				});
	}

	setTorque(args) {
		const { NAME, PATH } = args;
		if(ec != null)
			return ec.setServoTorque(NAME, PATH)
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
		if(ec != null)
			return ec.setServoCombined(NAME, path)
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
		if(ec != null)
			return ec.setCustom(NAME, address + "/1/" + VALUE)
				.then(function(status) {
					console.log(status);
				});
	}

	setBuzzerNote(args) {
		const { NAME, PITCH, DURATION } = args;
		if(ec != null)
			return ec.setBuzzer(NAME, PITCH + "/" + DURATION)
				.then(function(status) {
					console.log(status);
				});
	}

	setBuzzerMelody(args) {
		const { NAME, MELODY } = args;
		if(ec != null)
			return ec.setBuzzer(NAME, MELODY + "/255")
				.then(function(status) {
					console.log(status);
				});
	}

	say(args) {
		const { NAME, TEXT } = args;
		if(ec != null)
			return ec.say(NAME, TEXT)
				.then(function(status) {
					console.log(status);
				});
	}

	sayWait(args) {
		const { NAME, TEXT } = args;
		if(ec != null)
			return ec.say(NAME, TEXT)
				.then(function(status) {
					console.log(status);
				});
	}

	getCurrentWord(args) {
		try {
			var word = ec.getData().robots[args.NAME].reporters["speechCurrentWord"];
			if(word != null) {
				return word;
			}
			return "";
		} catch(e) {
			return "";
		}
	}

	reset(args) {
		if(ec != null)
			return ec.reset(args.NAME)
				.then(function(status) {
					console.log(status);
				});
	}

	getStatus(args) {
		try {
			const { NAME, STATUS } = args;
			if(STATUS == 1) {
				return ec.getData().robots[NAME].connected;
			} else if(STATUS == 2) {
				return ec.getData().robots[NAME].enabled;
			} else {
				return false;
			}
		} catch(e) {
			return false;
		}
	}
}

module.exports = Scratch3DreamBlocks;