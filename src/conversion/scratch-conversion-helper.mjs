// 0: number, 1: string, 2: nested, -1: error
export function getArgType(inputJson) {
   const argType = inputJson[1][0];
   // See here for meanings of the numbers: https://en.scratch-wiki.info/wiki/Scratch_File_Format#Blocks

   if (inputJson[0] === 1) {
      // TODO: check proper validation for argType === 8 (angle)
      if (argType === 4 || argType === 5 || argType === 6 || argType === 7 || argType === 8) {
         return 0;
      }
      // Type 11 has 2 strings after the 11; the first one is a name and the second one is an ID.
      // We will just treat it as a regular string; the user-inputted name will end up being used
      // and not the randomly generated id
      if (argType === 9 || argType === 10 || argType === 11 || argType === 12 || argType === 13) {
         return 1;
      }
      return 2;
   }
   if (inputJson[0] === 2 || inputJson[0] === 3) {
      // Blocks
      return 2;
   }

   console.warn("Couldn't determine argument type.");
   return -1;
}

export function indentLines(lines) {
   let newLines = "";

   const lineList = lines.split("\n");
   // Make sure the lines have proper indentation
   lineList.forEach(line => {
      newLines += `\n  ${line}`;
   });

   return newLines;
}

/**
 * 
 * @param {String} code 
 * @returns {Boolean}
 */
function needsParentheses(code) {
   // First, check if code is just a string
   if (code[0] === "\"" && code[code.length - 1] === "\"") {
      // double quotes string
      // yes, the for loop should start at 1 not 0 and it should go until 1 before the end
      for (let i = 1; i < code.length - 1; i++) {
         if (code[i] === "\"" && code[i - 1] !== "\\") {
            // this isn't just one continuous string
            return true;
         }
      }

      return false;
   }
   if ((code[0] === "'" && code[code.length - 1] === "'")) {
      // single quotes string
      // yes, the for loop should start at 1 not 0 and it should go until 1 before the end
      for (let i = 1; i < code.length - 1; i++) {
         if (code[i] === "'" && code[i - 1] !== "\\") {
            // this isn't just one continuous string
            return true;
         }
      }

      return false;
   }

   /* const forbiddenChars = ["<", ">", "=", "{", "}", ":", "+", "-", "*", "/", "^", "%", "!", "and", "or", "not", "[", "]", "|"]
   if (code.includes("<") || code.includes(">") || code.includes("="))
   return false; */

   return true;
}

export function processInputs(blocks, currentBlockId, currentBlock, patchApi, patchApiKeys, convertBlocksPart, autoParentheses = false, tryMakeNum = false) {
   const returnVal = {};
   
   const inputsKeys = Object.keys(currentBlock.inputs);
   for (let i = 0; i < inputsKeys.length; i++) {
      const inputsKey = inputsKeys[i];
      
      let arg = "";

      const argType = getArgType(currentBlock.inputs[inputsKey]);
      if (argType === 0) {
         arg = `${currentBlock.inputs[inputsKey][1][1]}`;
      } else if (argType === 1) {
         arg = `"${currentBlock.inputs[inputsKey][1][1]}"`;
      } else if (argType === 2) {
         arg = convertBlocksPart(blocks, currentBlockId, currentBlock.inputs[inputsKey][1], patchApi, patchApiKeys).script;
         arg = arg.substring(0, arg.length - 1);
         if (autoParentheses && needsParentheses(arg)) {
            arg = `(${arg})`;
         }
      }

      // eslint-disable-next-line no-restricted-globals
      if (tryMakeNum && argType === 1 && arg.length >= 3 && !isNaN(arg.substring(1, arg.length - 1))) {
         arg = arg.substring(1, arg.length - 1);
      }

      returnVal[inputsKey] = arg;
   }

   const fieldsKeys = Object.keys(currentBlock.fields);
   for (let i = 0; i < fieldsKeys.length; i++) {
      const fieldsKey = fieldsKeys[i];

      if (returnVal[fieldsKey]) {
         console.warn("The parameter %s was found in both the fields and the inputs. Using the one in the fields.", fieldsKey);
      }
      returnVal[fieldsKey] = `"${currentBlock.fields[fieldsKey][0]}"`;
   }

   return returnVal;
}
