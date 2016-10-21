/**
 * @fileoverview
 * An exporter for Scratch 3.0 format.
 * Scratch 3.0 format:
 * Look at ./sb3format.json
 */

/**
 * @TODO: [X] Done [ ] Undone [~] In work
 * [X] Name of project
 * [X] Sprites
 * [ ] Costumes
 * [X] Effects
 * [X] Clones
 * [ ] Blocks
 */


/**
 * Exporter for SB3 format.
 * @param {!Runtime} runtime A Runtime for export project from
 * @return {Object} An Object representing project. It can be exported as ZIP later
 */
function sb3export (runtime) {
    var pack = Object.create(null);
    // @TODO: costumes
    pack['package.json'] = projectjson (runtime);
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
        var sprite = target.sprite;
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
            oClone.blocks = {};
        });
        ++i;
    }
    return JSON.stringify(json, null, 4);
};

// sb3export.exportZIP = exportZIP
module.exports = sb3export;
