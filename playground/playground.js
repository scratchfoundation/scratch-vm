window.onload = function() {
    // Lots of global variables to make debugging easier
    var vm = new window.VirtualMachine();
    window.vm = vm;

    var toolbox = document.getElementById('toolbox');
    var workspace = window.Blockly.inject('blocks', {
        toolbox: toolbox,
        media: '../node_modules/scratch-blocks/media/',
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

    // @todo: Also bind to flyout events.
    // Block events.
    workspace.addChangeListener(vm.blockListener);

    var explorer = document.getElementById('blockexplorer');
    workspace.addChangeListener(function() {
        // On a change, update the block explorer.
        explorer.innerHTML = JSON.stringify(vm.runtime.blocks, null, 2);
        window.hljs.highlightBlock(explorer);
    });

    // Feedback for stacks running.
    vm.runtime.on('STACK_GLOW_ON', function(blockId) {
        workspace.glowStack(blockId, true);
    });
    vm.runtime.on('STACK_GLOW_OFF', function(blockId) {
        workspace.glowStack(blockId, false);
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
};
