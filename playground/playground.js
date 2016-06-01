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

    // Run threads
    vm.runtime.start();
};
