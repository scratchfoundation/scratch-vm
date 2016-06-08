window.onload = function() {
    // Lots of global variables to make debugging easier
    var vm = new window.VirtualMachine();
    window.vm = vm;

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
    workspace.addChangeListener(vm.blockListener);
    var flyoutWorkspace = workspace.toolbox_.flyout_.workspace_;
    flyoutWorkspace.addChangeListener(vm.flyoutBlockListener);

    var blockexplorer = document.getElementById('blockexplorer');
    workspace.addChangeListener(function() {
        // On a change, update the block explorer.
        blockexplorer.innerHTML = JSON.stringify(vm.runtime.blocks, null, 2);
        window.hljs.highlightBlock(blockexplorer);
    });

    var threadexplorer = document.getElementById('threadexplorer');
    var cachedThreadJSON = '';
    var updateThreadExplorer = function () {
        var newJSON = JSON.stringify(vm.runtime.threads, null, 2);
        if (newJSON != cachedThreadJSON) {
            cachedThreadJSON = newJSON;
            threadexplorer.innerHTML = cachedThreadJSON;
            window.hljs.highlightBlock(threadexplorer);
        }
        window.requestAnimationFrame(updateThreadExplorer);
    };
    updateThreadExplorer();

    // Feedback for stacks and blocks running.
    vm.runtime.on('STACK_GLOW_ON', function(blockId) {
        workspace.glowStack(blockId, true);
    });
    vm.runtime.on('STACK_GLOW_OFF', function(blockId) {
        workspace.glowStack(blockId, false);
    });
    vm.runtime.on('BLOCK_GLOW_ON', function(blockId) {
        workspace.glowBlock(blockId, true);
    });
    vm.runtime.on('BLOCK_GLOW_OFF', function(blockId) {
        workspace.glowBlock(blockId, false);
    });


    // Run threads
    vm.runtime.start();

    // Handlers for green flag and stop all.
    document.getElementById('greenflag').addEventListener('click', function() {
        vm.runtime.greenFlag();
    });
    document.getElementById('stopall').addEventListener('click', function() {
        vm.runtime.stopAll();
    });

    var tabBlockExplorer = document.getElementById('tab-blockexplorer');
    var tabThreadExplorer = document.getElementById('tab-threadexplorer');

    // Handlers to show different explorers.
    document.getElementById('threadexplorer-link').addEventListener('click',
        function () {
            tabBlockExplorer.style.display = 'none';
            tabThreadExplorer.style.display = 'block';
        });
    document.getElementById('blockexplorer-link').addEventListener('click',
        function () {
            tabBlockExplorer.style.display = 'block';
            tabThreadExplorer.style.display = 'none';
        });
};
