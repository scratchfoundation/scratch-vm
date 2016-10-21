/**
 * @fileoverview
 * An exporter for Scratch 3.0 format.
 * Scratch 3.0 format:
 * Look at ./sb3format.json
 */

 var JSZip = require('jszip');

/**
 * @TODO: [X] Done [ ] Undone [~] In work
 * [X] Name of project
 * [X] Sprites
 * [ ] Costumes
 * [X] Effects
 * [X] Clones
 * [X] Blocks
 */


/**
 * Exporter for SB3 format.
 * @param {!Runtime} runtime A Runtime for export project from
 * @return {Object} An Object representing project. It can be exported as ZIP later
 */
function sb3export (runtime) {
    var pack = Object.create(null);
    // @TODO: costumes
    pack['package.json'] = {contents: projectjson(runtime), options: {
        base64: true
    }};
    return pack;
};

/**
 * project.json part of ZIP package
 * @param {!Runtime} runtime A Runtime for export project from
 * @return {string} A JSON string representing package.json file
 */
function projectjson (runtime) {
    var json = Object.create(null),
        target, effect, i = 0;
    json.name = 'new Project'; // No project name changing for now
    json.sprites = [];
    for (target in runtime.targets) {
        if (!target.isOriginal) continue; // Don't save multiple copies
        var sprite = target.sprite, q,
            blocks = {}, queueInps = [], queueCons = [];
        json.sprites[i] = {};
        json.sprites[i].name = sprite.name;
        json.sprites[i].costumes = [];
        // @TODO: costumes
        json.sprites[i].original_clone = {};
        json.sprites[i].clones = [];
        sprite.clones.forEach(function(clone, idx){
            var oClone = (idx === 0) ? (json.sprites[i].original_clone)
                : (json.spites[i].clones[idx-1] = {});
            oClone.x = clone.x;
            oClone.y = clone.y;
            oClone.effects = {};
            for (effect in clone.effects) {
                oClone.effects[effect] = target.effects[effect];
            }
            oClone.current_costume = clone.currentCostume;
        });
        json.spites[i].blocks = [];
        Object.keys(sprite.blocks._blocks).forEach(function(block, idx){
            block = sprite.blocks._blocks[block];
            blocks[block.id] = idx;
            json.sprites[i].blocks[idx] = {};
            json.sprites[i].blocks[idx].ID = idx;
            json.sprites[i].blocks[idx].opcode = block.opcode;
            json.sprites[i].blocks[idx].fields = {};
            for (var field in block.fields) {
                json.sprites[i].blocks[idx].fields[field] = block.fields[field];
            }
            json.sprites[i].blocks[idx].inputs = {};
            for (var input in block.inputs) {
                queueInps.push({
                    value: block.inputs[input].block || block.inputs[input].shadow,
                    input: input,
                    block: idx
                });
            }
            json.sprites[i].blocks[idx].isField = block.field;
            if (block.next) queueCons.push({value: block.next, block: idx});
        });
        for (q in queueInps) {
            json.sprites[i].blocks[q.block].inputs[q.input] = blocks[q.value];
        }
        for (q in queueCons) {
            json.sprites[i].blocks[q.block].next = blocks[q.value];
        }
        json.sprites[i].scripts = [];
        sprite.blocks._scripts.forEach(function(ID){
            json.sprites[i].scripts[ID] = blocks[ID];
        });
        ++i;
    }
    return JSON.stringify(json, null, 4);
};

/**
 * Exports package as ZIP
 * @param {!Runtime} runtime A Runtime for export project from
 * @return {Promise} Promise containing ZIP string
 */
function exportZIP (runtime) {
    var zip = new JSZip(),
        pack = sb3export(runtime),
        entry;
    for (entry in pack) {
        zip.file(entry, pack[entry].contents, pack[entry].options);
    }
    return zip.generateAsync({type: 'binarystring'});
};

sb3export.exportZIP = exportZIP;
module.exports = sb3export;
