import JSZip from "jszip";

import ConversionLayer from "./conversion-layer.mjs";
import Scratch3EventBlocks from "../blocks/scratch3_event.mjs";

import PatchTargetThread from "./patch-target-thread.mjs";
import ScratchBlock from "./scratch-block.mjs";

import ScratchConversionControl from "./scratch-conversion-control.mjs";
import ScratchConversionOperator from "./scratch-conversion-operator.mjs";

import { getArgType, processInputs } from "./scratch-conversion-helper.mjs";
import Scratch3ControlBlocks from "../blocks/scratch3_control.mjs";

export default class ScratchConverter {
   data = null;

   scratchJson = null;

   scratchControlConverter = new ScratchConversionControl();

   scratchOperatorConverter = new ScratchConversionOperator();

   /**
    *
    * @param {ArrayBuffer} scratchData An ArrayBuffer representation of the .sb3 file to convert
    */
   constructor(scratchData) {
      this.data = scratchData;
   }

   /**
    * Returns a .ptch1 patch project represented as an array buffer
    *
    * @returns {ArrayBuffer} The Patch project (.ptch1) represented as an array buffer
    */
   async getPatchArrayBuffer() {
      const projectJson = await this.getPatchProjectJsonBlob().then((blob) => blob);
      if (!projectJson) {
         return null;
      }

      // TODO: implement asset handling

      const zip = new JSZip();

      zip.file("project.json", projectJson);
      const zippedProject = await zip.generateAsync({ type: "arraybuffer" }).then((content) => content);
      return zippedProject;
   }

   async getPatchProjectJsonBlob() {
      const zip = await JSZip.loadAsync(this.data).then((newZip) => newZip);
      if (!zip.files["project.json"]) {
         console.error("Couldn't find the project.json file in the scratch project. Abort.");
         return null;
      }

      const jsonDataString = await zip.files["project.json"].async("text").then((text) => text);
      const vmState = JSON.parse(jsonDataString);

      // This function will convert each target's blocks and local variables into Patch code.
      // Then, it will remove the blocks from the JSON (not strictly necessary) and handle backgrounds and other
      // things that Patch and Scratch store differently. Also, everything will be moved to being a child of a json
      // object called "vmstate" that exists for some reason.
      // TODO: add more validation of scratch project

      // Step 1: blocks + variables to code; then add code
      for (let i = 0; i < vmState.targets.length; i++) {
         vmState.targets[i].threads = this.convertTargetBlocks(vmState.targets[i].blocks, vmState.targets[i].variables);
      }

      // Step 2: remove blocks (this isn't strictly necessary) and variables + broadcasts (this is necessary)
      // Get rid of the variables removing part once sprite-wide variables are a thing. Keep the broadcasts
      // remover however.
      for (let i = 0; i < vmState.targets.length; i++) {
         vmState.targets[i].blocks = {};
         vmState.targets[i].variables = {};
         vmState.targets[i].broadcasts = {};
      }

      // Step 3: some odd jobs
      // TODO: implement these

      // Remove monitors as Patch doesn't support them
      vmState.monitors = [];

      // Step 4: make everything a child of "vmstate" and add global variables
      // TODO: global variables
      const baseJson = { vmstate: vmState, globalVariables: [] };

      console.warn(baseJson);

      // Step 4: convert this back to a blob, make everything a child of "vmstate", and return it.
      const newJsonBlob = new Blob([JSON.stringify(baseJson)], { type: "application/json" });
      return newJsonBlob;
   }

   convertBlocksPart(blocks, hatId, nextId, patchApi, patchApiKeys) {
      const thread = new PatchTargetThread();

      thread.triggerEventId = blocks[hatId].opcode;
      // TODO: triggerEventOption
      const hatFieldsKeys = Object.keys(blocks[hatId].fields);
      if (hatFieldsKeys && hatFieldsKeys.length > 0) {
         console.warn("test2");

         if (blocks[hatId].opcode === "event_whenkeypressed") {
            thread.triggerEventOption = blocks[hatId].fields[hatFieldsKeys[0]][0].toUpperCase();
         } else {
            // eslint-disable-next-line prefer-destructuring
            thread.triggerEventOption = blocks[hatId].fields[hatFieldsKeys[0]][0];
         }
      }

      // Convert code
      let currentBlockId = nextId;
      while (currentBlockId) {
         const currentBlock = blocks[currentBlockId];
         // Store a copy of the opcode so we don't have to keep doing currentBlock.opcode
         const { opcode } = currentBlock;

         // TODO: figure out nested blocks

         // Convert the block
         // Duplicates shouldn't exist in the translation API, but if they do the first entry will be used
         let patchKey = null;
         for (let i = 0; i < patchApiKeys.length; i++) {
            const key = patchApiKeys[i];

            if (patchApi[key].opcode === opcode) {
               patchKey = key;
               break;
            }
         }

         if (!patchKey) {
            if (opcode.substring(0, 8) === "control_") {
               const conversionResult = this.scratchControlConverter.convertControlBlock(blocks, currentBlockId, patchApi, patchApiKeys, this.convertBlocksPart, this);
               thread.script += `${conversionResult}\n`;
            } else if (opcode.substring(0, 9) === "operator_") {
               const conversionResult = this.scratchOperatorConverter.convertOperatorBlock(blocks, currentBlockId, patchApi, patchApiKeys, this.convertBlocksPart, this);
               thread.script += `${conversionResult}\n`;
            } else {
               // Couldn't find the opcode in the map.
               console.error("Error translating from scratch to patch. Unable to find the key for the opcode %s.", opcode);
            }
         } else {
            // const inputsKeys = Object.keys(currentBlock.inputs);
            const detectedArgs = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, this.convertBlocksPart.bind(this), true, false);

            /* for (let i = 0; i < inputsKeys.length; i++) {
               const inputsKey = inputsKeys[i];

               // Add options to change this based on language later.
               if (patchArgs !== "") {
                  patchArgs += ", ";
               }

               // TODO: validate this more
               let newArg = "";

               const argType = getArgType(currentBlock.inputs[inputsKey])

               switch (argType) {
                  case 0: {
                     newArg = `${currentBlock.inputs[inputsKey][1][1]}`;
                     break;
                  }
                  case 1: {
                     newArg = `"${currentBlock.inputs[inputsKey][1][1]}"`;
                     break;
                  }
                  case 2: {
                     // Nested block
                     const subThread = this.convertBlocksPart(blocks, currentBlockId, currentBlock.inputs[inputsKey][1], patchApi, patchApiKeys);
                     // remove the newline
                     newArg = subThread.script.substring(0, subThread.script.length - 1);
                     break;
                  }
                  default: {
                     console.error("Unknown argType.");
                     break;
                  }
               }

               patchArgs += newArg;
            } */

            let patchCode = "";

            const conversionLayerResult = patchApi[patchKey];
            if (conversionLayerResult.hasOwnProperty("returnInstead")) {
               let patchArgs = "";
               for (let i = 0; i < conversionLayerResult.returnInstead.length; i++) {
                  const val = conversionLayerResult.returnInstead[i];

                  // Add options to change this based on language later.
                  if (patchArgs !== "") {
                     patchArgs += ", ";
                  }

                  patchArgs += val;
               }

               patchCode = `${patchArgs}\n`;
            } else if (conversionLayerResult.hasOwnProperty("returnParametersInstead")) {
               let patchArgs = "";
               for (let i = 0; i < conversionLayerResult.returnParametersInstead.length; i++) {
                  const parameter = conversionLayerResult.returnParametersInstead[i].toUpperCase();

                  // Add options to change this based on language later.
                  if (patchArgs !== "") {
                     patchArgs += ", ";
                  }

                  if (detectedArgs[parameter]) {
                     patchArgs += detectedArgs[parameter];
                  } else {
                     console.warn("Couldn't find parameter with opcode %s.", parameter);
                     patchArgs += "\"# Error: couldn't find the parameter to go here.\"";
                  }
               }

               patchCode = `${patchArgs}\n`;
            } else {
               let patchArgs = "";
               for (let i = 0; i < conversionLayerResult.parameters.length; i++) {
                  const parameter = conversionLayerResult.parameters[i].toUpperCase();

                  // Add options to change this based on language later.
                  if (patchArgs !== "") {
                     patchArgs += ", ";
                  }

                  if (detectedArgs[parameter]) {
                     patchArgs += detectedArgs[parameter];
                  } else {
                     console.warn("Couldn't find parameter with opcode %s.", parameter);
                     patchArgs += "\"# Error: couldn't find the parameter to go here.\"";
                  }
               }

               // Handle a special case: Patch implements the Ask block differently
               // TODO: should this be a global variable?
               if (currentBlock.opcode === "sensing_askandwait") {
                  patchKey = `_patchAnswer = ${patchKey}`;
               }

               // Join all the bits and pieces together. Add options to change this based on language later.
               patchCode = `${patchKey}(${patchArgs})\n`
            }

            thread.script += patchCode;
         }

         // Next block
         currentBlockId = currentBlock.next;
      }

      return thread;
   }

   /**
    * Converts an object representation of a Scratch target's blocks into an object
    * representation of the corresponding Patch threads and thread code.
    *
    * @param {Object.<string, ScratchBlock>} blocks
    * @param {Object.<string, [Number, String]>} variables
    * @returns {PatchTargetThread[]} An array of object representations of the patch threads
    */
   convertTargetBlocks(blocks, variables) {
      // TODO: convert variables
      // https://en.scratch-wiki.info/wiki/Scratch_File_Format#Blocks

      const blocksKeys = Object.keys(blocks);

      const returnVal = [];

      const eventBlocks = new Scratch3EventBlocks({ on: () => { }, startHats: () => { } });
      const controlBlocks = new Scratch3ControlBlocks({ on: () => { }, startHats: () => { } });

      const hats = Object.keys({...eventBlocks.getHats(), ...controlBlocks.getHats()});

      const hatLocations = [];

      blocksKeys.forEach(blockId => {
         const block = blocks[blockId];
         if (hats.includes(block.opcode)) {
            hatLocations.push(blockId);
         }
      });

      const { patchApi } = ConversionLayer;
      const patchApiKeys = Object.keys(patchApi);

      hatLocations.forEach(hatId => { returnVal.push(this.convertBlocksPart(blocks, hatId, blocks[hatId].next, patchApi, patchApiKeys)) });

      return returnVal;
   }
}
