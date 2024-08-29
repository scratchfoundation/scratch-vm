require('regenerator-runtime/runtime');
const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const Video = require('../../io/video');

function friendlyRound (amount) {
    return Number(amount).toFixed(2);
}

const ALL_EMOTIONS = ['joy',
    'sadness',
    'disgust',
    'anger',
    'fear'
];

/**
 * Icon svg to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIKCSBpZD0ic3ZnMTE3IiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQwIDQwIgoJIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzU2Q0JGNTt9Cgkuc3Qxe29wYWNpdHk6MC41NztmaWxsOiNFRTQwOTc7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Qye2ZpbGw6IzQ2OTFGRjt9Cgkuc3Qze2ZpbGw6IzM3NTI3Qjt9Cgkuc3Q0e29wYWNpdHk6MC40OTtmaWxsOiNFMDMwMEU7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Q1e29wYWNpdHk6MC40OTtmaWxsOiNCMjBEMjQ7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Q2e2ZpbGw6I0VERURFQjt9Cgkuc3Q3e2ZpbGw6I0NFQ0VDQzt9Cgkuc3Q4e2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+Cjxzb2RpcG9kaTpuYW1lZHZpZXcgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IiBib3JkZXJvcGFjaXR5PSIxIiBncmlkdG9sZXJhbmNlPSIxMCIgZ3VpZGV0b2xlcmFuY2U9IjEwIiBpZD0ibmFtZWR2aWV3MTE5IiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJFeHRlbnNpb25zL1NvZnR3YXJlL1ZpZGVvLVNlbnNpbmctQmxvY2siIGlua3NjYXBlOmN4PSIxNC40NjcwNjkiIGlua3NjYXBlOmN5PSI2LjU5MDMwNTYiIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIiBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIgaW5rc2NhcGU6c25hcC1zbW9vdGgtbm9kZXM9ImZhbHNlIiBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5MDciIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjAiIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTYwMCIgaW5rc2NhcGU6d2luZG93LXg9IjU3MSIgaW5rc2NhcGU6d2luZG93LXk9Ijk2IiBpbmtzY2FwZTp6b29tPSI3LjA0IiBvYmplY3R0b2xlcmFuY2U9IjEwIiBwYWdlY29sb3I9IiNmZmZmZmYiIHNob3dncmlkPSJmYWxzZSI+Cgk8L3NvZGlwb2RpOm5hbWVkdmlldz4KPHRpdGxlICBpZD0idGl0bGUxMDQiPkV4dGVuc2lvbnMvU29mdHdhcmUvVmlkZW8tU2Vuc2luZy1CbG9jazwvdGl0bGU+CjxkZXNjICBpZD0iZGVzYzEwNiI+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik05LjgsMjIuOWwtMS4xLTMuM2MtMC41LTEuNi0wLjgtMy4yLTAuOC00LjljMC02LjYsNS4zLTExLjksMTEuOS0xMS45czExLjksNS4zLDExLjksMTEuOQoJYzAsMS43LTAuMywzLjMtMC44LDQuOWwtMS4xLDMuM0g5Ljh6Ii8+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xOS44LDUuMWMtMi40LDAtNC44LDAuOS02LjYsMi40YzEuMi0wLjUsMi41LTAuOCwzLjktMC44YzUuOCwwLDEwLjQsNC42LDEwLjQsMTAuNGMwLDEuNS0wLjMsMi45LTAuNyw0LjMKCWwtMC40LDEuMmgyLjJsMS0yLjljMC40LTEuNCwwLjctMi44LDAuNy00LjNDMzAuMiw5LjcsMjUuNiw1LjEsMTkuOCw1LjF6Ii8+CjxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik0yNi4yLDMyLjlsLTMuNSwyLjljLTAuOCwwLjctMS44LDEtMi45LDFzLTIuMS0wLjMtMi45LTFsLTMuNS0yLjljLTEuMS0xLTEuOC0yLjQtMS45LTMuOGwtMC40LTYuNGwwLjctNwoJYzAuMy0yLjMsMi4xLTMuOSw0LjQtMy45aDcuNGMyLjMsMCw0LjEsMS43LDQuNCwzLjlsMC43LDdMMjguMiwyOUMyOC4xLDMwLjUsMjcuNCwzMS45LDI2LjIsMzIuOXoiLz4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTI4LDE5LjloMS43YzAuNiwwLDEuMSwwLjUsMS4xLDEuMXYyLjdjMCwxLjUtMS4yLDIuNy0yLjcsMi43TDI4LDE5LjlMMjgsMTkuOXoiLz4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTExLjYsMTkuOUg5LjljLTAuNiwwLTEuMSwwLjUtMS4xLDEuMXYyLjdjMCwxLjUsMS4yLDIuNywyLjcsMi43TDExLjYsMTkuOUwxMS42LDE5Ljl6Ii8+CjxwYXRoIGNsYXNzPSJzdDMiIGQ9Ik0yMS41LDI3aC0xLjd2LTZsMC4xLDAuMkMyMC4xLDIzLjIsMjAuOCwyNS4zLDIxLjUsMjd6Ii8+CjxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik0xNi42LDMwLjJsMi4yLTEuMWwxLjEsMC41bDEuMS0wLjVsMi4yLDEuMUwyMSwzMS40aC0yLjJMMTYuNiwzMC4yeiIvPgo8cGF0aCBjbGFzcz0ic3Q1IiBkPSJNMjMuMSwzMC4yaC0wLjVDMjIuNywzMC4yLDIyLjksMzAuMywyMy4xLDMwLjJMMjMuMSwzMC4yeiIvPgo8cGF0aCBjbGFzcz0ic3Q1IiBkPSJNMjIuNiwzMC4yaC02bDIuMSwxQzE5LjgsMzAuNywyMS4yLDMwLjIsMjIuNiwzMC4yeiIvPgo8cGF0aCBjbGFzcz0ic3Q2IiBkPSJNMjEuNSwyMWwwLjctMC41YzAuNC0wLjMsMS4xLTAuNiwxLjgtMC42YzAuNywwLDEuMywwLjIsMS44LDAuNmwwLjcsMC41bC0wLjcsMC41Yy0wLjQsMC4zLTEuMSwwLjYtMS44LDAuNgoJYy0wLjcsMC0xLjMtMC4yLTEuOC0wLjZMMjEuNSwyMXoiLz4KPHBhdGggY2xhc3M9InN0NyIgZD0iTTI1LjcsMjAuNWMtMC40LTAuMy0xLjEtMC41LTEuNy0wLjVjLTAuNywwLTEuMywwLjItMS44LDAuNkwyMS41LDIxbDAuMiwwLjJDMjIuOSwyMC43LDI0LjMsMjAuNSwyNS43LDIwLjV6IgoJLz4KPHBhdGggY2xhc3M9InN0NiIgZD0iTTEzLjMsMjFsMC43LTAuNWMwLjQtMC4zLDEuMS0wLjYsMS44LTAuNmMwLjcsMCwxLjMsMC4yLDEuOCwwLjZsMC43LDAuNWwtMC43LDAuNWMtMC40LDAuMy0xLjEsMC42LTEuOCwwLjYKCWMtMC43LDAtMS4zLTAuMi0xLjgtMC42TDEzLjMsMjF6Ii8+CjxwYXRoIGNsYXNzPSJzdDciIGQ9Ik0xNy40LDIwLjVjLTAuNS0wLjMtMS4xLTAuNS0xLjctMC41Yy0wLjcsMC0xLjMsMC4yLTEuOCwwLjZMMTMuMywyMWwwLjMsMC4yQzE0LjcsMjAuNywxNi4xLDIwLjUsMTcuNCwyMC41CglMMTcuNCwyMC41eiIvPgo8cGF0aCBjbGFzcz0ic3QzIiBkPSJNMjcuOCwxNS42Yy0wLjEtMS4yLTAuOC0yLjQtMS43LTMuMXYwLjFsMC44LDcuNmwtMC40LDdjLTAuMSwxLjctMC45LDMuMS0yLjEsNC4ybC0zLjgsMy4xCgljLTEsMC45LTIuNCwxLjMtMy44LDEuMWwwLjEsMC4xYzEuNywxLjQsNC4xLDEuNCw1LjgsMGwzLjUtMi45YzEuMS0xLDEuOC0yLjQsMS45LTMuOGwwLjQtNi40TDI3LjgsMTUuNnoiLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTIuMyw2LjRoNS42VjUuMkgxLjZDMS4zLDUuMiwxLDUuNSwxLDUuOHY2LjNoMS4zVjYuNHoiLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTM3LjQsMTIuMWgxLjNWNS44YzAtMC4zLTAuMy0wLjYtMC42LTAuNmgtNi4zdjEuM2g1LjZWMTIuMXoiLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTM3LjQsMzYuNWgtNS42djEuM0gzOGMwLjMsMCwwLjYtMC4zLDAuNi0wLjZ2LTYuM2gtMS4zdjUuNkgzNy40eiIvPgo8cGF0aCBjbGFzcz0ic3Q4IiBkPSJNMS42LDM3LjhoNi4zdi0xLjNIMi4zdi01LjZIMXY2LjNDMSwzNy41LDEuMywzNy44LDEuNiwzNy44eiIvPgo8L3N2Zz4K';

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIKCSBpZD0ic3ZnMTE3IiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQwIDQwIgoJIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzU2Q0JGNTt9Cgkuc3Qxe29wYWNpdHk6MC41NztmaWxsOiNFRTQwOTc7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Qye2ZpbGw6IzQ2OTFGRjt9Cgkuc3Qze2ZpbGw6IzM3NTI3Qjt9Cgkuc3Q0e29wYWNpdHk6MC40OTtmaWxsOiNFMDMwMEU7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Q1e29wYWNpdHk6MC40OTtmaWxsOiNCMjBEMjQ7ZW5hYmxlLWJhY2tncm91bmQ6bmV3ICAgIDt9Cgkuc3Q2e2ZpbGw6I0VERURFQjt9Cgkuc3Q3e2ZpbGw6I0NFQ0VDQzt9Cgkuc3Q4e2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+Cjxzb2RpcG9kaTpuYW1lZHZpZXcgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IiBib3JkZXJvcGFjaXR5PSIxIiBncmlkdG9sZXJhbmNlPSIxMCIgZ3VpZGV0b2xlcmFuY2U9IjEwIiBpZD0ibmFtZWR2aWV3MTE5IiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJFeHRlbnNpb25zL1NvZnR3YXJlL1ZpZGVvLVNlbnNpbmctQmxvY2siIGlua3NjYXBlOmN4PSIxNC40NjcwNjkiIGlua3NjYXBlOmN5PSI2LjU5MDMwNTYiIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIiBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIgaW5rc2NhcGU6c25hcC1zbW9vdGgtbm9kZXM9ImZhbHNlIiBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5MDciIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjAiIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTYwMCIgaW5rc2NhcGU6d2luZG93LXg9IjU3MSIgaW5rc2NhcGU6d2luZG93LXk9Ijk2IiBpbmtzY2FwZTp6b29tPSI3LjA0IiBvYmplY3R0b2xlcmFuY2U9IjEwIiBwYWdlY29sb3I9IiNmZmZmZmYiIHNob3dncmlkPSJmYWxzZSI+Cgk8L3NvZGlwb2RpOm5hbWVkdmlldz4KPHRpdGxlICBpZD0idGl0bGUxMDQiPkV4dGVuc2lvbnMvU29mdHdhcmUvVmlkZW8tU2Vuc2luZy1CbG9jazwvdGl0bGU+CjxkZXNjICBpZD0iZGVzYzEwNiI+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik05LjgsMjIuOWwtMS4xLTMuM2MtMC41LTEuNi0wLjgtMy4yLTAuOC00LjljMC02LjYsNS4zLTExLjksMTEuOS0xMS45czExLjksNS4zLDExLjksMTEuOQoJYzAsMS43LTAuMywzLjMtMC44LDQuOWwtMS4xLDMuM0g5Ljh6Ii8+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xOS44LDUuMWMtMi40LDAtNC44LDAuOS02LjYsMi40YzEuMi0wLjUsMi41LTAuOCwzLjktMC44YzUuOCwwLDEwLjQsNC42LDEwLjQsMTAuNGMwLDEuNS0wLjMsMi45LTAuNyw0LjMKCWwtMC40LDEuMmgyLjJsMS0yLjljMC40LTEuNCwwLjctMi44LDAuNy00LjNDMzAuMiw5LjcsMjUuNiw1LjEsMTkuOCw1LjF6Ii8+CjxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik0yNi4yLDMyLjlsLTMuNSwyLjljLTAuOCwwLjctMS44LDEtMi45LDFzLTIuMS0wLjMtMi45LTFsLTMuNS0yLjljLTEuMS0xLTEuOC0yLjQtMS45LTMuOGwtMC40LTYuNGwwLjctNwoJYzAuMy0yLjMsMi4xLTMuOSw0LjQtMy45aDcuNGMyLjMsMCw0LjEsMS43LDQuNCwzLjlsMC43LDdMMjguMiwyOUMyOC4xLDMwLjUsMjcuNCwzMS45LDI2LjIsMzIuOXoiLz4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTI4LDE5LjloMS43YzAuNiwwLDEuMSwwLjUsMS4xLDEuMXYyLjdjMCwxLjUtMS4yLDIuNy0yLjcsMi43TDI4LDE5LjlMMjgsMTkuOXoiLz4KPHBhdGggY2xhc3M9InN0MiIgZD0iTTExLjYsMTkuOUg5LjljLTAuNiwwLTEuMSwwLjUtMS4xLDEuMXYyLjdjMCwxLjUsMS4yLDIuNywyLjcsMi43TDExLjYsMTkuOUwxMS42LDE5Ljl6Ii8+CjxwYXRoIGNsYXNzPSJzdDMiIGQ9Ik0yMS41LDI3aC0xLjd2LTZsMC4xLDAuMkMyMC4xLDIzLjIsMjAuOCwyNS4zLDIxLjUsMjd6Ii8+CjxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik0xNi42LDMwLjJsMi4yLTEuMWwxLjEsMC41bDEuMS0wLjVsMi4yLDEuMUwyMSwzMS40aC0yLjJMMTYuNiwzMC4yeiIvPgo8cGF0aCBjbGFzcz0ic3Q1IiBkPSJNMjMuMSwzMC4yaC0wLjVDMjIuNywzMC4yLDIyLjksMzAuMywyMy4xLDMwLjJMMjMuMSwzMC4yeiIvPgo8cGF0aCBjbGFzcz0ic3Q1IiBkPSJNMjIuNiwzMC4yaC02bDIuMSwxQzE5LjgsMzAuNywyMS4yLDMwLjIsMjIuNiwzMC4yeiIvPgo8cGF0aCBjbGFzcz0ic3Q2IiBkPSJNMjEuNSwyMWwwLjctMC41YzAuNC0wLjMsMS4xLTAuNiwxLjgtMC42YzAuNywwLDEuMywwLjIsMS44LDAuNmwwLjcsMC41bC0wLjcsMC41Yy0wLjQsMC4zLTEuMSwwLjYtMS44LDAuNgoJYy0wLjcsMC0xLjMtMC4yLTEuOC0wLjZMMjEuNSwyMXoiLz4KPHBhdGggY2xhc3M9InN0NyIgZD0iTTI1LjcsMjAuNWMtMC40LTAuMy0xLjEtMC41LTEuNy0wLjVjLTAuNywwLTEuMywwLjItMS44LDAuNkwyMS41LDIxbDAuMiwwLjJDMjIuOSwyMC43LDI0LjMsMjAuNSwyNS43LDIwLjV6IgoJLz4KPHBhdGggY2xhc3M9InN0NiIgZD0iTTEzLjMsMjFsMC43LTAuNWMwLjQtMC4zLDEuMS0wLjYsMS44LTAuNmMwLjcsMCwxLjMsMC4yLDEuOCwwLjZsMC43LDAuNWwtMC43LDAuNWMtMC40LDAuMy0xLjEsMC42LTEuOCwwLjYKCWMtMC43LDAtMS4zLTAuMi0xLjgtMC42TDEzLjMsMjF6Ii8+CjxwYXRoIGNsYXNzPSJzdDciIGQ9Ik0xNy40LDIwLjVjLTAuNS0wLjMtMS4xLTAuNS0xLjctMC41Yy0wLjcsMC0xLjMsMC4yLTEuOCwwLjZMMTMuMywyMWwwLjMsMC4yQzE0LjcsMjAuNywxNi4xLDIwLjUsMTcuNCwyMC41CglMMTcuNCwyMC41eiIvPgo8cGF0aCBjbGFzcz0ic3QzIiBkPSJNMjcuOCwxNS42Yy0wLjEtMS4yLTAuOC0yLjQtMS43LTMuMXYwLjFsMC44LDcuNmwtMC40LDdjLTAuMSwxLjctMC45LDMuMS0yLjEsNC4ybC0zLjgsMy4xCgljLTEsMC45LTIuNCwxLjMtMy44LDEuMWwwLjEsMC4xYzEuNywxLjQsNC4xLDEuNCw1LjgsMGwzLjUtMi45YzEuMS0xLDEuOC0yLjQsMS45LTMuOGwwLjQtNi40TDI3LjgsMTUuNnoiLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTIuMyw2LjRoNS42VjUuMkgxLjZDMS4zLDUuMiwxLDUuNSwxLDUuOHY2LjNoMS4zVjYuNHoiLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTM3LjQsMTIuMWgxLjNWNS44YzAtMC4zLTAuMy0wLjYtMC42LTAuNmgtNi4zdjEuM2g1LjZWMTIuMXoiLz4KPHBhdGggY2xhc3M9InN0OCIgZD0iTTM3LjQsMzYuNWgtNS42djEuM0gzOGMwLjMsMCwwLjYtMC4zLDAuNi0wLjZ2LTYuM2gtMS4zdjUuNkgzNy40eiIvPgo8cGF0aCBjbGFzcz0ic3Q4IiBkPSJNMS42LDM3LjhoNi4zdi0xLjNIMi4zdi01LjZIMXY2LjNDMSwzNy41LDEuMywzNy44LDEuNiwzNy44eiIvPgo8L3N2Zz4K';

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

const EXTENSION_ID = 'poseFace';

/**
 * Class for the motion-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3PoseNetBlocks {
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
         * A flag to determine if this extension has been installed in a project.
         * It is set to false the first time getInfo is run.
         * @type {boolean}
         */
        this.firstInstall = true;

        if (this.runtime.ioDevices) {
            this.runtime.on(Runtime.PROJECT_LOADED, this.projectStarted.bind(this));
            this.runtime.on(Runtime.PROJECT_RUN_START, this.reset.bind(this));
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
        return 'Scratch.poseNet';
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
    projectStarted () {
        this.setVideoTransparency({
            TRANSPARENCY: this.globalVideoTransparency
        });
        this.videoToggle({
            VIDEO_STATE: this.globalVideoState
        });
    }

    reset () {
    }

    isConnected () {
        return this.hasResult;
    }

    connect () {
    }

    scan () {
    }

    async _loop () {
        while (true) {
            const frame = this.runtime.ioDevices.video.getFrame({
                format: Video.FORMAT_IMAGE_DATA,
                dimensions: Scratch3PoseNetBlocks.DIMENSIONS
            });

            const time = +new Date();
            if (frame) {
                this.affdexState = await this.estimateAffdexOnImage(frame);
                if (this.affdexState) {
                    this.hasResult = true;
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
                } else {
                    this.hasResult = false;
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
                }
            }
            const estimateThrottleTimeout = (+new Date() - time) / 4;
            await new Promise(r => setTimeout(r, estimateThrottleTimeout));
        }
    }

    async estimateAffdexOnImage (imageElement) {
        const affdexDetector = await this.ensureAffdexLoaded(imageElement);

        affdexDetector.process(imageElement, 0);
        return new Promise((resolve, reject) => {
            const resultListener = function (faces, image, timestamp) {
                affdexDetector.removeEventListener('onImageResultsSuccess', resultListener);
                if (faces.length < 1) {
                    resolve(null);
                    return;
                }
                resolve(faces[0]);
            };
            affdexDetector.addEventListener('onImageResultsSuccess', resultListener);
        });
    }

    async ensureAffdexLoaded (imageElement) {
        if (!this._affdex) {
            const affdexLoader = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                document.body.appendChild(script);
                script.onload = resolve;
                script.onerror = reject;
                script.async = true;
                script.src = 'https://download.affectiva.com/js/3.2.1/affdex.js';
            });
            await affdexLoader;
            const affdexStarter = new Promise((resolve, reject) => {
                const width = Video.DIMENSIONS[0];
                const height = Video.DIMENSIONS[1];
                const faceMode = window.affdex.FaceDetectorMode.LARGE_FACES;
                const detector = new window.affdex.PhotoDetector(imageElement, width, height, faceMode);
                detector.detectAllEmotions();
                detector.detectAllExpressions();
                detector.start();
                this._affdex = detector;
                detector.addEventListener('onInitializeSuccess', resolve);
            });
            await affdexStarter;
        }
        return this._affdex;
    }

    async estimatePoseOnImage (imageElement) {
        // load the posenet model from a checkpoint
        const bodyModel = await this.ensureBodyModelLoaded();
        return await bodyModel.estimateSinglePose(imageElement, {
            flipHorizontal: false
        });
    }

    async ensureBodyModelLoaded () {
        if (!this._bodyModel) {
            this._bodyModel = await posenet.load();
        }
        return this._bodyModel;
    }

    /**
     * @param imageElement
     * @returns {Promise<AnnotatedPrediction[]>}
     */
    async estimateHandPoseOnImage (imageElement) {
        const handModel = await this.getLoadedHandModel();
        return await handModel.estimateHands(imageElement, {
            flipHorizontal: false
        });
    }

    async getLoadedHandModel () {
        if (!this._handModel) {
            this._handModel = await handpose.load();
        }
        return this._handModel;
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
            this.projectStarted();
            this.firstInstall = false;
        }

        // Return extension definition
        return {
            id: EXTENSION_ID,
            name: formatMessage({
                id: 'face.categoryName',
                default: 'Face Sensing',
                description: 'Label for PoseNet category'
            }),
            showStatusButton: true,
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            blocks: [
                {
                    opcode: 'affdexGoToPart',
                    text: 'go to [AFFDEX_POINT]',
                    blockType: BlockType.COMMAND,
                    isTerminal: false,
                    arguments: {
                        AFFDEX_POINT: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                            menu: 'AFFDEX_POINT'
                        }
                    }
                },
                '---',
                {
                    opcode: 'affdexWhenExpression',
                    text: 'when [EXPRESSION] detected',
                    blockType: BlockType.HAT,
                    isTerminal: true,
                    arguments: {
                        EXPRESSION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'smile',
                            menu: 'EXPRESSION'
                        }
                    }
                },
                {
                    opcode: 'affdexExpressionAmount',
                    text: 'amount of [EXPRESSION]',
                    blockType: BlockType.REPORTER,
                    isTerminal: true,
                    arguments: {
                        EXPRESSION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'smile',
                            menu: 'EXPRESSION'
                        }
                    }
                },
                {
                    opcode: 'affdexIsExpression',
                    text: 'expressing [EXPRESSION]',
                    blockType: BlockType.BOOLEAN,
                    isTerminal: true,
                    arguments: {
                        EXPRESSION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'smile',
                            menu: 'EXPRESSION'
                        }
                    }
                },
                '---',
                {
                    opcode: 'affdexWhenEmotion',
                    text: 'when [EMOTION] feeling detected',
                    blockType: BlockType.HAT,
                    isTerminal: true,
                    arguments: {
                        EMOTION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'joy',
                            menu: 'EMOTION'
                        }
                    }
                },
                {
                    opcode: 'affdexEmotionAmount',
                    text: 'level of [EMOTION_ALL]',
                    blockType: BlockType.REPORTER,
                    isTerminal: true,
                    arguments: {
                        EMOTION_ALL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'joy',
                            menu: 'EMOTION_ALL'
                        }
                    }
                },
                {
                    opcode: 'affdexIsTopEmotion',
                    text: 'feeling [EMOTION]',
                    blockType: BlockType.BOOLEAN,
                    isTerminal: true,
                    arguments: {
                        EMOTION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'joy',
                            menu: 'EMOTION'
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
                            defaultValue: VideoState.OFF
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
            ],
            menus: {
                AFFDEX_POINT: {
                    items: [
                        {text: 'left ear', value: '0'},
                        {text: 'left chin', value: '1'},
                        {text: 'chin', value: '2'},
                        {text: 'right chin', value: '3'},
                        {text: 'right ear', value: '4'},
                        {text: 'left outer eyebrow', value: '5'},
                        {text: 'left eyebrow', value: '6'},
                        {text: 'left inner eyebrow', value: '7'},
                        {text: 'right inner eyebrow', value: '8'},
                        {text: 'right eyebrow', value: '9'},
                        {text: 'right outer eyebrow', value: '10'},
                        {text: 'nose bridge', value: '11'},
                        {text: 'nose tip', value: '12'},
                        {text: 'left nostril', value: '13'},
                        {text: 'nose tip', value: '14'},
                        {text: 'right nostril', value: '15'},
                        {text: 'left outer eye crease', value: '16'},
                        {text: 'left inner eye crease', value: '17'},
                        {text: 'right inner eye crease', value: '18'},
                        {text: 'right outer eye crease', value: '19'},
                        {text: 'left mouth crease', value: '20'},
                        {text: 'left upper lip point', value: '21'},
                        {text: 'upper lip', value: '22'},
                        {text: 'right upper lip point', value: '23'},
                        {text: 'right mouth crease', value: '24'},
                        {text: 'right lower lip point', value: '25'},
                        {text: 'lower lip', value: '26'},
                        {text: 'left lower lip point', value: '27'},
                        {text: 'upper lip bottom', value: '28'},
                        {text: 'lower lip top', value: '29'},
                        {text: 'left upper eyelid', value: '30'},
                        {text: 'left lower eyelid', value: '31'},
                        {text: 'right upper eyelid', value: '32'},
                        {text: 'right lower eyelid', value: '33'}
                    ]
                },
                EMOTION: {
                    acceptReporters: true,
                    items: [
                        {text: 'joyful', value: 'joy'},
                        {text: 'sad', value: 'sadness'},
                        {text: 'disgusted', value: 'disgust'},
                        // {text: 'contempt', value: 'contempt'},
                        {text: 'angry', value: 'anger'},
                        {text: 'fearful', value: 'fear'}
                        // {text: 'surprise', value: 'surprise'},
                        // {text: 'valence', value: 'valence'},
                        // {text: 'engagement', value: 'engagement'},
                    ]
                },
                EXPRESSION: {
                    acceptReporters: true,
                    items: [
                        {text: 'smile', value: 'smile'},
                        {text: 'mouth open', value: 'mouthOpen'},
                        {text: 'eye closure', value: 'eyeClosure'},
                        {text: 'eyebrow raise', value: 'browRaise'},
                        {text: 'whistling', value: 'lipPucker'},
                        {text: 'eye widening', value: 'eyeWiden'},
                        // {text:'innerBrowRaise', value: 'innerBrowRaise'},
                        {text: 'eyebrow furrow', value: 'browFurrow'},
                        {text: 'nose wrinkle', value: 'noseWrinkle'},
                        {text: 'upper lip raise', value: 'upperLipRaise'},
                        {text: 'lip corner pull', value: 'lipCornerDepressor'},
                        {text: 'chin raise', value: 'chinRaise'},
                        // {text:'lip press', value:  'lipPress'},
                        // {text:'lip suck', value:  'lipSuck'},
                        {text: 'smirk', value: 'smirk'},
                        {text: 'attention', value: 'attention'},
                        {text: 'eyelid tighten', value: 'lidTighten'},
                        {text: 'jaw drop', value: 'jawDrop'},
                        {text: 'cheek dimple', value: 'dimpler'},
                        {text: 'cheek raise', value: 'cheekRaise'},
                        {text: 'lip stretch', value: 'lipStretch'}
                    ]
                },
                EMOTION_ALL: {
                    acceptReporters: true,
                    items: [
                        {text: 'joy', value: 'joy'},
                        {text: 'sadness', value: 'sadness'},
                        {text: 'disgust', value: 'disgust'},
                        {text: 'contempt', value: 'contempt'},
                        {text: 'anger', value: 'anger'},
                        {text: 'fear', value: 'fear'},
                        {text: 'surprise', value: 'surprise'},
                        {text: 'valence', value: 'valence'},
                        {text: 'engagement', value: 'engagement'}
                    ]
                },
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

    affdexMouthOpen () {
        if (!this.affdexState || !this.affdexState.expressions) {
            return false;
        }
        return this.affdexState.expressions.mouthOpen > .5;
    }

    affdexIsExpression (args, util) {
        if (!this.affdexState || !this.affdexState.expressions) {
            return false;
        }
        return this.affdexState.expressions[args.EXPRESSION] > .5;
    }

    affdexExpressionAmount (args, util) {
        if (!this.affdexState || !this.affdexState.expressions) {
            return 0;
        }
        return friendlyRound(this.affdexState.expressions[args.EXPRESSION]);
    }

    affdexMouthOpenAmount () {
        if (!this.affdexState || !this.affdexState.expressions) {
            return 0;
        }
        return friendlyRound(this.affdexState.expressions.mouthOpen);
    }

    affdexIsEmotion (args, util) {
        if (!this.affdexState || !this.affdexState.emotions) {
            return false;
        }
        return this.affdexState.emotions[args.EMOTION_ALL] > 50;
    }

    affdexWhenExpression () {
        return this.affdexIsExpression(...arguments);
    }

    affdexWhenEmotion () {
        return this.affdexIsTopEmotion(...arguments);
    }

    affdexIsTopEmotion (args, util) {
        if (!this.affdexState || !this.affdexState.emotions) {
            return false;
        }
        let maxEmotionValue = -Number.MAX_VALUE;
        let maxEmotion = null;
        ALL_EMOTIONS.forEach(emotion => {
            const emotionValue = this.affdexState.emotions[emotion];
            if (emotionValue > maxEmotionValue) {
                maxEmotionValue = emotionValue;
                maxEmotion = emotion;
            }
        });
        return args.EMOTION === maxEmotion;
    }

    affdexTopEmotionName (args, util) {
        if (!this.affdexState || !this.affdexState.emotions) {
            return '';
        }
        let maxEmotionValue = -Number.MAX_VALUE;
        let maxEmotion = '';
        ALL_EMOTIONS.forEach(emotion => {
            const emotionValue = this.affdexState.emotions[emotion];
            if (emotionValue > maxEmotionValue) {
                maxEmotionValue = emotionValue;
                maxEmotion = emotion;
            }
        });
        return maxEmotion;
    }

    affdexTopEmotionAmount (args, util) {
        if (!this.affdexState || !this.affdexState.emotions) {
            return 0;
        }
        let maxEmotionValue = -Number.MAX_VALUE;
        let maxEmotion = null;
        ALL_EMOTIONS.forEach(emotion => {
            const emotionValue = this.affdexState.emotions[emotion];
            if (emotionValue > maxEmotionValue) {
                maxEmotionValue = emotionValue;
                maxEmotion = emotion;
            }
        });
        return friendlyRound(maxEmotionValue);
    }

    affdexEmotionAmount (args, util) {
        if (!this.affdexState || !this.affdexState.emotions) {
            return 0;
        }
        return friendlyRound(this.affdexState.emotions[args.EMOTION_ALL]);
    }

    affdexEyesClosed () {
        if (!this.affdexState || !this.affdexState.expressions) {
            return false;
        }
        return this.affdexState.expressions.eyeClosure > .5;
    }

    affdexSmile () {
        if (!this.affdexState || !this.affdexState.expressions) {
            return false;
        }
        return this.affdexState.expressions.smile > .5;
    }

    affdexSmileAmount () {
        if (!this.affdexState || !this.affdexState.expressions) {
            return 0;
        }
        return friendlyRound(this.affdexState.expressions.smile);
    }

    affdexBrowRaise () {
        if (!this.affdexState || !this.affdexState.expressions) {
            return 0;
        }
        return friendlyRound(this.affdexState.expressions.browRaise);
    }

    affdexGoToPart (args, util) {
        if (!this.affdexState || !this.affdexState.featurePoints) {
            return;
        }
        const featurePoint = this.affdexState.featurePoints[parseInt(args.AFFDEX_POINT, 10)];
        const {x, y} = this.affdexCoordsToScratch(featurePoint);
        util.target.setXY(x, y, false);
    }

    affdexCoordsToScratch ({x, y}) {
        return {x: x - (Video.DIMENSIONS[0] / 2), y: (Video.DIMENSIONS[1] / 2) - y};
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

module.exports = Scratch3PoseNetBlocks;
