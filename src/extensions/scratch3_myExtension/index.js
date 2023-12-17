const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const TargetType = require('../../extension-support/target-type');

class Scratch3myExtension {

    constructor (runtime) {
        // put any setup for your extension here
        this.runtime = runtime;
    }

    /**
     * Returns the metadata about your extension.
     */
    getInfo () {
        return {
            // unique ID for your extension
            id: 'myScratchExtension',

            // name that will be displayed in the Scratch UI
            name: 'wifi car',

            // colours to use for your extension blocks
            color1: '#2088e8',
            color2: '#660066',

            // icons to display
            // blockIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',
            // menuIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

            // your Scratch blocks
            blocks: [
                {
                
                    opcode: 'cameraUp',

                   
                    blockType: BlockType.COMMAND,

                    // label to display on the block
                    text: 'Camera up',

                   
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    
                },
                {
                
                    opcode: 'cameraDown',

                   
                    blockType: BlockType.COMMAND,

                    // label to display on the block
                    text: 'Camera down',

                   
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    
                },

                {
                
                    opcode: 'moveForward',

                   
                    blockType: BlockType.COMMAND,

                    // label to display on the block
                    text: 'move Forward',

                   
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    
                },
                {
                
                    opcode: 'moveBackward',

                   
                    blockType: BlockType.COMMAND,

                    // label to display on the block
                    text: 'move Backward',

                   
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    
                },
                {
                
                    opcode: 'rotateLeft',

                   
                    blockType: BlockType.COMMAND,

                    // label to display on the block
                    text: 'rotate Left',

                   
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    
                },
                {
                
                    opcode: 'rotateRight',

                   
                    blockType: BlockType.COMMAND,

                    // label to display on the block
                    text: 'rotate Right',

                   
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    
                }


            ]
        };
    }


    /**
     * implementation of the block with the opcode that matches this name
     *  this will be called when the block is used
     */
    cameraUp () {
        
        console.log('working');
        fetch("http://192.168.4.1/state?cmd=H")
  .then((response) => response.json())
  .then((json) => console.log(json));

  
    }

    cameraDown () {
      
        fetch("http://192.168.4.1/state?cmd=G")
  .then((response) => response.json())
  .then((json) => console.log(json));

  
    }

   moveForward () {
      
        fetch("http://192.168.4.1/state?cmd=F")
  .then((response) => response.json())
  .then((json) => console.log(json));

  
    }

   moveBackward () {
      
        fetch("http://192.168.4.1/state?cmd=B")
  .then((response) => response.json())
  .then((json) => console.log(json));

  
    }

    rotateLeft () {
      
        fetch("http://192.168.4.1/state?cmd=L")
  .then((response) => response.json())
  .then((json) => console.log(json));

  
    }

    rotateRight () {
      
        fetch("http://192.168.4.1/state?cmd=R")
  .then((response) => response.json())
  .then((json) => console.log(json));

  
    }

}

module.exports = Scratch3myExtension;