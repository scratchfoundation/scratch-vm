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
         
            script += `patch_random(${FROM}, ${TO})`;
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

            script += `${STRING}[${LETTER - 1}]`;
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
            
            script += `round(${NUM})`;
            break;
         }
         case "operator_mathop": {
            const { OPERATOR } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true);
            const { NUM } = processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, true, true);

            // Remove the quotation marks that processInputs adds
            const formattedOperator = OPERATOR.substring(1, OPERATOR.length - 1);

            const mathOpsDict = {
               "abs": `abs(${ NUM })`,
               "ceiling": `math.ceil(${  NUM  })`,
               "sqrt": `math.sqrt(${  NUM  })`,
               "floor": `math.floor(${  NUM  })`,
               /* Trig in scratch uses degrees. To keep this consistent, we must convert the inputs of
                  trig (but not inverse trig) */
               "sin": `math.sin(math.radians(${  NUM  }))`,
               "cos": `math.cos(math.radians(${  NUM  }))`,
               "tan": `math.tan(math.radians(${  NUM  }))`,
               "asin": `math.degrees(math.asin(${  NUM  }))`,
               "acos": `math.degrees(math.acos(${  NUM  }))`,
               "atan": `math.degrees(math.atan(${  NUM  }))`,
               /* in Python, math.log defaults to base e, not base 10 */
               "ln": `math.log(${  NUM  })`,
               "log": `math.log(${  NUM  }, 10)`,
               "e ^": `pow(math.e, ${ NUM })`, /* `math.exp(${ NUM })`, */
               "10 ^": `pow(10, ${ NUM })`
            };

            script += mathOpsDict[formattedOperator];
            break;
         }
         default: {
            break;
         }
      }

      return script;
   }
}