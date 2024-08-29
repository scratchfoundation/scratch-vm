require('regenerator-runtime/runtime');
const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const Video = require('../../io/video');

const VideoMotion = require('./library');

const tmImage = require('@teachablemachine/image');
const tmPose = require('@teachablemachine/pose');
const tmAudioSpeechCommands = require('@tensorflow-models/speech-commands');

/**
 * Icon svg to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIKCSBpZD0ic3ZnMTE3IiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQwIDQwIgoJIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe29wYWNpdHk6MC4yNTtmaWxsOiMwRUJEOEM7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Qxe29wYWNpdHk6MC41O2ZpbGw6IzBFQkQ4QztlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDJ7b3BhY2l0eTowLjc1O2ZpbGw6IzBFQkQ4QztlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDN7ZmlsbDojMEVCRDhDO30KCS5zdDR7ZmlsbDojNDY5MkZGO30KCS5zdDV7ZmlsbDojMEI2NEU1O30KCS5zdDZ7ZmlsbDojRkRBMjJFO30KCS5zdDd7ZmlsbDojRTUwMDIzO30KCS5zdDh7ZmlsbDojMTcxNTI2O30KPC9zdHlsZT4KPGNpcmNsZSBpZD0iT3ZhbC1Db3B5IiBjbGFzcz0ic3QwIiBjeD0iNzcuOSIgY3k9IjIuNiIgcj0iNC41Ii8+CjxjaXJjbGUgaWQ9Ik92YWwtQ29weV8xXyIgY2xhc3M9InN0MSIgY3g9IjcxLjciIGN5PSIxIiByPSI0LjUiLz4KPGNpcmNsZSBpZD0iT3ZhbC1Db3B5XzJfIiBjbGFzcz0ic3QyIiBjeD0iNjYuMiIgY3k9IjEiIHI9IjQuNSIvPgo8Y2lyY2xlIGlkPSJPdmFsIiBjbGFzcz0ic3QzIiBjeD0iNjAuMiIgY3k9IjMuNCIgcj0iNC41Ii8+Cjxzb2RpcG9kaTpuYW1lZHZpZXcgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IiBib3JkZXJvcGFjaXR5PSIxIiBncmlkdG9sZXJhbmNlPSIxMCIgZ3VpZGV0b2xlcmFuY2U9IjEwIiBpZD0ibmFtZWR2aWV3MTE5IiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJFeHRlbnNpb25zL1NvZnR3YXJlL1ZpZGVvLVNlbnNpbmctQmxvY2siIGlua3NjYXBlOmN4PSIxNC40NjcwNjkiIGlua3NjYXBlOmN5PSI2LjU5MDMwNTYiIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIiBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIgaW5rc2NhcGU6c25hcC1zbW9vdGgtbm9kZXM9ImZhbHNlIiBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5MDciIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjAiIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTYwMCIgaW5rc2NhcGU6d2luZG93LXg9IjU3MSIgaW5rc2NhcGU6d2luZG93LXk9Ijk2IiBpbmtzY2FwZTp6b29tPSI3LjA0IiBvYmplY3R0b2xlcmFuY2U9IjEwIiBwYWdlY29sb3I9IiNmZmZmZmYiIHNob3dncmlkPSJmYWxzZSI+Cgk8L3NvZGlwb2RpOm5hbWVkdmlldz4KPHRpdGxlICBpZD0idGl0bGUxMDQiPkV4dGVuc2lvbnMvU29mdHdhcmUvVmlkZW8tU2Vuc2luZy1CbG9jazwvdGl0bGU+CjxkZXNjICBpZD0iZGVzYzEwNiI+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CjxnPgoJPGc+CgkJPHBhdGggY2xhc3M9InN0NCIgZD0iTTQ3LjMsMjEuNmMtMC45LTMuNy0yLjgtNC45LTIuOS02Yy0wLjEtMC42LDEtMS40LDIuNC0wLjljMS40LDAuNSwxLjksMS40LDMuMSwyLjljMS4zLDEuNSwyLjEsMi45LDIuOCwyLjQKCQkJYzAsMCwxLjUtMS44LDEuOC0yLjNjMC40LTAuOSwyLjUtNy40LDMuOC0xMC4yYzEuMi0yLjUsMi45LTIuMSwyLjktMS4zYzAuMSwxLjgtMy40LDEzLTMuNCwxM3MzLjYtNy40LDQuOC05LjkKCQkJYzEuMi0yLjQsMy40LTEuOSwzLjItMS4yYy0xLjEsMy4yLTUuMSwxMy40LTUuMSwxMy40czQuNC03LjcsNS4yLTljMS0xLjYsMi45LTEuNywyLjktMC43YzAsMC43LTUuMywxMS45LTUuMywxMS45CgkJCXMzLjQtNS41LDQuNC02LjhjMC45LTEuMiwyLjktMS41LDIuNS0wLjNjLTAuMywxLTUuMywxMC4yLTUuOCwxMWMtMC45LDEuOS0yLjYsMy41LTQuMyw1LjFjLTEuOCwxLjctMy45LDIuMi00LjksMi40CgkJCWMtMC40LDAuMS0wLjgsMC0xLjEtMC4zbC01LjktNC42Yy0wLjMtMC4yLTAuNS0wLjYtMC41LTAuOUM0Ny42LDI4LjQsNDguMywyNS42LDQ3LjMsMjEuNnoiLz4KCTwvZz4KPC9nPgo8Zz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIyMC42IiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIyNi4xIiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIzMS41IiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIzNyIgcj0iMS4yIi8+Cgk8Y2lyY2xlIGNsYXNzPSJzdDUiIGN4PSIzNi4zIiBjeT0iMTUuMiIgcj0iMS4yIi8+Cgk8Y2lyY2xlIGNsYXNzPSJzdDUiIGN4PSIzNi4zIiBjeT0iOS44IiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSI0LjMiIHI9IjEuMiIvPgo8L2c+CjxjaXJjbGUgY2xhc3M9InN0NCIgY3g9IjQuOSIgY3k9IjQuOSIgcj0iMi40Ii8+CjxjaXJjbGUgY2xhc3M9InN0NCIgY3g9IjQuOSIgY3k9IjEyLjgiIHI9IjIuNCIvPgo8Y2lyY2xlIGNsYXNzPSJzdDQiIGN4PSI0LjkiIGN5PSIyMC42IiByPSIyLjQiLz4KPGNpcmNsZSBjbGFzcz0ic3Q0IiBjeD0iNC45IiBjeT0iMjguNSIgcj0iMi40Ii8+CjxjaXJjbGUgY2xhc3M9InN0NiIgY3g9IjE1LjIiIGN5PSIxMi44IiByPSIyLjQiLz4KPGNpcmNsZSBjbGFzcz0ic3Q2IiBjeD0iMTUuMiIgY3k9IjIwLjYiIHI9IjIuNCIvPgo8Y2lyY2xlIGNsYXNzPSJzdDYiIGN4PSIxNS4yIiBjeT0iMjguNSIgcj0iMi40Ii8+CjxjaXJjbGUgY2xhc3M9InN0NCIgY3g9IjQuOSIgY3k9IjM2LjQiIHI9IjIuNCIvPgo8cGF0aCBjbGFzcz0ic3Q3IiBkPSJNMjMsMzEuNWMtMC43LDAtMS4yLTAuNS0xLjItMS4yVjEwLjRjMC0wLjcsMC41LTEuMiwxLjItMS4yczEuMiwwLjUsMS4yLDEuMnYxOS45QzI0LjIsMzEsMjMuNywzMS41LDIzLDMxLjV6IgoJLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTI2LDEyLjJjMC4yLDAsMC4zLTAuMSwwLjQtMC4ybDcuMS03LjFoMS4xYzAuMywwLjcsMC45LDEuMiwxLjcsMS4yYzEsMCwxLjgtMC44LDEuOC0xLjhzLTAuOC0xLjgtMS44LTEuOAoJYy0wLjgsMC0xLjUsMC41LTEuNywxLjJoLTEuM2MtMC4yLDAtMC4zLDAuMS0wLjQsMC4yTDI1LjgsMTFoLTF2LTAuNmMwLTEtMC44LTEuOC0xLjgtMS44cy0xLjgsMC44LTEuOCwxLjh2MS44aC0zLjEKCWMtMC4zLTEuNC0xLjUtMi40LTMtMi40Yy0wLjgsMC0xLjQsMC4zLTIsMC44TDcuNiw2LjNjMC4yLTAuNCwwLjMtMC44LDAuMy0xLjNjMC0xLjctMS40LTMtMy0zcy0zLDEuNC0zLDNzMS40LDMsMywzCgljMC44LDAsMS40LTAuMywyLTAuOGw1LjYsNC4zYy0wLjEsMC4yLTAuMiwwLjUtMC4zLDAuN0g3LjljLTAuMy0xLjQtMS41LTIuNC0zLTIuNGMtMS43LDAtMywxLjQtMywzczEuNCwzLDMsM2MwLjgsMCwxLjQtMC4zLDItMC44CglMOSwxNi43bC0yLjIsMS43Yy0wLjUtMC41LTEuMi0wLjgtMi0wLjhjLTEuNywwLTMsMS40LTMsM2MwLDEuNywxLjQsMywzLDNjMC44LDAsMS40LTAuMywyLTAuOEw5LDI0LjZsLTIuMiwxLjcKCWMtMC41LTAuNS0xLjItMC44LTItMC44Yy0xLjcsMC0zLDEuNC0zLDNjMCwxLjcsMS40LDMsMywzYzEuNSwwLDIuNy0xLDMtMi40aDQuNGMwLjEsMC4zLDAuMSwwLjUsMC4zLDAuN2wtNS42LDQuMwoJYy0wLjUtMC41LTEuMi0wLjctMi0wLjdjLTEuNywwLTMsMS40LTMsM2MwLDEuNywxLjQsMywzLDNzMy0xLjQsMy0zYzAtMC41LTAuMS0wLjktMC4zLTEuM2w1LjYtNC4zYzAuNSwwLjUsMS4yLDAuNywyLDAuNwoJYzEuNSwwLDIuNy0xLDMtMi40aDMuMXYxLjJjMCwxLDAuOCwxLjgsMS44LDEuOHMxLjgtMC44LDEuOC0xLjhoMWw3LjEsNy4xYzAuMSwwLjEsMC4zLDAuMiwwLjQsMC4yaDEuM2MwLjMsMC43LDAuOSwxLjIsMS43LDEuMgoJYzEsMCwxLjgtMC44LDEuOC0xLjhjMC0xLTAuOC0xLjgtMS44LTEuOGMtMC44LDAtMS41LDAuNS0xLjcsMS4yaC0xLjFsLTcuMS03LjFjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4yaC0xLjJ2LTEuOGgyLjhsNC43LDQuNwoJYzAuMSwwLjEsMC4zLDAuMiwwLjQsMC4yaDEuOWMwLjMsMC43LDAuOSwxLjIsMS43LDEuMmMxLDAsMS44LTAuOCwxLjgtMS44YzAtMS0wLjgtMS44LTEuOC0xLjhjLTAuOCwwLTEuNSwwLjUtMS43LDEuMmgtMS43CglsLTQuNy00LjdjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4yaC0zdi0xLjhIMzBsMi4yLDIuMmMwLjEsMC4xLDAuMywwLjIsMC40LDAuMmgxLjljMC4zLDAuNywwLjksMS4yLDEuNywxLjJjMSwwLDEuOC0wLjgsMS44LTEuOAoJcy0wLjgtMS44LTEuOC0xLjhjLTAuOCwwLTEuNSwwLjUtMS43LDEuMmgtMS43bC0yLjItMi4yYy0wLjEtMC4xLTAuMy0wLjItMC40LTAuMmgtNS40di0xLjhoOS44YzAuMywwLjcsMC45LDEuMiwxLjcsMS4yCgljMSwwLDEuOC0wLjgsMS44LTEuOHMtMC44LTEuOC0xLjgtMS44Yy0wLjgsMC0xLjUsMC41LTEuNywxLjJoLTkuOHYtMS44aDUuNGMwLjIsMCwwLjMtMC4xLDAuNC0wLjJsMi4yLTIuMmgxLjcKCWMwLjMsMC43LDAuOSwxLjIsMS43LDEuMmMxLDAsMS44LTAuOCwxLjgtMS44cy0wLjgtMS44LTEuOC0xLjhjLTAuOCwwLTEuNSwwLjUtMS43LDEuMmgtMS45Yy0wLjIsMC0wLjMsMC4xLTAuNCwwLjJMMzAsMTdoLTUuMgoJdi0xLjhoM2MwLjIsMCwwLjMtMC4xLDAuNC0wLjJsNC43LTQuN2gxLjdjMC4zLDAuNywwLjksMS4yLDEuNywxLjJjMSwwLDEuOC0wLjgsMS44LTEuOFMzNy4zLDgsMzYuMyw4Yy0wLjgsMC0xLjUsMC41LTEuNywxLjJoLTEuOQoJYy0wLjIsMC0wLjMsMC4xLTAuNCwwLjJMMjcuNiwxNGgtMi44di0xLjhIMjZ6IE0zNi4zLDMuN2MwLjMsMCwwLjYsMC4zLDAuNiwwLjZjMCwwLjMtMC4zLDAuNi0wLjYsMC42Yy0wLjMsMC0wLjYtMC4zLTAuNi0wLjYKCUMzNS43LDQsMzYsMy43LDM2LjMsMy43eiBNMzYuMywzNi40YzAuMywwLDAuNiwwLjMsMC42LDAuNmMwLDAuMy0wLjMsMC42LTAuNiwwLjZjLTAuMywwLTAuNi0wLjMtMC42LTAuNgoJQzM1LjcsMzYuNiwzNiwzNi40LDM2LjMsMzYuNHogTTM2LjMsMzAuOWMwLjMsMCwwLjYsMC4zLDAuNiwwLjZzLTAuMywwLjYtMC42LDAuNmMtMC4zLDAtMC42LTAuMy0wLjYtMC42UzM2LDMwLjksMzYuMywzMC45egoJIE0zNi4zLDI1LjVjMC4zLDAsMC42LDAuMywwLjYsMC42cy0wLjMsMC42LTAuNiwwLjZjLTAuMywwLTAuNi0wLjMtMC42LTAuNlMzNiwyNS41LDM2LjMsMjUuNXogTTM2LjMsMjBjMC4zLDAsMC42LDAuMywwLjYsMC42CgljMCwwLjMtMC4zLDAuNi0wLjYsMC42Yy0wLjMsMC0wLjYtMC4zLTAuNi0wLjZTMzYsMjAsMzYuMywyMHogTTM2LjMsMTQuNmMwLjMsMCwwLjYsMC4zLDAuNiwwLjZjMCwwLjMtMC4zLDAuNi0wLjYsMC42CgljLTAuMywwLTAuNi0wLjMtMC42LTAuNkMzNS43LDE0LjksMzYsMTQuNiwzNi4zLDE0LjZ6IE0zNi4zLDkuMmMwLjMsMCwwLjYsMC4zLDAuNiwwLjZzLTAuMywwLjYtMC42LDAuNmMtMC4zLDAtMC42LTAuMy0wLjYtMC42CglTMzYsOS4yLDM2LjMsOS4yeiBNMTguMSwxMy40aDMuMVYyMGgtMy4xYy0wLjMtMS40LTEuNS0yLjQtMy0yLjRjLTAuOCwwLTEuNCwwLjMtMiwwLjhMMTEsMTYuN2wyLjItMS43YzAuNSwwLjUsMS4yLDAuOCwyLDAuOAoJQzE2LjYsMTUuOCwxNy44LDE0LjgsMTguMSwxMy40eiBNMTMuNCwyMC42YzAtMSwwLjgtMS44LDEuOC0xLjhzMS44LDAuOCwxLjgsMS44cy0wLjgsMS44LTEuOCwxLjhTMTMuNCwyMS42LDEzLjQsMjAuNnogTTE1LjIsMTEKCWMxLDAsMS44LDAuOCwxLjgsMS44cy0wLjgsMS44LTEuOCwxLjhzLTEuOC0wLjgtMS44LTEuOFMxNC4yLDExLDE1LjIsMTF6IE00LjksNi44Yy0xLDAtMS44LTAuOC0xLjgtMS44czAuOC0xLjgsMS44LTEuOAoJczEuOCwwLjgsMS44LDEuOFM1LjksNi44LDQuOSw2Ljh6IE00LjksMTQuNmMtMSwwLTEuOC0wLjgtMS44LTEuOFMzLjksMTEsNC45LDExczEuOCwwLjgsMS44LDEuOFM1LjksMTQuNiw0LjksMTQuNnogTTcuNiwxNC4xCgljMC4xLTAuMiwwLjItMC41LDAuMy0wLjdoNC40YzAuMSwwLjMsMC4xLDAuNSwwLjMsMC43TDEwLDE2TDcuNiwxNC4xeiBNMTIuNSwxOS4zYy0wLjEsMC4yLTAuMiwwLjUtMC4zLDAuN0g3LjkKCWMtMC4xLTAuMy0wLjEtMC41LTAuMy0wLjdsMi40LTEuOUwxMi41LDE5LjN6IE00LjksMjIuNWMtMSwwLTEuOC0wLjgtMS44LTEuOHMwLjgtMS44LDEuOC0xLjhzMS44LDAuOCwxLjgsMS44UzUuOSwyMi41LDQuOSwyMi41egoJIE03LjYsMjJjMC4xLTAuMiwwLjItMC41LDAuMy0wLjdoNC40YzAuMSwwLjMsMC4xLDAuNSwwLjMsMC43TDEwLDIzLjhMNy42LDIyeiBNMTIuMiwyNy45SDcuOWMtMC4xLTAuMy0wLjEtMC41LTAuMy0wLjdsMi40LTEuOQoJbDIuNCwxLjlDMTIuMywyNy40LDEyLjMsMjcuNiwxMi4yLDI3Ljl6IE00LjksMzAuM2MtMSwwLTEuOC0wLjgtMS44LTEuOHMwLjgtMS44LDEuOC0xLjhzMS44LDAuOCwxLjgsMS44UzUuOSwzMC4zLDQuOSwzMC4zegoJIE00LjksMzguMmMtMSwwLTEuOC0wLjgtMS44LTEuOGMwLTEsMC44LTEuOCwxLjgtMS44czEuOCwwLjgsMS44LDEuOEM2LjcsMzcuNCw1LjksMzguMiw0LjksMzguMnogTTE1LjIsMzAuM2MtMSwwLTEuOC0wLjgtMS44LTEuOAoJczAuOC0xLjgsMS44LTEuOHMxLjgsMC44LDEuOCwxLjhTMTYuMiwzMC4zLDE1LjIsMzAuM3ogTTE4LjEsMjcuOWMtMC4zLTEuNC0xLjUtMi40LTMtMi40Yy0wLjgsMC0xLjQsMC4zLTIsMC44TDExLDI0LjZsMi4yLTEuNwoJYzAuNSwwLjUsMS4yLDAuOCwyLDAuOGMxLjUsMCwyLjctMSwzLTIuNGgzLjF2Ni42SDE4LjF6IE0yMy42LDMwLjNjMCwwLjMtMC4zLDAuNi0wLjYsMC42Yy0wLjMsMC0wLjYtMC4zLTAuNi0wLjZWMTAuNAoJYzAtMC4zLDAuMy0wLjYsMC42LTAuNmMwLjMsMCwwLjYsMC4zLDAuNiwwLjZWMzAuM3oiLz4KPC9zdmc+Cg==';

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIKCSBpZD0ic3ZnMTE3IiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQwIDQwIgoJIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe29wYWNpdHk6MC4yNTtmaWxsOiMwRUJEOEM7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Qxe29wYWNpdHk6MC41O2ZpbGw6IzBFQkQ4QztlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDJ7b3BhY2l0eTowLjc1O2ZpbGw6IzBFQkQ4QztlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDN7ZmlsbDojMEVCRDhDO30KCS5zdDR7ZmlsbDojNDY5MkZGO30KCS5zdDV7ZmlsbDojMEI2NEU1O30KCS5zdDZ7ZmlsbDojRkRBMjJFO30KCS5zdDd7ZmlsbDojRTUwMDIzO30KCS5zdDh7ZmlsbDojMTcxNTI2O30KPC9zdHlsZT4KPGNpcmNsZSBpZD0iT3ZhbC1Db3B5IiBjbGFzcz0ic3QwIiBjeD0iNzcuOSIgY3k9IjIuNiIgcj0iNC41Ii8+CjxjaXJjbGUgaWQ9Ik92YWwtQ29weV8xXyIgY2xhc3M9InN0MSIgY3g9IjcxLjciIGN5PSIxIiByPSI0LjUiLz4KPGNpcmNsZSBpZD0iT3ZhbC1Db3B5XzJfIiBjbGFzcz0ic3QyIiBjeD0iNjYuMiIgY3k9IjEiIHI9IjQuNSIvPgo8Y2lyY2xlIGlkPSJPdmFsIiBjbGFzcz0ic3QzIiBjeD0iNjAuMiIgY3k9IjMuNCIgcj0iNC41Ii8+Cjxzb2RpcG9kaTpuYW1lZHZpZXcgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IiBib3JkZXJvcGFjaXR5PSIxIiBncmlkdG9sZXJhbmNlPSIxMCIgZ3VpZGV0b2xlcmFuY2U9IjEwIiBpZD0ibmFtZWR2aWV3MTE5IiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJFeHRlbnNpb25zL1NvZnR3YXJlL1ZpZGVvLVNlbnNpbmctQmxvY2siIGlua3NjYXBlOmN4PSIxNC40NjcwNjkiIGlua3NjYXBlOmN5PSI2LjU5MDMwNTYiIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIiBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIgaW5rc2NhcGU6c25hcC1zbW9vdGgtbm9kZXM9ImZhbHNlIiBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5MDciIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjAiIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTYwMCIgaW5rc2NhcGU6d2luZG93LXg9IjU3MSIgaW5rc2NhcGU6d2luZG93LXk9Ijk2IiBpbmtzY2FwZTp6b29tPSI3LjA0IiBvYmplY3R0b2xlcmFuY2U9IjEwIiBwYWdlY29sb3I9IiNmZmZmZmYiIHNob3dncmlkPSJmYWxzZSI+Cgk8L3NvZGlwb2RpOm5hbWVkdmlldz4KPHRpdGxlICBpZD0idGl0bGUxMDQiPkV4dGVuc2lvbnMvU29mdHdhcmUvVmlkZW8tU2Vuc2luZy1CbG9jazwvdGl0bGU+CjxkZXNjICBpZD0iZGVzYzEwNiI+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CjxnPgoJPGc+CgkJPHBhdGggY2xhc3M9InN0NCIgZD0iTTQ3LjMsMjEuNmMtMC45LTMuNy0yLjgtNC45LTIuOS02Yy0wLjEtMC42LDEtMS40LDIuNC0wLjljMS40LDAuNSwxLjksMS40LDMuMSwyLjljMS4zLDEuNSwyLjEsMi45LDIuOCwyLjQKCQkJYzAsMCwxLjUtMS44LDEuOC0yLjNjMC40LTAuOSwyLjUtNy40LDMuOC0xMC4yYzEuMi0yLjUsMi45LTIuMSwyLjktMS4zYzAuMSwxLjgtMy40LDEzLTMuNCwxM3MzLjYtNy40LDQuOC05LjkKCQkJYzEuMi0yLjQsMy40LTEuOSwzLjItMS4yYy0xLjEsMy4yLTUuMSwxMy40LTUuMSwxMy40czQuNC03LjcsNS4yLTljMS0xLjYsMi45LTEuNywyLjktMC43YzAsMC43LTUuMywxMS45LTUuMywxMS45CgkJCXMzLjQtNS41LDQuNC02LjhjMC45LTEuMiwyLjktMS41LDIuNS0wLjNjLTAuMywxLTUuMywxMC4yLTUuOCwxMWMtMC45LDEuOS0yLjYsMy41LTQuMyw1LjFjLTEuOCwxLjctMy45LDIuMi00LjksMi40CgkJCWMtMC40LDAuMS0wLjgsMC0xLjEtMC4zbC01LjktNC42Yy0wLjMtMC4yLTAuNS0wLjYtMC41LTAuOUM0Ny42LDI4LjQsNDguMywyNS42LDQ3LjMsMjEuNnoiLz4KCTwvZz4KPC9nPgo8Zz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIyMC42IiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIyNi4xIiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIzMS41IiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSIzNyIgcj0iMS4yIi8+Cgk8Y2lyY2xlIGNsYXNzPSJzdDUiIGN4PSIzNi4zIiBjeT0iMTUuMiIgcj0iMS4yIi8+Cgk8Y2lyY2xlIGNsYXNzPSJzdDUiIGN4PSIzNi4zIiBjeT0iOS44IiByPSIxLjIiLz4KCTxjaXJjbGUgY2xhc3M9InN0NSIgY3g9IjM2LjMiIGN5PSI0LjMiIHI9IjEuMiIvPgo8L2c+CjxjaXJjbGUgY2xhc3M9InN0NCIgY3g9IjQuOSIgY3k9IjQuOSIgcj0iMi40Ii8+CjxjaXJjbGUgY2xhc3M9InN0NCIgY3g9IjQuOSIgY3k9IjEyLjgiIHI9IjIuNCIvPgo8Y2lyY2xlIGNsYXNzPSJzdDQiIGN4PSI0LjkiIGN5PSIyMC42IiByPSIyLjQiLz4KPGNpcmNsZSBjbGFzcz0ic3Q0IiBjeD0iNC45IiBjeT0iMjguNSIgcj0iMi40Ii8+CjxjaXJjbGUgY2xhc3M9InN0NiIgY3g9IjE1LjIiIGN5PSIxMi44IiByPSIyLjQiLz4KPGNpcmNsZSBjbGFzcz0ic3Q2IiBjeD0iMTUuMiIgY3k9IjIwLjYiIHI9IjIuNCIvPgo8Y2lyY2xlIGNsYXNzPSJzdDYiIGN4PSIxNS4yIiBjeT0iMjguNSIgcj0iMi40Ii8+CjxjaXJjbGUgY2xhc3M9InN0NCIgY3g9IjQuOSIgY3k9IjM2LjQiIHI9IjIuNCIvPgo8cGF0aCBjbGFzcz0ic3Q3IiBkPSJNMjMsMzEuNWMtMC43LDAtMS4yLTAuNS0xLjItMS4yVjEwLjRjMC0wLjcsMC41LTEuMiwxLjItMS4yczEuMiwwLjUsMS4yLDEuMnYxOS45QzI0LjIsMzEsMjMuNywzMS41LDIzLDMxLjV6IgoJLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTI2LDEyLjJjMC4yLDAsMC4zLTAuMSwwLjQtMC4ybDcuMS03LjFoMS4xYzAuMywwLjcsMC45LDEuMiwxLjcsMS4yYzEsMCwxLjgtMC44LDEuOC0xLjhzLTAuOC0xLjgtMS44LTEuOAoJYy0wLjgsMC0xLjUsMC41LTEuNywxLjJoLTEuM2MtMC4yLDAtMC4zLDAuMS0wLjQsMC4yTDI1LjgsMTFoLTF2LTAuNmMwLTEtMC44LTEuOC0xLjgtMS44cy0xLjgsMC44LTEuOCwxLjh2MS44aC0zLjEKCWMtMC4zLTEuNC0xLjUtMi40LTMtMi40Yy0wLjgsMC0xLjQsMC4zLTIsMC44TDcuNiw2LjNjMC4yLTAuNCwwLjMtMC44LDAuMy0xLjNjMC0xLjctMS40LTMtMy0zcy0zLDEuNC0zLDNzMS40LDMsMywzCgljMC44LDAsMS40LTAuMywyLTAuOGw1LjYsNC4zYy0wLjEsMC4yLTAuMiwwLjUtMC4zLDAuN0g3LjljLTAuMy0xLjQtMS41LTIuNC0zLTIuNGMtMS43LDAtMywxLjQtMywzczEuNCwzLDMsM2MwLjgsMCwxLjQtMC4zLDItMC44CglMOSwxNi43bC0yLjIsMS43Yy0wLjUtMC41LTEuMi0wLjgtMi0wLjhjLTEuNywwLTMsMS40LTMsM2MwLDEuNywxLjQsMywzLDNjMC44LDAsMS40LTAuMywyLTAuOEw5LDI0LjZsLTIuMiwxLjcKCWMtMC41LTAuNS0xLjItMC44LTItMC44Yy0xLjcsMC0zLDEuNC0zLDNjMCwxLjcsMS40LDMsMywzYzEuNSwwLDIuNy0xLDMtMi40aDQuNGMwLjEsMC4zLDAuMSwwLjUsMC4zLDAuN2wtNS42LDQuMwoJYy0wLjUtMC41LTEuMi0wLjctMi0wLjdjLTEuNywwLTMsMS40LTMsM2MwLDEuNywxLjQsMywzLDNzMy0xLjQsMy0zYzAtMC41LTAuMS0wLjktMC4zLTEuM2w1LjYtNC4zYzAuNSwwLjUsMS4yLDAuNywyLDAuNwoJYzEuNSwwLDIuNy0xLDMtMi40aDMuMXYxLjJjMCwxLDAuOCwxLjgsMS44LDEuOHMxLjgtMC44LDEuOC0xLjhoMWw3LjEsNy4xYzAuMSwwLjEsMC4zLDAuMiwwLjQsMC4yaDEuM2MwLjMsMC43LDAuOSwxLjIsMS43LDEuMgoJYzEsMCwxLjgtMC44LDEuOC0xLjhjMC0xLTAuOC0xLjgtMS44LTEuOGMtMC44LDAtMS41LDAuNS0xLjcsMS4yaC0xLjFsLTcuMS03LjFjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4yaC0xLjJ2LTEuOGgyLjhsNC43LDQuNwoJYzAuMSwwLjEsMC4zLDAuMiwwLjQsMC4yaDEuOWMwLjMsMC43LDAuOSwxLjIsMS43LDEuMmMxLDAsMS44LTAuOCwxLjgtMS44YzAtMS0wLjgtMS44LTEuOC0xLjhjLTAuOCwwLTEuNSwwLjUtMS43LDEuMmgtMS43CglsLTQuNy00LjdjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4yaC0zdi0xLjhIMzBsMi4yLDIuMmMwLjEsMC4xLDAuMywwLjIsMC40LDAuMmgxLjljMC4zLDAuNywwLjksMS4yLDEuNywxLjJjMSwwLDEuOC0wLjgsMS44LTEuOAoJcy0wLjgtMS44LTEuOC0xLjhjLTAuOCwwLTEuNSwwLjUtMS43LDEuMmgtMS43bC0yLjItMi4yYy0wLjEtMC4xLTAuMy0wLjItMC40LTAuMmgtNS40di0xLjhoOS44YzAuMywwLjcsMC45LDEuMiwxLjcsMS4yCgljMSwwLDEuOC0wLjgsMS44LTEuOHMtMC44LTEuOC0xLjgtMS44Yy0wLjgsMC0xLjUsMC41LTEuNywxLjJoLTkuOHYtMS44aDUuNGMwLjIsMCwwLjMtMC4xLDAuNC0wLjJsMi4yLTIuMmgxLjcKCWMwLjMsMC43LDAuOSwxLjIsMS43LDEuMmMxLDAsMS44LTAuOCwxLjgtMS44cy0wLjgtMS44LTEuOC0xLjhjLTAuOCwwLTEuNSwwLjUtMS43LDEuMmgtMS45Yy0wLjIsMC0wLjMsMC4xLTAuNCwwLjJMMzAsMTdoLTUuMgoJdi0xLjhoM2MwLjIsMCwwLjMtMC4xLDAuNC0wLjJsNC43LTQuN2gxLjdjMC4zLDAuNywwLjksMS4yLDEuNywxLjJjMSwwLDEuOC0wLjgsMS44LTEuOFMzNy4zLDgsMzYuMyw4Yy0wLjgsMC0xLjUsMC41LTEuNywxLjJoLTEuOQoJYy0wLjIsMC0wLjMsMC4xLTAuNCwwLjJMMjcuNiwxNGgtMi44di0xLjhIMjZ6IE0zNi4zLDMuN2MwLjMsMCwwLjYsMC4zLDAuNiwwLjZjMCwwLjMtMC4zLDAuNi0wLjYsMC42Yy0wLjMsMC0wLjYtMC4zLTAuNi0wLjYKCUMzNS43LDQsMzYsMy43LDM2LjMsMy43eiBNMzYuMywzNi40YzAuMywwLDAuNiwwLjMsMC42LDAuNmMwLDAuMy0wLjMsMC42LTAuNiwwLjZjLTAuMywwLTAuNi0wLjMtMC42LTAuNgoJQzM1LjcsMzYuNiwzNiwzNi40LDM2LjMsMzYuNHogTTM2LjMsMzAuOWMwLjMsMCwwLjYsMC4zLDAuNiwwLjZzLTAuMywwLjYtMC42LDAuNmMtMC4zLDAtMC42LTAuMy0wLjYtMC42UzM2LDMwLjksMzYuMywzMC45egoJIE0zNi4zLDI1LjVjMC4zLDAsMC42LDAuMywwLjYsMC42cy0wLjMsMC42LTAuNiwwLjZjLTAuMywwLTAuNi0wLjMtMC42LTAuNlMzNiwyNS41LDM2LjMsMjUuNXogTTM2LjMsMjBjMC4zLDAsMC42LDAuMywwLjYsMC42CgljMCwwLjMtMC4zLDAuNi0wLjYsMC42Yy0wLjMsMC0wLjYtMC4zLTAuNi0wLjZTMzYsMjAsMzYuMywyMHogTTM2LjMsMTQuNmMwLjMsMCwwLjYsMC4zLDAuNiwwLjZjMCwwLjMtMC4zLDAuNi0wLjYsMC42CgljLTAuMywwLTAuNi0wLjMtMC42LTAuNkMzNS43LDE0LjksMzYsMTQuNiwzNi4zLDE0LjZ6IE0zNi4zLDkuMmMwLjMsMCwwLjYsMC4zLDAuNiwwLjZzLTAuMywwLjYtMC42LDAuNmMtMC4zLDAtMC42LTAuMy0wLjYtMC42CglTMzYsOS4yLDM2LjMsOS4yeiBNMTguMSwxMy40aDMuMVYyMGgtMy4xYy0wLjMtMS40LTEuNS0yLjQtMy0yLjRjLTAuOCwwLTEuNCwwLjMtMiwwLjhMMTEsMTYuN2wyLjItMS43YzAuNSwwLjUsMS4yLDAuOCwyLDAuOAoJQzE2LjYsMTUuOCwxNy44LDE0LjgsMTguMSwxMy40eiBNMTMuNCwyMC42YzAtMSwwLjgtMS44LDEuOC0xLjhzMS44LDAuOCwxLjgsMS44cy0wLjgsMS44LTEuOCwxLjhTMTMuNCwyMS42LDEzLjQsMjAuNnogTTE1LjIsMTEKCWMxLDAsMS44LDAuOCwxLjgsMS44cy0wLjgsMS44LTEuOCwxLjhzLTEuOC0wLjgtMS44LTEuOFMxNC4yLDExLDE1LjIsMTF6IE00LjksNi44Yy0xLDAtMS44LTAuOC0xLjgtMS44czAuOC0xLjgsMS44LTEuOAoJczEuOCwwLjgsMS44LDEuOFM1LjksNi44LDQuOSw2Ljh6IE00LjksMTQuNmMtMSwwLTEuOC0wLjgtMS44LTEuOFMzLjksMTEsNC45LDExczEuOCwwLjgsMS44LDEuOFM1LjksMTQuNiw0LjksMTQuNnogTTcuNiwxNC4xCgljMC4xLTAuMiwwLjItMC41LDAuMy0wLjdoNC40YzAuMSwwLjMsMC4xLDAuNSwwLjMsMC43TDEwLDE2TDcuNiwxNC4xeiBNMTIuNSwxOS4zYy0wLjEsMC4yLTAuMiwwLjUtMC4zLDAuN0g3LjkKCWMtMC4xLTAuMy0wLjEtMC41LTAuMy0wLjdsMi40LTEuOUwxMi41LDE5LjN6IE00LjksMjIuNWMtMSwwLTEuOC0wLjgtMS44LTEuOHMwLjgtMS44LDEuOC0xLjhzMS44LDAuOCwxLjgsMS44UzUuOSwyMi41LDQuOSwyMi41egoJIE03LjYsMjJjMC4xLTAuMiwwLjItMC41LDAuMy0wLjdoNC40YzAuMSwwLjMsMC4xLDAuNSwwLjMsMC43TDEwLDIzLjhMNy42LDIyeiBNMTIuMiwyNy45SDcuOWMtMC4xLTAuMy0wLjEtMC41LTAuMy0wLjdsMi40LTEuOQoJbDIuNCwxLjlDMTIuMywyNy40LDEyLjMsMjcuNiwxMi4yLDI3Ljl6IE00LjksMzAuM2MtMSwwLTEuOC0wLjgtMS44LTEuOHMwLjgtMS44LDEuOC0xLjhzMS44LDAuOCwxLjgsMS44UzUuOSwzMC4zLDQuOSwzMC4zegoJIE00LjksMzguMmMtMSwwLTEuOC0wLjgtMS44LTEuOGMwLTEsMC44LTEuOCwxLjgtMS44czEuOCwwLjgsMS44LDEuOEM2LjcsMzcuNCw1LjksMzguMiw0LjksMzguMnogTTE1LjIsMzAuM2MtMSwwLTEuOC0wLjgtMS44LTEuOAoJczAuOC0xLjgsMS44LTEuOHMxLjgsMC44LDEuOCwxLjhTMTYuMiwzMC4zLDE1LjIsMzAuM3ogTTE4LjEsMjcuOWMtMC4zLTEuNC0xLjUtMi40LTMtMi40Yy0wLjgsMC0xLjQsMC4zLTIsMC44TDExLDI0LjZsMi4yLTEuNwoJYzAuNSwwLjUsMS4yLDAuOCwyLDAuOGMxLjUsMCwyLjctMSwzLTIuNGgzLjF2Ni42SDE4LjF6IE0yMy42LDMwLjNjMCwwLjMtMC4zLDAuNi0wLjYsMC42Yy0wLjMsMC0wLjYtMC4zLTAuNi0wLjZWMTAuNAoJYzAtMC4zLDAuMy0wLjYsMC42LTAuNmMwLjMsMCwwLjYsMC4zLDAuNiwwLjZWMzAuM3oiLz4KPC9zdmc+Cg==';

/**
 * Sensor attribute video sensor block should report.
 * @readonly
 * @enum {string}
 */
const SensingAttribute = {
    /** The amount of motion. */
    MOTION: 'motion',

    /** The direction of the motion. */
    DIRECTION: 'direction'
};

/**
 * Subject video sensor block should report for.
 * @readonly
 * @enum {string}
 */
const SensingSubject = {
    /** The sensor traits of the whole stage. */
    STAGE: 'Stage',

    /** The senosr traits of the area overlapped by this sprite. */
    SPRITE: 'this sprite'
};

/**
 * States the video sensing activity can be set to.
 * @readonly
 * @enum {string}
 */
const VideoState = {
    /** Video turned off. */
    OFF: 'off',

    /** Video turned on with default y axis mirroring. */
    ON: 'on',

    /** Video turned on without default y axis mirroring. */
    ON_FLIPPED: 'on-flipped'
};

const ModelType = {
    POSE: 'pose',
    IMAGE: 'image',
    AUDIO: 'audio'
};

const EXTENSION_ID = 'teachableMachine';

/**
 * Class for the motion-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3VideoSensingBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        this.runtime.registerPeripheralExtension(EXTENSION_ID, this);
        this.runtime.connectPeripheral(EXTENSION_ID, 0);
        this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);

        /**
         * The motion detection algoritm used to power the motion amount and
         * direction values.
         * @type {VideoMotion}
         */
        this.detect = new VideoMotion();

        /**
         * The last millisecond epoch timestamp that the video stream was
         * analyzed.
         * @type {number}
         */
        this._lastUpdate = null;

        /**
         * A flag to determine if this extension has been installed in a project.
         * It is set to false the first time getInfo is run.
         * @type {boolean}
         */
        this.firstInstall = true;

        if (this.runtime.ioDevices) {
            // Configure the video device with values from globally stored locations.
            this.runtime.on(Runtime.PROJECT_LOADED, this.updateVideoDisplay.bind(this));
            // Kick off looping the analysis logic.
            this._loop();
        }
    }

    /**
     * After analyzing a frame the amount of milliseconds until another frame
     * is analyzed.
     * @type {number}
     */
    static get INTERVAL () {
        return 33;
    }

    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @type {Array.<number>}
     */
    static get DIMENSIONS () {
        return [480, 360];
    }

    /**
     * The key to load & store a target's motion-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.videoSensing';
    }

    /**
     * The default motion-related state, to be used when a target has no existing motion state.
     * @type {MotionState}
     */
    static get DEFAULT_MOTION_STATE () {
        return {
            motionFrameNumber: 0,
            motionAmount: 0,
            motionDirection: 0
        };
    }

    /**
     * The transparency setting of the video preview stored in a value
     * accessible by any object connected to the virtual machine.
     * @type {number}
     */
    get globalVideoTransparency () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoTransparency;
        }
        return 50;
    }

    set globalVideoTransparency (transparency) {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.videoTransparency = transparency;
        }
        return transparency;
    }

    /**
     * The video state of the video preview stored in a value accessible by any
     * object connected to the virtual machine.
     * @type {number}
     */
    get globalVideoState () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.videoState;
        }
        // Though the default value for the stage is normally 'on', we need to default
        // to 'off' here to prevent the video device from briefly activating
        // while waiting for stage targets to be installed that say it should be off
        return VideoState.OFF;
    }

    set globalVideoState (state) {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.videoState = state;
        }
        return state;
    }

    /**
     * Get the latest values for video transparency and state,
     * and set the video device to use them.
     */
    updateVideoDisplay () {
        this.setVideoTransparency({
            TRANSPARENCY: this.globalVideoTransparency
        });
        this.videoToggle({
            VIDEO_STATE: this.globalVideoState
        });
    }

    /**
     * Occasionally step a loop to sample the video, stamp it to the preview
     * skin, and add a TypedArray copy of the canvas's pixel data.
     * @private
     */
    _loop () {
        setTimeout(this._loop.bind(this), Math.max(this.runtime.currentStepTime, Scratch3VideoSensingBlocks.INTERVAL));

        // Add frame to detector
        const time = Date.now();
        if (this._lastUpdate === null) {
            this._lastUpdate = time;
        }
        if (!this._isPredicting) {
            this._isPredicting = 0;
        }
        const offset = time - this._lastUpdate;

        // TOOD: Self-throttle interval if slow to run predictions
        const isAudioModel = this.isAudio();
        if (isAudioModel) {
            this.predictAllBlocks(null);
            this._lastUpdate = time;
            this._isPredicting = 0;
        } else if (offset > Scratch3VideoSensingBlocks.INTERVAL && this._isPredicting === 0) {
            const frame = this.runtime.ioDevices.video.getFrame({
                format: Video.FORMAT_IMAGE_DATA,
                dimensions: Scratch3VideoSensingBlocks.DIMENSIONS
            });

            if (frame) {
                this._lastUpdate = time;
                this._isPredicting = 0;
                this.predictAllBlocks(frame);
            }
        }
    }

    scan () {
    }

    reset () {
    }

    isConnected () {
        return this.predictionState &&
            this.teachableImageModel &&
            this.predictionState.hasOwnProperty(this.teachableImageModel);
    }

    connect () {
    }


    async predictAllBlocks (frame) {
        for (const modelUrl in this.predictionState) {
            if (!this.predictionState[modelUrl].model) {
                continue;
            }
            if (this.teachableImageModel !== modelUrl) {
                continue;
            }
            ++this._isPredicting;
            const prediction = await this.predictModel(modelUrl, frame);
            this.predictionState[modelUrl].topClass = prediction;
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
            --this._isPredicting;
        }
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array
     * of objects with text and value properties. The text is a translated
     * string, and the value is one-indexed.
     * @param {object[]} info - An array of info objects each having a name
     *   property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    /**
     * @param {Target} target - collect motion state for this target.
     * @returns {MotionState} the mutable motion state associated with that
     *   target. This will be created if necessary.
     * @private
     */
    _getMotionState (target) {
        let motionState = target.getCustomState(Scratch3VideoSensingBlocks.STATE_KEY);
        if (!motionState) {
            motionState = Clone.simple(Scratch3VideoSensingBlocks.DEFAULT_MOTION_STATE);
            target.setCustomState(Scratch3VideoSensingBlocks.STATE_KEY, motionState);
        }
        return motionState;
    }

    static get SensingAttribute () {
        return SensingAttribute;
    }

    /**
     * An array of choices of whether a reporter should return the frame's
     * motion amount or direction.
     * @type {object[]}
     * @param {string} name - the translatable name to display in sensor
     *   attribute menu
     * @param {string} value - the serializable value of the attribute
     */
    get ATTRIBUTE_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.motion',
                    default: 'motion',
                    description: 'Attribute for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingAttribute.MOTION
            },
            {
                name: formatMessage({
                    id: 'videoSensing.direction',
                    default: 'direction',
                    description: 'Attribute for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingAttribute.DIRECTION
            }
        ];
    }

    static get SensingSubject () {
        return SensingSubject;
    }

    /**
     * An array of info about the subject choices.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the subject menu
     * @param {string} value - the serializable value of the subject
     */
    get SUBJECT_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.sprite',
                    default: 'sprite',
                    description: 'Subject for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingSubject.SPRITE
            },
            {
                name: formatMessage({
                    id: 'videoSensing.stage',
                    default: 'stage',
                    description: 'Subject for the "video [ATTRIBUTE] on [SUBJECT]" block'
                }),
                value: SensingSubject.STAGE
            }
        ];
    }

    /**
     * States the video sensing activity can be set to.
     * @readonly
     * @enum {string}
     */
    static get VideoState () {
        return VideoState;
    }

    /**
     * An array of info on video state options for the "turn video [STATE]" block.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the video state menu
     * @param {string} value - the serializable value stored in the block
     */
    get VIDEO_STATE_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'videoSensing.off',
                    default: 'off',
                    description: 'Option for the "turn video [STATE]" block'
                }),
                value: VideoState.OFF
            },
            {
                name: formatMessage({
                    id: 'videoSensing.on',
                    default: 'on',
                    description: 'Option for the "turn video [STATE]" block'
                }),
                value: VideoState.ON
            },
            {
                name: formatMessage({
                    id: 'videoSensing.onFlipped',
                    default: 'on flipped',
                    description: 'Option for the "turn video [STATE]" block that causes the video to be flipped' +
                        ' horizontally (reversed as in a mirror)'
                }),
                value: VideoState.ON_FLIPPED
            }
        ];
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        // Set the video display properties to defaults the first time
        // getInfo is run. This turns on the video device when it is
        // first added to a project, and is overwritten by a PROJECT_LOADED
        // event listener that later calls updateVideoDisplay
        if (this.firstInstall) {
            this.globalVideoState = VideoState.ON;
            this.globalVideoTransparency = 50;
            this.updateVideoDisplay();
            this.updateToStageModel();
            this.firstInstall = false;
            this.predictionState = {};
        }

        // Return extension definition
        const blocks = [
            {
                opcode: 'useModelBlock',
                text: `use model [MODEL_URL]`,
                arguments: {
                    MODEL_URL: {
                        type: ArgumentType.STRING,
                        defaultValue: this.teachableImageModel || 'Paste URL Here!'
                    }
                }
            },
            {
                // @todo (copied from motion) this hat needs to be set itself to restart existing
                // threads like Scratch 2's behaviour.
                opcode: 'whenModelMatches',
                text: 'when model detects [CLASS_NAME]',
                blockType: BlockType.HAT,
                arguments: {
                    CLASS_NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: this.getCurrentClasses()[0],
                        menu: 'CLASS_NAME'
                    }
                }
            },
            {
                opcode: 'modelPrediction',
                text: formatMessage({
                    id: 'teachableMachine.modelPrediction',
                    default: 'model prediction',
                    description: 'Value of latest model prediction'
                }),
                blockType: BlockType.REPORTER,
                isTerminal: true
            },
            {
                // @todo (copied from motion) this hat needs to be set itself to restart existing
                // threads like Scratch 2's behaviour.
                opcode: 'modelMatches',
                text: formatMessage({
                    id: 'teachableMachine.modelMatches',
                    default: 'prediction is [CLASS_NAME]',
                    description: 'Boolean that is true when the model matches [CLASS_NAME]'
                }),
                blockType: BlockType.BOOLEAN,
                arguments: {
                    CLASS_NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: this.getCurrentClasses()[0],
                        menu: 'CLASS_NAME'
                    }
                }
            },
            '---',
            {
                opcode: 'videoToggle',
                text: formatMessage({
                    id: 'videoSensing.videoToggle',
                    default: 'turn video [VIDEO_STATE]',
                    description: 'Controls display of the video preview layer'
                }),
                arguments: {
                    VIDEO_STATE: {
                        type: ArgumentType.NUMBER,
                        menu: 'VIDEO_STATE',
                        defaultValue: VideoState.ON
                    }
                }
            },
            {
                opcode: 'setVideoTransparency',
                text: formatMessage({
                    id: 'videoSensing.setVideoTransparency',
                    default: 'set video transparency to [TRANSPARENCY]',
                    description: 'Controls transparency of the video preview layer'
                }),
                arguments: {
                    TRANSPARENCY: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 50
                    }
                }
            }
        ];

        return {
            id: EXTENSION_ID,
            name: formatMessage({
                id: 'videoSensing.categoryName',
                default: 'Teachable Machine',
                description: 'Label for the Teachable Machine extension category'
            }),
            showStatusButton: true,
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            blocks: blocks,
            menus: {
                CLASS_NAME: 'getCurrentClasses',
                ATTRIBUTE: {
                    acceptReporters: true,
                    items: this._buildMenu(this.ATTRIBUTE_INFO)
                },
                SUBJECT: {
                    acceptReporters: true,
                    items: this._buildMenu(this.SUBJECT_INFO)
                },
                VIDEO_STATE: {
                    acceptReporters: true,
                    items: this._buildMenu(this.VIDEO_STATE_INFO)
                }
            }
        };
    }

    updateToStageModel () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            this.teachableImageModel = stage.teachableImageModel;
            if (this.teachableImageModel) {
                this.useModel(this.teachableImageModel);
            }
        }
    }

    updateStageModel (modelUrl) {
        const stage = this.runtime.getTargetForStage();
        this.teachableImageModel = modelUrl;
        if (stage) {
            stage.teachableImageModel = modelUrl;
        }
    }

    useModelBlock (args, util) {
        const modelArg = args.MODEL_URL;
        this.useModel(modelArg);
    }

    useModel (modelArg) {
        try {
            const modelUrl = this.modelArgumentToURL(modelArg);
            this.getPredictionStateOrStartPredicting(modelUrl);
            this.updateStageModel(modelUrl);
        } catch (e) {
            this.teachableImageModel = null;
        }
    }

    modelArgumentToURL (modelArg) {
        return modelArg.startsWith('https://teachablemachine.withgoogle.com/models/') ?
            modelArg :
            `https://teachablemachine.withgoogle.com/models/${modelArg}/`;
    }

    /**
     * A scratch hat block edge handle that downloads a teachable machine model and determines whether the
     * current video frame matches the model class.
     * @param {object} args - the block arguments
     * @param {BlockUtility} util - the block utility
     * @returns {boolean} true if the model matches
     *   reference
     */
    whenModelMatches (args, util) {
        const modelUrl = this.teachableImageModel;
        const className = args.CLASS_NAME;

        const predictionState = this.getPredictionStateOrStartPredicting(modelUrl);
        if (!predictionState) {
            return false;
        }

        const currentMaxClass = predictionState.topClass;
        return (currentMaxClass === String(className));
    }

    modelMatches (args, util) {
        const modelUrl = this.teachableImageModel;
        const className = args.CLASS_NAME;

        const predictionState = this.getPredictionStateOrStartPredicting(modelUrl);
        if (!predictionState) {
            return false;
        }

        const currentMaxClass = predictionState.topClass;
        return (currentMaxClass === String(className));
    }

    /**
     * A scratch hat block reporter that returns whether the current video frame matches the model class.
     * @param {object} args - the block arguments
     * @param {BlockUtility} util - the block utility
     * @returns {string} class name if video frame matched, empty string if model not loaded yet
     */
    modelPrediction (args, util) {
        const modelUrl = this.teachableImageModel;
        const predictionState = this.getPredictionStateOrStartPredicting(modelUrl);
        if (!predictionState) {
            return '';
        }

        return predictionState.topClass;
    }

    getPredictionStateOrStartPredicting (modelUrl) {
        const hasPredictionState = this.predictionState.hasOwnProperty(modelUrl);
        if (!hasPredictionState) {
            this.startPredicting(modelUrl);
            return null;
        }
        return this.predictionState[modelUrl];
    }

    getCurrentClasses () {
        if (
            !this.teachableImageModel ||
            !this.predictionState ||
            !this.predictionState[this.teachableImageModel] ||
            !this.predictionState[this.teachableImageModel].hasOwnProperty('model')
        ) {
            return ['Class 1'];
        }
        if (this.predictionState[this.teachableImageModel].modelType === ModelType.AUDIO) {
            return this.predictionState[this.teachableImageModel].model.wordLabels();
        }

        return this.predictionState[this.teachableImageModel].model.getClassLabels();
    }

    isAudio () {
        return this.predictionState && this.predictionState[this.teachableImageModel] &&
            this.predictionState[this.teachableImageModel].modelType === ModelType.AUDIO;
    }

    async startPredicting (modelDataUrl) {
        if (!this.predictionState[modelDataUrl]) {
            try {
                this.predictionState[modelDataUrl] = {};
                // https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image
                const {model, type} = await this.initModel(modelDataUrl);
                this.predictionState[modelDataUrl].modelType = type;
                this.predictionState[modelDataUrl].model = model;
                this.runtime.requestToolboxExtensionsUpdate();
            } catch (e) {
                this.predictionState[modelDataUrl] = {};
                console.log('Model initialization failure!', e);
            }
        }
    }

    async initModel (modelUrl) {
        const modelURL = `${modelUrl}model.json`;
        const metadataURL = `${modelUrl}metadata.json`;
        const customMobileNet = await tmImage.load(modelURL, metadataURL);
        if (customMobileNet._metadata.hasOwnProperty('tfjsSpeechCommandsVersion')) {
            // customMobileNet.dispose(); // too early to dispose
            console.log('We got a speech net yay');
            const recognizer = tmAudioSpeechCommands.create('BROWSER_FFT', undefined, modelURL, metadataURL);
            await recognizer.ensureModelLoaded();
            await recognizer.listen(result => {
                this.latestAudioResults = result;
            }, {
                includeSpectrogram: true, // in case listen should return result.spectrogram
                probabilityThreshold: 0.75,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
            });
            return {model: recognizer, type: ModelType.AUDIO};
        } else if (customMobileNet._metadata.packageName === '@teachablemachine/pose') {
            console.log('We got a pose net yay');
            const customPoseNet = await tmPose.load(modelURL, metadataURL);
            return {model: customPoseNet, type: ModelType.POSE};
        }
        console.log('Not a pose net yay');
        return {model: customMobileNet, type: ModelType.IMAGE};
        
    }

    async predictModel (modelUrl, frame) {
        console.log('Predicting model');
        const predictions = await this.getPredictionFromModel(modelUrl, frame);
        if (!predictions) {
            return;
        }
        let maxProbability = 0;
        let maxClassName = '';
        for (let i = 0; i < predictions.length; i++) {
            const probability = predictions[i].probability.toFixed(2);
            const className = predictions[i].className;
            if (probability > maxProbability) {
                maxClassName = className;
                maxProbability = probability;
            }
        }
        return maxClassName;
    }

    async getPredictionFromModel (modelUrl, frame) {
        const {model, modelType} = this.predictionState[modelUrl];
        switch (modelType) {
        case ModelType.IMAGE:
            const imageBitmap = await createImageBitmap(frame);
            return await model.predict(imageBitmap);
        case ModelType.POSE:
            const {pose, posenetOutput} = await model.estimatePose(frame);
            return await model.predict(posenetOutput);
        case ModelType.AUDIO:
            if (this.latestAudioResults) {
                return model.wordLabels().map((label, i) => ({className: label, probability: this.latestAudioResults.scores[i]}));
            }
            return null;
                
        }
    }

    /**
     * A scratch command block handle that configures the video state from
     * passed arguments.
     * @param {object} args - the block arguments
     * @param {VideoState} args.VIDEO_STATE - the video state to set the device to
     */
    videoToggle (args) {
        const state = args.VIDEO_STATE;
        this.globalVideoState = state;
        if (state === VideoState.OFF) {
            this.runtime.ioDevices.video.disableVideo();
        } else {
            this.runtime.ioDevices.video.enableVideo();
            // Mirror if state is ON. Do not mirror if state is ON_FLIPPED.
            this.runtime.ioDevices.video.mirror = state === VideoState.ON;
        }
    }

    /**
     * A scratch command block handle that configures the video preview's
     * transparency from passed arguments.
     * @param {object} args - the block arguments
     * @param {number} args.TRANSPARENCY - the transparency to set the video
     *   preview to
     */
    setVideoTransparency (args) {
        const transparency = Cast.toNumber(args.TRANSPARENCY);
        this.globalVideoTransparency = transparency;
        this.runtime.ioDevices.video.setPreviewGhost(transparency);
    }
}

module.exports = Scratch3VideoSensingBlocks;
