const {createReadStream} = require('fs');
const {join} = require('path');

const {PNG} = require('pngjs');
const {test} = require('tap');

const {wrapClamp} = require('../../src/util/math-util');

const VideoSensing = require('../../src/extensions/scratch3_video_sensing/index.js');
const VideoMotion = require('../../src/extensions/scratch3_video_sensing/library.js');

/**
 * Prefix to the mock frame images used to test the video sensing extension.
 * @type {string}
 */
const pngPrefix = 'extension_video_sensing_';

/**
 * Map of frame keys to the image filenames appended to the pngPrefix.
 * @type {object}
 */
const framesMap = {
    center: 'center',
    left: 'left-5',
    left2: 'left-10',
    down: 'down-10'
};

/**
 * Asynchronously read a png file and copy its pixel data into a typed array
 * VideoMotion will accept.
 * @param {string} name - partial filename to read
 * @returns {Promise.<Uint32Array>} pixel data of the image
 */
const readPNG = name => (
    new Promise((resolve, reject) => {
        const png = new PNG();
        createReadStream(join(__dirname, `${pngPrefix}${name}.png`))
            .pipe(png)
            .on('parsed', () => {
                // Copy the RGBA pixel values into a separate typed array and
                // cast the array to Uint32, the array format VideoMotion takes.
                resolve(new Uint32Array(new Uint8ClampedArray(png.data).buffer));
            })
            .on('error', reject);
    })
);

/**
 * Read all the frames for testing asynchrnously and produce an object with
 * keys following the keys in framesMap.
 * @returns {object} mapping of keys in framesMap to image data read from disk
 */
const readFrames = (() => {
    // Use this immediately invoking function expression (IIFE) to delay reading
    // once to the first test that calls readFrames.
    let _promise = null;

    return () => {
        if (_promise === null) {
            _promise = Promise.all(Object.keys(framesMap).map(key => readPNG(framesMap[key])))
                .then(pngs => (
                    Object.keys(framesMap).reduce((frames, key, i) => {
                        frames[key] = pngs[i];
                        return frames;
                    }, {})
                ));
        }
        return _promise;
    };
})();

/**
 * Match if actual is within optMargin to expect. If actual is under -180,
 * match if actual + 360 is near expect. If actual is over 180, match if actual
 * - 360 is near expect.
 * @param {number} actual - actual angle in degrees
 * @param {number} expect - expected angle in degrees
 * @param {number} optMargin - allowed margin between actual and expect in degrees
 * @returns {boolean} true if actual is close to expect
 */
const isNearAngle = (actual, expect, optMargin = 10) => (
    (wrapClamp(actual - expect, 0, 359) < optMargin) ||
    (wrapClamp(actual - expect, 0, 359) > 360 - optMargin)
);

// A fake scratch-render drawable that will be used by VideoMotion to restrain
// the area considered for motion detection in VideoMotion.getLocalMotion
const fakeDrawable = {
    updateMatrix () {}, // no-op, since isTouching always returns true

    getFastBounds () {
        return {
            left: -120,
            top: 60,
            right: 0,
            bottom: -60
        };
    },

    isTouching () {
        return true;
    }
};

// A fake MotionState used to test the stored values in
// VideoMotion.getLocalMotion, VideoSensing.videoOn and
// VideoSensing.whenMotionGreaterThan.
const fakeMotionState = {
    motionFrameNumber: -1,
    motionAmount: -1,
    motionDirection: -Infinity
};

// A fake target referring to the fake drawable and MotionState.
const fakeTarget = {
    drawableID: 0,

    getCustomState () {
        return fakeMotionState;
    },
    setCustomState () {}
};

const fakeRuntime = {
    targets: [fakeTarget],

    // Without defined devices, VideoSensing will not try to start sampling from
    // a video source.
    ioDevices: null,

    renderer: {
        _allDrawables: [
            fakeDrawable
        ]
    }
};

const fakeBlockUtility = {
    target: fakeTarget
};

test('detect motionAmount between frames', t => {
    t.plan(6);

    return readFrames()
        .then(frames => {
            const detect = new VideoMotion();

            // Each of these pairs should have enough motion for the detector.
            const framePairs = [
                [frames.center, frames.left],
                [frames.center, frames.left2],
                [frames.left, frames.left2],
                [frames.left, frames.center],
                [frames.center, frames.down],
                [frames.down, frames.center]
            ];

            // Add both frames of a pair and test for motion.
            let index = 0;
            for (const [frame1, frame2] of framePairs) {
                detect.addFrame(frame1);
                detect.addFrame(frame2);

                detect.analyzeFrame();
                t.ok(
                    detect.motionAmount > 10,
                    `frame pair ${index + 1} has motion ${detect.motionAmount} over threshold (10)`
                );
                index += 1;
            }

            t.end();
        });
});

test('detect local motionAmount between frames', t => {
    t.plan(6);

    return readFrames()
        .then(frames => {
            const detect = new VideoMotion();

            // Each of these pairs should have enough motion for the detector.
            const framePairs = [
                [frames.center, frames.left],
                [frames.center, frames.left2],
                [frames.left, frames.left2],
                [frames.left, frames.center],
                [frames.center, frames.down],
                [frames.down, frames.center]
            ];

            // Add both frames of a pair and test for local motion.
            let index = 0;
            for (const [frame1, frame2] of framePairs) {
                detect.addFrame(frame1);
                detect.addFrame(frame2);

                detect.analyzeFrame();
                detect.getLocalMotion(fakeDrawable, fakeMotionState);
                t.ok(
                    fakeMotionState.motionAmount > 10,
                    `frame pair ${index + 1} has motion ${fakeMotionState.motionAmount} over threshold (10)`
                );
                index += 1;
            }

            t.end();
        });
});

test('detect motionDirection between frames', t => {
    t.plan(6);

    return readFrames()
        .then(frames => {
            const detect = new VideoMotion();

            // Each of these pairs is moving in the given direction. Does the detector
            // guess a value to that?
            const directionMargin = 10;
            const framePairs = [
                {
                    frames: [frames.center, frames.left],
                    direction: -90
                },
                {
                    frames: [frames.center, frames.left2],
                    direction: -90
                },
                {
                    frames: [frames.left, frames.left2],
                    direction: -90
                },
                {
                    frames: [frames.left, frames.center],
                    direction: 90
                },
                {
                    frames: [frames.center, frames.down],
                    direction: 180
                },
                {
                    frames: [frames.down, frames.center],
                    direction: 0
                }
            ];

            // Add both frames of a pair and check if the motionDirection is near the
            // expected angle.
            let index = 0;
            for (const {frames: [frame1, frame2], direction} of framePairs) {
                detect.addFrame(frame1);
                detect.addFrame(frame2);

                detect.analyzeFrame();
                t.ok(
                    isNearAngle(detect.motionDirection, direction, directionMargin),
                    `frame pair ${index + 1} is ${detect.motionDirection.toFixed(0)} ` +
                    `degrees and close to ${direction} degrees`
                );
                index += 1;
            }

            t.end();
        });
});

test('detect local motionDirection between frames', t => {
    t.plan(6);

    return readFrames()
        .then(frames => {
            const detect = new VideoMotion();

            // Each of these pairs is moving in the given direction. Does the detector
            // guess a value to that?
            const directionMargin = 10;
            const framePairs = [
                {
                    frames: [frames.center, frames.left],
                    direction: -90
                },
                {
                    frames: [frames.center, frames.left2],
                    direction: -90
                },
                {
                    frames: [frames.left, frames.left2],
                    direction: -90
                },
                {
                    frames: [frames.left, frames.center],
                    direction: 90
                },
                {
                    frames: [frames.center, frames.down],
                    direction: 180
                },
                {
                    frames: [frames.down, frames.center],
                    direction: 0
                }
            ];

            // Add both frames of a pair and check if the local motionDirection is near
            // the expected angle.
            let index = 0;
            for (const {frames: [frame1, frame2], direction} of framePairs) {
                detect.addFrame(frame1);
                detect.addFrame(frame2);

                detect.analyzeFrame();
                detect.getLocalMotion(fakeDrawable, fakeMotionState);
                const motionDirection = fakeMotionState.motionDirection;
                t.ok(
                    isNearAngle(motionDirection, direction, directionMargin),
                    `frame pair ${index + 1} is ${motionDirection.toFixed(0)} degrees and close to ${direction} degrees`
                );
                index += 1;
            }

            t.end();
        });
});

test('videoOn returns value dependent on arguments', t => {
    t.plan(4);

    return readFrames()
        .then(frames => {
            const sensing = new VideoSensing(fakeRuntime);

            // With these two frame test if we get expected values depending on the
            // arguments to videoOn.
            sensing.detect.addFrame(frames.center);
            sensing.detect.addFrame(frames.left);

            const motionAmount = sensing.videoOn({
                ATTRIBUTE: VideoSensing.SensingAttribute.MOTION,
                SUBJECT: VideoSensing.SensingSubject.STAGE
            }, fakeBlockUtility);
            t.ok(
                motionAmount > 10,
                `stage motionAmount ${motionAmount} is over the threshold (10)`
            );

            const localMotionAmount = sensing.videoOn({
                ATTRIBUTE: VideoSensing.SensingAttribute.MOTION,
                SUBJECT: VideoSensing.SensingSubject.SPRITE
            }, fakeBlockUtility);
            t.ok(
                localMotionAmount > 10,
                `sprite motionAmount ${localMotionAmount} is over the threshold (10)`
            );

            const motionDirection = sensing.videoOn({
                ATTRIBUTE: VideoSensing.SensingAttribute.DIRECTION,
                SUBJECT: VideoSensing.SensingSubject.STAGE
            }, fakeBlockUtility);
            t.ok(
                isNearAngle(motionDirection, -90),
                `stage motionDirection ${motionDirection.toFixed(0)} degrees is close to ${90} degrees`
            );

            const localMotionDirection = sensing.videoOn({
                ATTRIBUTE: VideoSensing.SensingAttribute.DIRECTION,
                SUBJECT: VideoSensing.SensingSubject.SPRITE
            }, fakeBlockUtility);
            t.ok(
                isNearAngle(localMotionDirection, -90),
                `sprite motionDirection ${localMotionDirection.toFixed(0)} degrees is close to ${90} degrees`
            );

            t.end();
        });
});

test('whenMotionGreaterThan returns true if local motion meets target', t => {
    t.plan(2);

    return readFrames()
        .then(frames => {
            const sensing = new VideoSensing(fakeRuntime);

            // With these two frame test if we get expected values depending on the
            // arguments to whenMotionGreaterThan.
            sensing.detect.addFrame(frames.center);
            sensing.detect.addFrame(frames.left);

            const over20 = sensing.whenMotionGreaterThan({
                REFERENCE: 20
            }, fakeBlockUtility);
            t.ok(
                over20,
                `enough motion in drawable bounds to reach reference of 20`
            );

            const over80 = sensing.whenMotionGreaterThan({
                REFERENCE: 80
            }, fakeBlockUtility);
            t.notOk(
                over80,
                `not enough motion in drawable bounds to reach reference of 80`
            );

            t.end();
        });
});
