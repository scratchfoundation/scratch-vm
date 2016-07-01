window.onload = function() {
    // Lots of global variables to make debugging easier
    var vm = new window.VirtualMachine();
    window.vm = vm;

    var canvas = document.getElementById('scratch-stage');
    window.renderer = new window.RenderWebGLLocal(canvas);
    window.renderer.connectWorker(window.vm.vmWorker);

    var toolbox = document.getElementById('toolbox');
    var workspace = window.Blockly.inject('blocks', {
        toolbox: toolbox,
        media: '../node_modules/scratch-blocks/media/',
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.75
        },
        colours: {
            workspace: '#334771',
            flyout: '#283856',
            scrollbar: '#24324D',
            scrollbarHover: '#0C111A',
            insertionMarker: '#FFFFFF',
            insertionMarkerOpacity: 0.3,
            fieldShadow: 'rgba(255, 255, 255, 0.3)',
            dragShadowOpacity: 0.6
        }
    });
    window.workspace = workspace;

    // Block events.
    // @todo: Re-enable flyout listening after fixing GH-69.
    workspace.addChangeListener(vm.blockListener);

    // Playground data
    var blockexplorer = document.getElementById('blockexplorer');
    var updateBlockExplorer = function(blocks) {
        blockexplorer.innerHTML = JSON.stringify(blocks, null, 2);
        window.hljs.highlightBlock(blockexplorer);
    };

    var threadexplorer = document.getElementById('threadexplorer');
    var cachedThreadJSON = '';
    var updateThreadExplorer = function (threads) {
        var newJSON = JSON.stringify(threads, null, 2);
        if (newJSON != cachedThreadJSON) {
            cachedThreadJSON = newJSON;
            threadexplorer.innerHTML = cachedThreadJSON;
            window.hljs.highlightBlock(threadexplorer);
        }
    };

    var getPlaygroundData = function () {
        vm.getPlaygroundData();
        window.requestAnimationFrame(getPlaygroundData);
    };
    getPlaygroundData();

    vm.on('playgroundData', function(data) {
        updateThreadExplorer(data.threads);
        updateBlockExplorer(data.blocks);
    });

    // Feedback for stacks and blocks running.
    vm.on('STACK_GLOW_ON', function(data) {
        workspace.glowStack(data.id, true);
    });
    vm.on('STACK_GLOW_OFF', function(data) {
        workspace.glowStack(data.id, false);
    });
    vm.on('BLOCK_GLOW_ON', function(data) {
        workspace.glowBlock(data.id, true);
    });
    vm.on('BLOCK_GLOW_OFF', function(data) {
        workspace.glowBlock(data.id, false);
    });

    // Run threads
    vm.start();

    // Inform VM of animation frames.
    var animate = function() {
        window.vm.animationFrame();
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Handlers for green flag and stop all.
    document.getElementById('greenflag').addEventListener('click', function() {
        vm.greenFlag();
    });
    document.getElementById('stopall').addEventListener('click', function() {
        vm.stopAll();
    });

    var tabBlockExplorer = document.getElementById('tab-blockexplorer');
    var tabThreadExplorer = document.getElementById('tab-threadexplorer');
    var tabRenderExplorer = document.getElementById('tab-renderexplorer');

    // Handlers to show different explorers.
    document.getElementById('threadexplorer-link').addEventListener('click',
        function () {
            tabBlockExplorer.style.display = 'none';
            tabRenderExplorer.style.display = 'none';
            tabThreadExplorer.style.display = 'block';
        });
    document.getElementById('blockexplorer-link').addEventListener('click',
        function () {
            tabBlockExplorer.style.display = 'block';
            tabRenderExplorer.style.display = 'none';
            tabThreadExplorer.style.display = 'none';
        });
    document.getElementById('renderexplorer-link').addEventListener('click',
        function () {
            tabBlockExplorer.style.display = 'none';
            tabRenderExplorer.style.display = 'block';
            tabThreadExplorer.style.display = 'none';
        });
};
