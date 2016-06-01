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

    // @todo: Also bind to flyout events, block running feedback.
    // Block events.
    workspace.addChangeListener(vm.blockListener);

    var explorer = document.getElementById('blockexplorer');
    workspace.addChangeListener(function() {
        // On a change, update the block explorer.
        explorer.innerHTML = JSON.stringify(vm.runtime.blocks, null, 2);
        window.hljs.highlightBlock(explorer);
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
