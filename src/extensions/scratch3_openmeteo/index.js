const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const Variable = require('../../engine/variable');
const prefectureLocations = require('./prefecture-locations');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDQwIDQwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPgogICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMSwwLDAsMSwtNjEwLC05MCkiPgogICAgICAgIDxnIGlkPSJibG9jay1pY29uIiB0cmFuc2Zvcm09Im1hdHJpeCgxLDAsMCwwLjk1MjM4MSwwLDMuMzMzMzMpIj4KICAgICAgICAgICAgPHJlY3QgeD0iNjEwIiB5PSI5MSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQyIiBzdHlsZT0iZmlsbDpub25lOyIvPgogICAgICAgICAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjEwNjkxNiwwLDAsMC4xNDk2ODIsNjA0LjM0LDg1LjA1NzIpIj4KICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDE5Ljg3MjYsMCwwLDE0LjkwNDUsODEuMDQxNiw1My4zMTIxKSI+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcsOEM3LDggNyw4IDcsOEM4LjkyLDggMTAuNSw5LjU4IDEwLjUsMTEuNUMxMC41LDExLjUxOCAxMC41LDExLjUzNyAxMC41LDExLjU1NUMxMC41LDExLjU1OCAxMC41LDExLjU2IDEwLjUsMTEuNTYzQzEwLjUsMTEuODM3IDEwLjcyNiwxMi4wNjMgMTEsMTIuMDYzQzExLjA0MiwxMi4wNjMgMTEuMDgzLDEyLjA1NyAxMS4xMjQsMTIuMDQ3QzExLjI0NiwxMi4wMTYgMTEuMzcxLDEyIDExLjQ5NywxMkMxMi4zMiwxMiAxMi45OTgsMTIuNjc3IDEzLDEzLjVDMTMsMTQuMzIzIDEyLjMyMywxNSAxMS41LDE1TDMsMTVDMS45MDcsMTQuOTk0IDEuMDExLDE0LjA5MyAxLjAxMSwxM0MxLjAxMSwxMS45MDMgMS45MTQsMTEgMy4wMTEsMTFDMy4wNDEsMTEgMy4wNywxMS4wMDEgMy4xLDExLjAwMkMzLjMzNywxMS4wMTQgMy41NTEsMTAuODU3IDMuNjEsMTAuNjI3QzQuMDA4LDkuMDg2IDUuNDA4LDggNyw4Wk0xMS40NzMsMTFDMTEuMjIxLDguNzMyIDkuMjgyLDYuOTk2IDcsNi45OTZDNS4wOTMsNi45OTYgMy4zODMsOC4yMDkgMi43NTMsMTAuMDFDMS4yMDUsMTAuMTM3IC0wLjAwMiwxMS40NDYgLTAuMDAyLDEzQy0wLjAwMiwxNC42NDYgMS4zNTIsMTYgMi45OTgsMTZDMi45OTgsMTYgMi45OTksMTYgMywxNkwxMS41LDE2QzEyLjg3MSwxNiAxNCwxNC44NzEgMTQsMTMuNUMxNCwxMi4xMjkgMTIuODcxLDExIDExLjUsMTFMMTEuNDczLDExWiIgc3R5bGU9ImZpbGw6d2hpdGU7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxOS44NzI2LDAsMCwxNC45MDQ1LDgxLjA0MTYsNTMuMzEyMSkiPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMC41LDEuNUMxMC41LDEuMjI2IDEwLjI3NCwxIDEwLDFDOS43MjYsMSA5LjUsMS4yMjYgOS41LDEuNUw5LjUsMi41QzkuNSwyLjc3NCA5LjcyNiwzIDEwLDNDMTAuMjc0LDMgMTAuNSwyLjc3NCAxMC41LDIuNUwxMC41LDEuNVpNMTQuMjQzLDMuNDY0QzE0LjM0MSwzLjM3IDE0LjM5NiwzLjI0IDE0LjM5NiwzLjEwNEMxNC4zOTYsMi44MyAxNC4xNywyLjYwNCAxMy44OTYsMi42MDRDMTMuNzYsMi42MDQgMTMuNjMsMi42NTkgMTMuNTM2LDIuNzU3TDEyLjgyOCwzLjQ2NEMxMi43MzQsMy41NTggMTIuNjgxLDMuNjg1IDEyLjY4MSwzLjgxOEMxMi42ODEsNC4wOTMgMTIuOTA3LDQuMzE5IDEzLjE4Miw0LjMxOUMxMy4zMTUsNC4zMTkgMTMuNDQyLDQuMjY2IDEzLjUzNiw0LjE3MkwxNC4yNDMsMy40NjRaTTYuNDY0LDIuNzU3QzYuMzcxLDIuNjY3IDYuMjQ2LDIuNjE3IDYuMTE3LDIuNjE3QzUuODQyLDIuNjE3IDUuNjE3LDIuODQyIDUuNjE3LDMuMTE3QzUuNjE3LDMuMjQ2IDUuNjY3LDMuMzcxIDUuNzU3LDMuNDY0TDYuNDY0LDQuMTcyQzYuNTU4LDQuMjY2IDYuNjg1LDQuMzE5IDYuODE4LDQuMzE5QzcuMDkzLDQuMzE5IDcuMzE5LDQuMDkzIDcuMzE5LDMuODE4QzcuMzE5LDMuNjg1IDcuMjY2LDMuNTU4IDcuMTcyLDMuNDY0TDYuNDY0LDIuNzU3Wk04LjE5OCw2LjEzMUM4LjUzMSw1LjQ0MSA5LjIzMyw1IDkuOTk5LDVDMTEuMDk2LDUgMTEuOTk5LDUuOTAzIDExLjk5OSw3QzExLjk5OSw3LjQ5IDExLjgxOSw3Ljk2MyAxMS40OTQsOC4zMjlDMTEuNjkzLDguNjEgMTEuODY2LDguOTExIDEyLjAxLDkuMjI3QzEyLjYzOSw4LjY1OCAxMi45OTksNy44NDkgMTIuOTk5LDcuMDAxQzEyLjk5OSw1LjM1NSAxMS42NDUsNC4wMDEgOS45OTksNC4wMDFDOC43Myw0LjAwMSA3LjU5Miw0LjgwNiA3LjE3LDYuMDAyQzcuNTIyLDYuMDEzIDcuODY2LDYuMDU3IDguMTk4LDYuMTMxWk0xMi42ODIsMTAuMjA1QzEzLjI4MiwxMC40MiAxMy44MDcsMTAuNzk1IDE0LjIwNCwxMS4yNzdDMTQuMzIxLDExLjE4MiAxNC4zODksMTEuMDM5IDE0LjM4OSwxMC44ODhDMTQuMzg5LDEwLjc1NiAxNC4zMzcsMTAuNjI5IDE0LjI0MywxMC41MzVMMTMuNTM2LDkuODI4QzEzLjQ0Miw5LjczNCAxMy4zMTQsOS42ODEgMTMuMTgxLDkuNjgxQzEyLjkwNyw5LjY4MSAxMi42ODEsOS45MDYgMTIuNjgxLDEwLjE4MUMxMi42ODEsMTAuMTg5IDEyLjY4MiwxMC4xOTcgMTIuNjgyLDEwLjIwNVpNMTQuNSw2LjVDMTQuMjI2LDYuNSAxNCw2LjcyNiAxNCw3QzE0LDcuMjc0IDE0LjIyNiw3LjUgMTQuNSw3LjVMMTUuNSw3LjVDMTUuNzc0LDcuNSAxNiw3LjI3NCAxNiw3QzE2LDYuNzI2IDE1Ljc3NCw2LjUgMTUuNSw2LjVMMTQuNSw2LjVaIiBzdHlsZT0iZmlsbDp3aGl0ZTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+Cg==';

/**
 * Icon svg to be displayed in the category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDQwIDQwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPgogICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMSwwLDAsMSwtNjEwLC0xNDApIj4KICAgICAgICA8ZyBpZD0ibWVudS1pY29uIiB0cmFuc2Zvcm09Im1hdHJpeCgxLDAsMCwwLjk1MjM4MSwwLDUzLjMzMzMpIj4KICAgICAgICAgICAgPHJlY3QgeD0iNjEwIiB5PSI5MSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQyIiBzdHlsZT0iZmlsbDpub25lOyIvPgogICAgICAgICAgICA8Y2xpcFBhdGggaWQ9Il9jbGlwMSI+CiAgICAgICAgICAgICAgICA8cmVjdCB4PSI2MTAiIHk9IjkxIiB3aWR0aD0iNDAiIGhlaWdodD0iNDIiLz4KICAgICAgICAgICAgPC9jbGlwUGF0aD4KICAgICAgICAgICAgPGcgY2xpcC1wYXRoPSJ1cmwoI19jbGlwMSkiPgogICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMSwwLDAsMS4wNSwwLC01NikiPgogICAgICAgICAgICAgICAgICAgIDxjaXJjbGUgY3g9IjYzMCIgY3k9IjE2MCIgcj0iMjAiIHN0eWxlPSJmaWxsOnJnYigwLDE5NSwyNTUpOyIvPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMC4xMzQxODgsMCwwLDAuMTg3ODYzLDU5Mi4wODIsODMuMTA0NikiPgogICAgICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDE5Ljg3MjYsMCwwLDE0LjkwNDUsODEuMDQxNiw1My4zMTIxKSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LDhDNyw4IDcsOCA3LDhDOC45Miw4IDEwLjUsOS41OCAxMC41LDExLjVDMTAuNSwxMS41MTggMTAuNSwxMS41MzcgMTAuNSwxMS41NTVDMTAuNSwxMS41NTggMTAuNSwxMS41NiAxMC41LDExLjU2M0MxMC41LDExLjgzNyAxMC43MjYsMTIuMDYzIDExLDEyLjA2M0MxMS4wNDIsMTIuMDYzIDExLjA4MywxMi4wNTcgMTEuMTI0LDEyLjA0N0MxMS4yNDYsMTIuMDE2IDExLjM3MSwxMiAxMS40OTcsMTJDMTIuMzIsMTIgMTIuOTk4LDEyLjY3NyAxMywxMy41QzEzLDE0LjMyMyAxMi4zMjMsMTUgMTEuNSwxNUwzLDE1QzEuOTA3LDE0Ljk5NCAxLjAxMSwxNC4wOTMgMS4wMTEsMTNDMS4wMTEsMTEuOTAzIDEuOTE0LDExIDMuMDExLDExQzMuMDQxLDExIDMuMDcsMTEuMDAxIDMuMSwxMS4wMDJDMy4zMzcsMTEuMDE0IDMuNTUxLDEwLjg1NyAzLjYxLDEwLjYyN0M0LjAwOCw5LjA4NiA1LjQwOCw4IDcsOFpNMTEuNDczLDExQzExLjIyMSw4LjczMiA5LjI4Miw2Ljk5NiA3LDYuOTk2QzUuMDkzLDYuOTk2IDMuMzgzLDguMjA5IDIuNzUzLDEwLjAxQzEuMjA1LDEwLjEzNyAtMC4wMDIsMTEuNDQ2IC0wLjAwMiwxM0MtMC4wMDIsMTQuNjQ2IDEuMzUyLDE2IDIuOTk4LDE2QzIuOTk4LDE2IDIuOTk5LDE2IDMsMTZMMTEuNSwxNkMxMi44NzEsMTYgMTQsMTQuODcxIDE0LDEzLjVDMTQsMTIuMTI5IDEyLjg3MSwxMSAxMS41LDExTDExLjQ3MywxMVoiIHN0eWxlPSJmaWxsOndoaXRlO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgICAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxOS44NzI2LDAsMCwxNC45MDQ1LDgxLjA0MTYsNTMuMzEyMSkiPgogICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTAuNSwxLjVDMTAuNSwxLjIyNiAxMC4yNzQsMSAxMCwxQzkuNzI2LDEgOS41LDEuMjI2IDkuNSwxLjVMOS41LDIuNUM5LjUsMi43NzQgOS43MjYsMyAxMCwzQzEwLjI3NCwzIDEwLjUsMi43NzQgMTAuNSwyLjVMMTAuNSwxLjVaTTE0LjI0MywzLjQ2NEMxNC4zNDEsMy4zNyAxNC4zOTYsMy4yNCAxNC4zOTYsMy4xMDRDMTQuMzk2LDIuODMgMTQuMTcsMi42MDQgMTMuODk2LDIuNjA0QzEzLjc2LDIuNjA0IDEzLjYzLDIuNjU5IDEzLjUzNiwyLjc1N0wxMi44MjgsMy40NjRDMTIuNzM0LDMuNTU4IDEyLjY4MSwzLjY4NSAxMi42ODEsMy44MThDMTIuNjgxLDQuMDkzIDEyLjkwNyw0LjMxOSAxMy4xODIsNC4zMTlDMTMuMzE1LDQuMzE5IDEzLjQ0Miw0LjI2NiAxMy41MzYsNC4xNzJMMTQuMjQzLDMuNDY0Wk02LjQ2NCwyLjc1N0M2LjM3MSwyLjY2NyA2LjI0NiwyLjYxNyA2LjExNywyLjYxN0M1Ljg0MiwyLjYxNyA1LjYxNywyLjg0MiA1LjYxNywzLjExN0M1LjYxNywzLjI0NiA1LjY2NywzLjM3MSA1Ljc1NywzLjQ2NEw2LjQ2NCw0LjE3MkM2LjU1OCw0LjI2NiA2LjY4NSw0LjMxOSA2LjgxOCw0LjMxOUM3LjA5Myw0LjMxOSA3LjMxOSw0LjA5MyA3LjMxOSwzLjgxOEM3LjMxOSwzLjY4NSA3LjI2NiwzLjU1OCA3LjE3MiwzLjQ2NEw2LjQ2NCwyLjc1N1pNOC4xOTgsNi4xMzFDOC41MzEsNS40NDEgOS4yMzMsNSA5Ljk5OSw1QzExLjA5Niw1IDExLjk5OSw1LjkwMyAxMS45OTksN0MxMS45OTksNy40OSAxMS44MTksNy45NjMgMTEuNDk0LDguMzI5QzExLjY5Myw4LjYxIDExLjg2Niw4LjkxMSAxMi4wMSw5LjIyN0MxMi42MzksOC42NTggMTIuOTk5LDcuODQ5IDEyLjk5OSw3LjAwMUMxMi45OTksNS4zNTUgMTEuNjQ1LDQuMDAxIDkuOTk5LDQuMDAxQzguNzMsNC4wMDEgNy41OTIsNC44MDYgNy4xNyw2LjAwMkM3LjUyMiw2LjAxMyA3Ljg2Niw2LjA1NyA4LjE5OCw2LjEzMVpNMTIuNjgyLDEwLjIwNUMxMy4yODIsMTAuNDIgMTMuODA3LDEwLjc5NSAxNC4yMDQsMTEuMjc3QzE0LjMyMSwxMS4xODIgMTQuMzg5LDExLjAzOSAxNC4zODksMTAuODg4QzE0LjM4OSwxMC43NTYgMTQuMzM3LDEwLjYyOSAxNC4yNDMsMTAuNTM1TDEzLjUzNiw5LjgyOEMxMy40NDIsOS43MzQgMTMuMzE0LDkuNjgxIDEzLjE4MSw5LjY4MUMxMi45MDcsOS42ODEgMTIuNjgxLDkuOTA2IDEyLjY4MSwxMC4xODFDMTIuNjgxLDEwLjE4OSAxMi42ODIsMTAuMTk3IDEyLjY4MiwxMC4yMDVaTTE0LjUsNi41QzE0LjIyNiw2LjUgMTQsNi43MjYgMTQsN0MxNCw3LjI3NCAxNC4yMjYsNy41IDE0LjUsNy41TDE1LjUsNy41QzE1Ljc3NCw3LjUgMTYsNy4yNzQgMTYsN0MxNiw2LjcyNiAxNS43NzQsNi41IDE1LjUsNi41TDE0LjUsNi41WiIgc3R5bGU9ImZpbGw6d2hpdGU7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4K';

/**
 * Class for the new blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3OpenMeteoBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    getWeatherDescription (code = -1) {
        switch (code) {
        case 0: return '快晴';
        case 1: return '晴れ';
        case 2: return '晴れ時々曇り';
        case 3: return '曇り';
        case 45: return '霧';
        case 48: return '霧';
        case 51: return '弱い霧雨';
        case 53: return '霧雨';
        case 55: return '強い霧雨';
        case 56: return '寒い霧雨';
        case 57: return '凍える霧雨';
        case 61: return '小雨';
        case 63: return '雨';
        case 65: return '豪雨';
        case 66: return '寒い雨';
        case 67: return '凍える雨';
        case 71: return '弱い雪';
        case 73: return '雪';
        case 75: return '強い雪';
        case 77: return '霧雪';
        case 80: return '弱いにわか雨';
        case 81: return 'にわか雨';
        case 82: return '強いにわか雨';
        case 85: return '弱いにわか雪';
        case 86: return '強いにわか雪';
        case 95: return '雷雨';
        case 96: return '雷雨';
        case 99: return '強い雷雨';
        default: return '不明';
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'openMeteo',
            name: '天気',
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'listWeather',
                    text: '天気予報の日付を[DATE_LIST]に、天気を[WEATHER_LIST]に格納する',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        DATE_LIST: {
                            type: ArgumentType.STRING,
                            defaultValue: 'リスト名'
                        },
                        WEATHER_LIST: {
                            type: ArgumentType.STRING,
                            defaultValue: 'リスト名'
                        }
                    }
                },
                {
                    opcode: 'listPrefectureWeather',
                    text: '[PREFECTURE]の天気予報の日付を[DATE_LIST]に、天気を[WEATHER_LIST]に格納する',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PREFECTURE: {
                            type: ArgumentType.NUMBER,
                            menu: 'prefectureMenu',
                            defaultValue: 0
                        },
                        DATE_LIST: {
                            type: ArgumentType.STRING,
                            defaultValue: 'リスト名'
                        },
                        WEATHER_LIST: {
                            type: ArgumentType.STRING,
                            defaultValue: 'リスト名'
                        }
                    }
                },
                {
                    opcode: 'getWeather',
                    text: '[OFFSET]日後の天気を取得',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        OFFSET: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'getPrefectureWeather',
                    text: '[PREFECTURE]の[OFFSET]日後の天気を取得',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PREFECTURE: {
                            type: ArgumentType.NUMBER,
                            menu: 'prefectureMenu',
                            defaultValue: 0
                        },
                        OFFSET: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                }
            ],
            menus: {
                prefectureMenu: {
                    acceptReporters: true,
                    items: prefectureLocations.map((loc, index) => ({
                        text: loc.prefecture,
                        value: index
                    }))
                }
            }
        };
    }

    async fetchWeather (latitude, longitude) {
        const prefix = 'https://api.open-meteo.com/v1/forecast?';
        const suffix = '&daily=weathercode&timezone=Asia%2FTokyo';

        const url = `${prefix}latitude=${latitude}&longitude=${longitude}${suffix}`;
        const res = await fetch(url);
        const result = await res.json();

        return result.daily;
    }

    async getPointWeather (latitude, longitude, offset) {
        const res = await this.fetchWeather(latitude, longitude);
        const weathercodes = res.weathercode;

        if (offset >= 0 && offset < weathercodes.length) {
            return this.getWeatherDescription(weathercodes[offset]);
        }
        return this.getWeatherDescription();
    }

    async getCurrentLocationWether (offset) {
        const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject));
        return this.getPointWeather(position.coords.latitude, position.coords.longitude, offset);
    }

    setList (list, array) {
        list.value = array;
        list._monitorUpToDate = false;
    }

    // 指定した県の日付指定の天気を取得
    getPrefectureWeather (args) {
        const index = Cast.toNumber(args.PREFECTURE);
        const loc = prefectureLocations[index];
        return this.getPointWeather(loc.latitude, loc.longitude, Cast.toNumber(args.OFFSET));
    }


    // 現在地の日付指定の天気を取得
    getWeather (args) {
        return this.getCurrentLocationWether(Cast.toNumber(args.OFFSET));
    }

    // 指定した県の一週間分の天気を取得
    async listPrefectureWeather (args, util) {
        const dateListName = Cast.toString(args.DATE_LIST);
        const weatherListName = Cast.toString(args.WEATHER_LIST);

        const dateList = util.target.lookupVariableByNameAndType(dateListName, Variable.LIST_TYPE);
        const weatherList = util.target.lookupVariableByNameAndType(weatherListName, Variable.LIST_TYPE);

        let res;
        if (dateList || weatherList) {
            const index = Cast.toNumber(args.PREFECTURE);
            const loc = prefectureLocations[index];
            res = await this.fetchWeather(loc.latitude, loc.longitude);
        }

        if (dateList) this.setList(dateList, res.time);
        if (weatherList) this.setList(weatherList, res.weathercode.map(wc => this.getWeatherDescription(wc)));
    }


    // 現在地の一週間分の天気を取得
    async listWeather (args, util) {
        const dateListName = Cast.toString(args.DATE_LIST);
        const weatherListName = Cast.toString(args.WEATHER_LIST);

        const dateList = util.target.lookupVariableByNameAndType(dateListName, Variable.LIST_TYPE);
        const weatherList = util.target.lookupVariableByNameAndType(weatherListName, Variable.LIST_TYPE);

        let res;
        if (dateList || weatherList) {
            const position = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject));
            res = await this.fetchWeather(position.coords.latitude, position.coords.longitude);
        }

        if (dateList) this.setList(dateList, res.time);
        if (weatherList) this.setList(weatherList, res.weathercode.map(wc => this.getWeatherDescription(wc)));
    }
}

module.exports = Scratch3OpenMeteoBlocks;
