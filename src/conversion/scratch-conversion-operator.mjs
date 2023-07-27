import { processInputs } from "./scratch-conversion-helper.mjs"
import ScratchBlock from "./scratch-block.mjs";

export default class ScratchConversionOperator {
   /**
    * 
    * @param {Object.<string, ScratchBlock>} blocks 
    * @param {string} blockId 
    * @param {Object.<string, {opcode: string, parameters: string[], exampleParameters: {}}} patchApi 
    * @param {string[]} patchApiKeys 
    * @param {*} partialConverter 
    * @param {*} partialConverterThis 
    * @returns {string}
    */
   convertOperatorBlock(blocks, currentBlockId, patchApi, patchApiKeys, partialConverter, partialConverterThis) {
      const convertBlocksPart = partialConverter.bind(partialConverterThis);

      const currentBlock = blocks[currentBlockId];
      const { opcode } = currentBlock;

      let script = "";

      switch (opcode) {
         case "operator_add": {
            const { NUM1, NUM2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);

            script += `${NUM1} + ${NUM2}`;
            break;
         }
         case "operator_subtract": {
            const { NUM1, NUM2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);

            script += `${NUM1} - ${NUM2}`;
            break;
         }
         case "operator_multiply": {
            const { NUM1, NUM2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);

            script += `${NUM1} * ${NUM2}`;
            break;
         }
         case "operator_divide": {
            const { NUM1, NUM2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);

            script += `${NUM1} / ${NUM2}`;
            break;
         }
         case "operator_lt": {
            const { OPERAND1, OPERAND2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `${OPERAND1} < ${OPERAND2}`;
            break;
         }
         case "operator_equals": {
            const { OPERAND1, OPERAND2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `${OPERAND1} == ${OPERAND2}`;
            break;
         }
         case "operator_gt": {
            const { OPERAND1, OPERAND2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `${OPERAND1} > ${OPERAND2}`;
            break;
         }
         case "operator_and": {
            const { OPERAND1, OPERAND2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `${OPERAND1} and ${OPERAND2}`;
            break;
         }
         case "operator_or": {
            const { OPERAND1, OPERAND2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `${OPERAND1} or ${OPERAND2}`;
            break;
         }
         case "operator_not": {
            const { OPERAND } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `not ${OPERAND}`;
            break;
         }
         case "operator_random": {
            const { FROM, TO } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);
         
            // TODO: get randoms working in Python
            // script += `randint(${FROM}, ${TO})`;
            script += "\"# Randoms not implemented yet\""
            break;
         }
         case "operator_join": {
            const { STRING1, STRING2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, false);

            // TODO: is there a more pythonic way to implement this?
            script += `${STRING1} + ${STRING2}`;
            break;
         }
         case "operator_letter_of": {
            const { STRING } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, false);
            const { LETTER } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            script += `${STRING}[${LETTER - 1}]`
            break;
         }
         case "operator_length": {
            const { STRING } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, false);

            script += `len(${STRING})`;
            break;
         }
         case "operator_contains": {
            const { STRING1, STRING2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, false);

            script += `${STRING2} in ${STRING1}`;
            break;
         }
         case "operator_mod": {
            const { NUM1, NUM2 } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);

            script += `${NUM1} % ${NUM2}`;
            break;
         }
         case "operator_round": {
            const { NUM } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);
            
            script += `round(${NUM})`
            break;
         }
         default: {
            break;
         }
      }

      return script;
   }
}