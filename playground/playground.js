var NEW_PROJECT_HASH = 'createEmptyProject';

var loadProject = function () {
    var id = location.hash.substring(1);
    if (id === NEW_PROJECT_HASH) {
        window.vm.createEmptyProject();
        return;
    }
    if (id.length < 1 || !isFinite(id)) {
        id = '119615668';
    }
    var url = 'https://projects.scratch.mit.edu/internalapi/project/' +
        id + '/get/';
    var r = new XMLHttpRequest();
    r.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (r.status === 200) {
                window.vm.loadProject(this.responseText);
            } else {
                window.vm.createEmptyProject();
            }
        }
    };
    r.open('GET', url);
    r.send();
};

window.onload = function() {
    // Lots of global variables to make debugging easier
    // Instantiate the VM.
    var vm = new window.VirtualMachine();
    window.vm = vm;

    // Loading projects from the server.
    document.getElementById('projectLoadButton').onclick = function () {
        document.location = '#' + document.getElementById('projectId').value;
        location.reload();
    };
    document.getElementById('createEmptyProject').addEventListener('click',
    function() {
        document.location = '#' + NEW_PROJECT_HASH;
        location.reload();
    });
    loadProject();

    // Instantiate the renderer and connect it to the VM.
    var canvas = document.getElementById('scratch-stage');
    var renderer = new window.RenderWebGL(canvas);
    window.renderer = renderer;
    vm.attachRenderer(renderer);

    // Instantiate scratch-blocks and attach it to the DOM.
    var workspace = window.Blockly.inject('blocks', {
        media: './media/',
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

    // Attach scratch-blocks events to VM.
    workspace.addChangeListener(vm.blockListener);
    var flyoutWorkspace = workspace.getFlyout().getWorkspace();
    flyoutWorkspace.addChangeListener(vm.flyoutBlockListener);

    // Create FPS counter.
    var stats = new window.Stats();
    document.getElementById('tab-renderexplorer').appendChild(stats.dom);
    stats.dom.style.position = 'relative';
    stats.begin();

    // Playground data tabs.
    // Block representation tab.
    var blockexplorer = document.getElementById('blockexplorer');
    var updateBlockExplorer = function(blocks) {
        blockexplorer.innerHTML = JSON.stringify(blocks, null, 2);
        window.hljs.highlightBlock(blockexplorer);
    };

    // Thread representation tab.
    var threadexplorer = document.getElementById('threadexplorer');
    var cachedThreadJSON = '';
    var updateThreadExplorer = function (newJSON) {
        if (newJSON != cachedThreadJSON) {
            cachedThreadJSON = newJSON;
            threadexplorer.innerHTML = cachedThreadJSON;
            window.hljs.highlightBlock(threadexplorer);
        }
    };

    // Only request data from the VM thread if the appropriate tab is open.
    window.exploreTabOpen = false;
    var getPlaygroundData = function () {
        vm.getPlaygroundData();
        if (window.exploreTabOpen) {
            window.requestAnimationFrame(getPlaygroundData);
        }
    };

    // VM handlers.
    // Receipt of new playground data (thread, block representations).
    vm.on('playgroundData', function(data) {
        updateThreadExplorer(data.threads);
        updateBlockExplorer(data.blocks);
    });

    // Receipt of new block XML for the selected target.
    vm.on('workspaceUpdate', function (data) {
        workspace.clear();
        var dom = window.Blockly.Xml.textToDom(data.xml);
        window.Blockly.Xml.domToWorkspace(dom, workspace);
    });

    // Receipt of new list of targets, selected target update.
    var selectedTarget = document.getElementById('selectedTarget');
    vm.on('targetsUpdate', function (data) {
        // Clear select box.
        while (selectedTarget.firstChild) {
            selectedTarget.removeChild(selectedTarget.firstChild);
        }
        // Generate new select box.
        for (var i = 0; i < data.targetList.length; i++) {
            var targetOption = document.createElement('option');
            targetOption.setAttribute('value', data.targetList[i][0]);
            // If target id matches editingTarget id, select it.
            if (data.targetList[i][0] == data.editingTarget) {
                targetOption.setAttribute('selected', 'selected');
            }
            targetOption.appendChild(
                document.createTextNode(data.targetList[i][1])
            );
            selectedTarget.appendChild(targetOption);
        }
    });
    selectedTarget.onchange = function () {
        vm.setEditingTarget(this.value);
    };

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
    vm.on('VISUAL_REPORT', function(data) {
        workspace.reportValue(data.id, data.value);
    });

    vm.on('SPRITE_INFO_REPORT', function(data) {
        document.getElementById('sinfo-x').value = data.x;
        document.getElementById('sinfo-y').value = data.y;
        document.getElementById('sinfo-direction').value = data.direction;
        document.getElementById('sinfo-rotationstyle').value = data.rotationStyle;
        document.getElementById('sinfo-visible').value = data.visible;
    });

    document.getElementById('sinfo-post').addEventListener('click', function () {
        var data = {};
        data.x = document.getElementById('sinfo-x').value;
        data.y = document.getElementById('sinfo-y').value;
        data.direction = document.getElementById('sinfo-direction').value;
        data.rotationStyle = document.getElementById('sinfo-rotationstyle').value;
        data.visible = document.getElementById('sinfo-visible').value === 'true';
        vm.postSpriteInfo(data);
    });

    // Feed mouse events as VM I/O events.
    document.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        var coordinates = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };
        window.vm.postIOData('mouse', coordinates);
    });
    canvas.addEventListener('mousedown', function (e) {
        var rect = canvas.getBoundingClientRect();
        var data = {
            isDown: true,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };
        window.vm.postIOData('mouse', data);
        e.preventDefault();
    });
    canvas.addEventListener('mouseup', function (e) {
        var rect = canvas.getBoundingClientRect();
        var data = {
            isDown: false,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };
        window.vm.postIOData('mouse', data);
        e.preventDefault();
    });

    // Feed keyboard events as VM I/O events.
    document.addEventListener('keydown', function (e) {
        // Don't capture keys intended for Blockly inputs.
        if (e.target != document && e.target != document.body) {
            return;
        }
        window.vm.postIOData('keyboard', {
            keyCode: e.keyCode,
            isDown: true
        });
        e.preventDefault();
    });
    document.addEventListener('keyup', function(e) {
        // Always capture up events,
        // even those that have switched to other targets.
        window.vm.postIOData('keyboard', {
            keyCode: e.keyCode,
            isDown: false
        });
        // E.g., prevent scroll.
        if (e.target != document && e.target != document.body) {
            e.preventDefault();
        }
    });

    // Run threads
    vm.start();

    // Inform VM of animation frames.
    var animate = function() {
        stats.update();
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
    document.getElementById('turbomode').addEventListener('change', function() {
        var turboOn = document.getElementById('turbomode').checked;
        vm.setTurboMode(turboOn);
    });
    document.getElementById('compatmode').addEventListener('change',
    function() {
        var compatibilityMode = document.getElementById('compatmode').checked;
        vm.setCompatibilityMode(compatibilityMode);
    });
    var tabBlockExplorer = document.getElementById('tab-blockexplorer');
    var tabThreadExplorer = document.getElementById('tab-threadexplorer');
    var tabRenderExplorer = document.getElementById('tab-renderexplorer');
    var tabImportExport = document.getElementById('tab-importexport');

    // Handlers to show different explorers.
    document.getElementById('threadexplorer-link').addEventListener('click',
        function () {
            window.exploreTabOpen = true;
            getPlaygroundData();
            tabBlockExplorer.style.display = 'none';
            tabRenderExplorer.style.display = 'none';
            tabThreadExplorer.style.display = 'block';
            tabImportExport.style.display = 'none';
        });
    document.getElementById('blockexplorer-link').addEventListener('click',
        function () {
            window.exploreTabOpen = true;
            getPlaygroundData();
            tabBlockExplorer.style.display = 'block';
            tabRenderExplorer.style.display = 'none';
            tabThreadExplorer.style.display = 'none';
            tabImportExport.style.display = 'none';
        });
    document.getElementById('renderexplorer-link').addEventListener('click',
        function () {
            window.exploreTabOpen = false;
            tabBlockExplorer.style.display = 'none';
            tabRenderExplorer.style.display = 'block';
            tabThreadExplorer.style.display = 'none';
            tabImportExport.style.display = 'none';
        });
    document.getElementById('importexport-link').addEventListener('click',
        function () {
            window.exploreTabOpen = false;
            tabBlockExplorer.style.display = 'none';
            tabRenderExplorer.style.display = 'none';
            tabThreadExplorer.style.display = 'none';
            tabImportExport.style.display = 'block';
        });
};
