window.onload = function() {
    // Lots of global variables to make debugging easier
    var vm = new window.VirtualMachine();
    window.vm = vm;

    var toolbox = document.getElementById('toolbox');
    var workspace = window.Blockly.inject('blocks', {
        toolbox: toolbox,
        media: '../node_modules/scratch-blocks/media/'
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
};
