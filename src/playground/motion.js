(function () {
    const video = document.createElement('video');
    navigator.getUserMedia({
        audio: false,
        video: {
            width: {min: 480, ideal: 640},
            height: {min: 360, ideal: 480}
        }
    }, stream => {
        video.autoplay = true;
        video.src = window.URL.createObjectURL(stream);
        // Get the track to hint to the browser the stream needs to be running
        // even though we don't add the video tag to the DOM.
        stream.getTracks();
        video.addEventListener('play', () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
        });
    }, err => {
        /* eslint no-console:0 */
        console.log(err);
    });

    const VideoMotion = window.Scratch3MotionDetect.VideoMotion;
    const VideoMotionView = window.Scratch3MotionDetect.VideoMotionView;

    // Create motion detector
    const motion = new VideoMotion();

    // Create debug views that will render different slices of how the detector
    // uses the a frame of input.
    const OUTPUT = VideoMotionView.OUTPUT;
    const outputKeys = Object.keys(OUTPUT);
    const outputValues = Object.values(OUTPUT);
    const views = outputValues
        .map(output => new VideoMotionView(motion, output));
    const view = views[0];

    const defaultViews = [OUTPUT.INPUT, OUTPUT.XY_CELL, OUTPUT.T_CELL, OUTPUT.UV];

    const activators = document.createElement('div');
    activators.style.userSelect = 'none';
    outputValues.forEach((output, index) => {
        const checkboxLabel = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = defaultViews.indexOf(output) !== -1;
        const checkboxSpan = document.createElement('span');
        checkboxSpan.innerText = outputKeys[index];
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(checkboxSpan);

        const _view = views[index];
        _view.canvas.style.display = checkbox.checked ? '' : 'none';
        _view.active = checkbox.checked;
        checkbox.onchange = event => {
            _view.canvas.style.display = checkbox.checked ? '' : 'none';
            _view.active = checkbox.checked;
            event.preventDefault();
            return false;
        };

        activators.appendChild(checkboxLabel);
    });
    document.body.appendChild(activators);

    // Add a text line to display milliseconds per frame, motion value, and
    // motion direction
    const textEl = document.createElement('div');
    document.body.appendChild(textEl);
    let textTimer = Date.now();

    // Add the motion debug views to the dom after the text line, so the text
    // appears first.
    views.forEach(_view => document.body.appendChild(_view.canvas));

    // Create a temporary canvas the video will be drawn to so the video's
    // bitmap data can be transformed into a TypeArray.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = view.canvas.width;
    tempCanvas.height = view.canvas.height;
    const ctx = tempCanvas.getContext('2d');

    const loop = function () {
        const timeoutId = setTimeout(loop, 33);

        try {
            // Get the bitmap data for the video frame
            ctx.scale(-1, 1);
            ctx.drawImage(
                video,
                0, 0, video.width || video.clientWidth, video.height || video.clientHeight,
                -480, 0, tempCanvas.width, tempCanvas.height
            );
            ctx.resetTransform();
            const data = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            const b = performance.now();
            motion.addFrame(data.data);
            motion.analyzeFrame();
            if (Date.now() - textTimer > 250) {
                const e = performance.now();
                const analyzeDuration = ((e - b) * 1000).toFixed(0);
                const motionAmount = motion.motionAmount.toFixed(1);
                const motionDirection = motion.motionDirection.toFixed(1);
                textEl.innerText = `${analyzeDuration} :: ${motionAmount} :: ${motionDirection}`;
                textTimer = Date.now();
            }
            views.forEach(_view => _view.active && _view.draw());
        } catch (error) {
            /* eslint no-console:0 */
            console.error(error.stack || error);
            clearTimeout(timeoutId);
        }
    };

    loop();
}());
