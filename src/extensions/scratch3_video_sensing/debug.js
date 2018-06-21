/**
 * A debug "index" module exporting VideoMotion and VideoMotionView to debug
 * VideoMotion directly.
 * @file debug.js
 */

const VideoMotion = require('./library');
const VideoMotionView = require('./view');

module.exports = {
    VideoMotion,
    VideoMotionView
};
