// Core, Team, and Official extensions can `require` VM code:
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const TargetType = require('../../extension-support/target-type');

// ...or VM dependencies:
const formatMessage = require('format-message');

//this is where we define the icon image like 
//const blockIconURI ='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+cGVuLWljb248L3RpdGxlPjxnIHN0cm9rZT0iIzU3NUU3NSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik04Ljc1MyAzNC42MDJsLTQuMjUgMS43OCAxLjc4My00LjIzN2MxLjIxOC0yLjg5MiAyLjkwNy01LjQyMyA1LjAzLTcuNTM4TDMxLjA2NiA0LjkzYy44NDYtLjg0MiAyLjY1LS40MSA0LjAzMi45NjcgMS4zOCAxLjM3NSAxLjgxNiAzLjE3My45NyA0LjAxNUwxNi4zMTggMjkuNTljLTIuMTIzIDIuMTE2LTQuNjY0IDMuOC03LjU2NSA1LjAxMiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0yOS40MSA2LjExcy00LjQ1LTIuMzc4LTguMjAyIDUuNzcyYy0xLjczNCAzLjc2Ni00LjM1IDEuNTQ2LTQuMzUgMS41NDYiLz48cGF0aCBkPSJNMzYuNDIgOC44MjVjMCAuNDYzLS4xNC44NzMtLjQzMiAxLjE2NGwtOS4zMzUgOS4zYy4yODItLjI5LjQxLS42NjguNDEtMS4xMiAwLS44NzQtLjUwNy0xLjk2My0xLjQwNi0yLjg2OC0xLjM2Mi0xLjM1OC0zLjE0Ny0xLjgtNC4wMDItLjk5TDMwLjk5IDUuMDFjLjg0NC0uODQgMi42NS0uNDEgNC4wMzUuOTYuODk4LjkwNCAxLjM5NiAxLjk4MiAxLjM5NiAyLjg1NU0xMC41MTUgMzMuNzc0Yy0uNTczLjMwMi0xLjE1Ny41Ny0xLjc2NC44M0w0LjUgMzYuMzgybDEuNzg2LTQuMjM1Yy4yNTgtLjYwNC41My0xLjE4Ni44MzMtMS43NTcuNjkuMTgzIDEuNDQ4LjYyNSAyLjEwOCAxLjI4Mi42Ni42NTggMS4xMDIgMS40MTIgMS4yODcgMi4xMDIiIGZpbGw9IiM0Qzk3RkYiLz48cGF0aCBkPSJNMzYuNDk4IDguNzQ4YzAgLjQ2NC0uMTQuODc0LS40MzMgMS4xNjVsLTE5Ljc0MiAxOS42OGMtMi4xMyAyLjExLTQuNjczIDMuNzkzLTcuNTcyIDUuMDFMNC41IDM2LjM4bC45NzQtMi4zMTYgMS45MjUtLjgwOGMyLjg5OC0xLjIxOCA1LjQ0LTIuOSA3LjU3LTUuMDFsMTkuNzQzLTE5LjY4Yy4yOTItLjI5Mi40MzItLjcwMi40MzItMS4xNjUgMC0uNjQ2LS4yNy0xLjQtLjc4LTIuMTIyLjI1LjE3Mi41LjM3Ny43MzcuNjE0Ljg5OC45MDUgMS4zOTYgMS45ODMgMS4zOTYgMi44NTYiIGZpbGw9IiM1NzVFNzUiIG9wYWNpdHk9Ii4xNSIvPjxwYXRoIGQ9Ik0xOC40NSAxMi44M2MwIC41LS40MDQuOTA1LS45MDQuOTA1cy0uOTA1LS40MDUtLjkwNS0uOTA0YzAtLjUuNDA3LS45MDMuOTA2LS45MDMuNSAwIC45MDQuNDA0LjkwNC45MDR6IiBmaWxsPSIjNTc1RTc1Ii8+PC9nPjwvc3ZnPg==';

const files = {};

const fileBlocks = [];

class DataTools {
    static get EXTENSION_ID() {
        return 'datatools';
    }

    /** 
     * @param {Runtime} runtime runtime instantiating this block package.
     */
    constructor(runtime){
        this._runtime = runtime;
        this._runtime.registerPeripheralExtension('datatools', this);
        //Do something here to render the file upload button
        //Maybe not, actually. It might be better to hijack that functionality with the modal.
    }

    getInfo(){
        return{
            id: 'datatools',
            name: formatMessage({
                id: 'datatools.categoryName',
                default: 'Data Tools', 
                description: 'Label for the Data Tools extension category'
            }),
           // blockIconURI: blockIconURI, 
            blocks: [
                ...fileBlocks,
                //Add other blocks below
            ],
        }
    }

    getFilename(args, util, block) {
        return block.text;
    }

    /**
     * Adds a data file to the extension's array of files using the
     * file name as a key.
     * @param {string} name The original name of the file
     * @param {Array} fileData The parsed file data stored as an array of JSON objects
     */
    addDataFile(name, fileData) {
        //Generate a displayable file name if a duplicate is found
        if(files[name]){
            name = this.generateFileDisplayName(name);
        }

        files[name] = fileData;
        fileBlocks.push(
        {
            opcode: 'file_' + name,
            func: 'getFilename',
            text: name,
            blockType: BlockType.REPORTER
        });

        //Update the workspace to add the new file
        this._runtime.requestToolboxExtensionsUpdate();
    }

    /**
     * Removes a data file with a given name
     * @param {string} name The name of the file to be removed
     * @returns {Boolean} Whether or not the file was successfully removed
     */
    removeDataFile(name) {
        if(name === null || name === "" || !files[name]) {
            return false;
        }

        delete files[name];
        fileBlocks = fileBlocks.filter(block => block.text !== name);

        this._runtime.requestToolboxExtensionsUpdate();
        return true;
    }

    /**
     * Generates a displayable file name that will handle duplicates by
     * appending "(DUPLICATE_NUM)" if necessary
     * @param {string} name The original name of the file
     * @returns {string} The file name that will be displayed
     */
    generateFileDisplayName(original) {
        let num = 1;
        while(files[original + " (" + num + ")"]) {
            num++;
        }
        return original + " (" + num + ")";
    }
}

module.exports = DataTools;