// Core, Team, and Official extensions can `require` VM code:
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

// ...or VM dependencies:
const formatMessage = require('format-message');

//this is where we define the icon image like 
const blockIconURI ='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgaWQ9IkxheWVyXzEiCiAgIGRhdGEtbmFtZT0iTGF5ZXIgMSIKICAgdmlld0JveD0iMCAwIDE1MCAxNTAiCiAgIHZlcnNpb249IjEuMSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iU2NyYXRjaC0wMi5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTIuNCAoZjhkY2U5MSwgMjAxOS0wOC0wMikiPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTIxIj4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT5TY3JhdGNoPC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMjUiCiAgICAgaWQ9Im5hbWVkdmlldzE5IgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpbmtzY2FwZTp6b29tPSI1LjY1Njg1NDMiCiAgICAgaW5rc2NhcGU6Y3g9IjY4LjA2MDcxOCIKICAgICBpbmtzY2FwZTpjeT0iNzUuOTA4NjkyIgogICAgIGlua3NjYXBlOndpbmRvdy14PSIwIgogICAgIGlua3NjYXBlOndpbmRvdy15PSIyNyIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkxheWVyXzEiIC8+CiAgPGRlZnMKICAgICBpZD0iZGVmczQiPgogICAgPHN0eWxlCiAgICAgICBpZD0ic3R5bGUyIj4uY2xzLTEsLmNscy0ye2ZpbGw6bm9uZTtzdHJva2U6IzAwMDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9LmNscy0xe3N0cm9rZS13aWR0aDoxLjRweDt9LmNscy0ye3N0cm9rZS13aWR0aDoxLjc4cHg7fTwvc3R5bGU+CiAgPC9kZWZzPgogIDx0aXRsZQogICAgIGlkPSJ0aXRsZTYiPlNjcmF0Y2g8L3RpdGxlPgogIDxyZWN0CiAgICAgY2xhc3M9ImNscy0xIgogICAgIHg9IjMxLjEiCiAgICAgeT0iMTMuNjkiCiAgICAgd2lkdGg9Ijg4LjQ4IgogICAgIGhlaWdodD0iMTI2LjQiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuNCAxNTIuMzcpIHJvdGF0ZSgtOTAuMTEpIgogICAgIGlkPSJyZWN0OCIKICAgICBzdHlsZT0iZmlsbDojZWJkOWI2O2ZpbGwtb3BhY2l0eToxIiAvPgogIDxwYXRoCiAgICAgY2xhc3M9ImNscy0yIgogICAgIGQ9Ik0xOC41MSwxMDkuNjhjMi44Ni01LjgsNS4yMS03LDYuODQtNywyLjE1LDAsMi42MywyLjA5LDYuNzgsNC4yNS44Ni40NCw3LjMyLDMuNzMsMTMuNTksMi44OCw0LjIzLS41Nyw0LjA1LTIuNDMsMTEuMzctNS41NSw0LjM5LTEuODgsOC4xNi0zLjQ4LDExLjM2LTIuNzUsNC4wNi45MiwyLjgzLDQuNTksNi43OCw1LjY1LDQuODgsMS4zMiw5LjM1LTMuNjEsMTUuODktMi43Miw2LjI1Ljg1LDguMzUsNi4xOCwxMS4zMSw1LjY4LDIuNzEtLjQ2LDEuNjItNSw0LjU3LTUuNiwzLjE5LS42LDYuMjgsNC40NiwxMS4zMSw0LjI4LDQuNjEtLjE3LDYuNzEtNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yNCw1LjYzIgogICAgIGlkPSJwYXRoMTAiIC8+CiAgPHBhdGgKICAgICBjbGFzcz0iY2xzLTIiCiAgICAgZD0iTTE4LjE5LDg5LjkxYzIuODYtNS44LDUuMjItNyw2Ljg0LTcsMi4xNiwwLDIuNjMsMi4wOSw2Ljc5LDQuMjUuODUuNDQsNy4zMiwzLjcyLDEzLjU5LDIuODgsNC4yMy0uNTcsNC4wNS0yLjQzLDExLjM3LTUuNTYsNC4zOS0xLjg3LDguMTUtMy40OCwxMS4zNi0yLjc1LDQsLjkzLDIuODMsNC41OSw2Ljc3LDUuNjYsNC44OSwxLjMyLDkuMzUtMy42MSwxNS44OS0yLjcyLDYuMjUuODQsOC4zNiw2LjE3LDExLjMyLDUuNjcsMi43LS40NSwxLjYyLTUsNC41Ni01LjU5LDMuMi0uNiw2LjI4LDQuNDYsMTEuMzIsNC4yOCw0LjYxLS4xNyw2LjctNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yMyw1LjYzIgogICAgIGlkPSJwYXRoMTIiIC8+CiAgPHBhdGgKICAgICBjbGFzcz0iY2xzLTIiCiAgICAgZD0iTTE5LjE5LDczLjkxYzIuODYtNS44LDUuMjItNyw2Ljg0LTcsMi4xNiwwLDIuNjMsMi4wOSw2Ljc5LDQuMjUuODUuNDQsNy4zMiwzLjcyLDEzLjU5LDIuODgsNC4yMy0uNTcsNC4wNS0yLjQzLDExLjM3LTUuNTYsNC4zOS0xLjg3LDguMTUtMy40OCwxMS4zNi0yLjc1LDQsLjkzLDIuODMsNC41OSw2Ljc3LDUuNjYsNC44OSwxLjMyLDkuMzUtMy42MSwxNS44OS0yLjcyLDYuMjUuODQsOC4zNiw2LjE3LDExLjMyLDUuNjcsMi43LS40NSwxLjYyLTUsNC41Ni01LjU5LDMuMi0uNiw2LjI4LDQuNDYsMTEuMzIsNC4yOCw0LjYxLS4xNyw2LjctNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yMyw1LjYzIgogICAgIGlkPSJwYXRoMTQiIC8+CiAgPHBhdGgKICAgICBjbGFzcz0iY2xzLTIiCiAgICAgZD0iTTIwLjE5LDU1LjkxYzIuODYtNS44LDUuMjItNyw2Ljg0LTcsMi4xNiwwLDIuNjMsMi4wOSw2Ljc5LDQuMjUuODUuNDQsNy4zMiwzLjcyLDEzLjU5LDIuODgsNC4yMy0uNTcsNC4wNS0yLjQzLDExLjM3LTUuNTYsNC4zOS0xLjg3LDguMTUtMy40OCwxMS4zNi0yLjc1LDQsLjkzLDIuODMsNC41OSw2Ljc3LDUuNjYsNC44OSwxLjMyLDkuMzUtMy42MSwxNS44OS0yLjcyLDYuMjUuODQsOC4zNiw2LjE3LDExLjMyLDUuNjcsMi43LS40NSwxLjYyLTUsNC41Ni01LjU5LDMuMi0uNiw2LjI4LDQuNDYsMTEuMzIsNC4yOCw0LjYxLS4xNyw2LjctNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yMyw1LjYzIgogICAgIGlkPSJwYXRoMTYiIC8+Cjwvc3ZnPg==';

const files = {};

var fileBlocks = [];

const NO_FILES = "NO FILES UPLOADED";

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
        return {
            id: 'datatools',
            name: formatMessage({
                id: 'datatools.categoryName',
                default: 'Data Tools', 
                description: 'Label for the Data Tools extension category'
            }),
            blockIconURI: blockIconURI, 
            showStatusButton: true,
            blocks: [
                ...fileBlocks,
                '---',
                //Add other blocks below
                {
                    opcode: 'getRowCount',
                    text: formatMessage({
                        id: 'datatools.getRowCount',
                        default: 'row count of [FILENAME]',
                        description: 'get the row count of a data set'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        FILENAME: {
                            type: ArgumentType.STRING,
                            menu: 'fileMenu',
                        }
                    }
                },
                {
                    opcode: 'getColumnAtRow',
                    text: formatMessage({
                        id: 'datatools.getColumnAtRow',
                        default: 'get [COLUMN] at row [ROW]',
                        description: 'get the value at a row and column'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLUMN: {
                            type: ArgumentType.DATA_FILE,
                            menu: 'columnMenu',
                            default: '[FILE] COLUMN'
                        },
                        ROW: {
                            type: ArgumentType.NUMBER,
                            value: 1
                        }
                    }
                },
                {
                    opcode: 'setColumnAtRow',
                    text: formatMessage({
                        id: 'datatools.setColumnAtRow',
                        default: 'set [COLUMN] at row [ROW] to [VALUE]',
                        description: 'set the value at a row and column'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: { 
                        COLUMN: {
                            type: ArgumentType.DATA_FILE,
                            menu: 'columnMenu',
                            default: '[FILE] COLUMN'
                        },
                        ROW: {
                            type: ArgumentType.NUMBER,
                            value: 1
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            value: ""
                        }
                    }
                },
                {
                    opcode: 'duplicateDataset',
                    text: formatMessage({
                        id: 'datatools.duplicateDataset',
                        default: 'duplicate [ORIGINAL] as [NEW]',
                        description: 'duplicate an existing dataset and give it a new name'
                    }),
                    blocktype: BlockType.COMMAND,
                    arguments: {
                        ORIGINAL: {
                          type: ArgumentType.STRING,
                          menu: 'fileMenu'  
                        },
                        NEW: {
                            type: ArgumentType.STRING,
                            value: ""
                        }
                    }
                },
            ],
            menus: {
                columnMenu: {
                    items: 'generateColumnData'
                },
                fileMenu: {
                    acceptReporters: true,
                    items: 'getFileNames'
                }
            }
        }
    }

    generateColumnData() {
        let fileNames = Object.keys(files);
        if(fileNames.length === 0) {
            return {
                "NO FILES UPLOADED": ["NO COLUMN DATA"]
            };
        }
        let data = {};
        
        fileNames.forEach(name =>{
            let columns = Object.keys(files[name][0]);
            data[name] = columns;
        });

        return data;
    }

    /**
     * duplicates an existing dataset either as the name given by the user or as the original name plus an incremented number
     * args - holds ORIGINAl and NEW, ORIGINAl being the original data set to be duplicated, NEW being the name of the newly duplicated dataset
     */
    duplicateDataset(args) {
        let {ORIGINAL, NEW} = args;
        if(NEW === ""){
            NEW = ORIGINAL;
        }
        this.addDataFile(NEW, files[ORIGINAL]);
    }

    //needed for status button to work
    isConnected() {
        return fileBlocks.length > 0;
    }

    scan() {
    //needed for status button to work       
    }

    connect() {
    //needed for status button to work
    }

    disconnect() {
    //needed for status button to work
    }

    /**
     * Gets a list of filenames that will be displayed in the dropdown
     * @returns {Array} The list of filenames
     */
    getFileNames() {
        let names = [];
        fileBlocks.forEach(file => {
            names.push(file.text);
        });

        if(names.length === 0) names.push(NO_FILES);
        return names;
    }

    /**
     * Gets the value at a row and column in a given file
     * @param {*} args Object containing arguments, including COLUMN, ROW, and FILENAME
     * @returns {*} The value at the specified row and column in the specified file 
     */
    getColumnAtRow(args) {
        let { COLUMN, ROW } = args;

        let colArr = COLUMN.split(']');
        let fileName = colArr[0].substring(1);
        let col = colArr.slice(1, colArr.length).join(']').substring(1);

        if(!files[fileName] || ROW < 1 || ROW > files[fileName].length || !files[fileName][ROW - 1][col]) {
            return "";
        }

        return files[fileName][ROW - 1][col];
    }

    /**
    * Found at https://stackoverflow.com/questions/11665884/how-can-i-parse-a-string-with-a-comma-thousand-separator-to-a-number
    * Parses a number from a localized string 
    * @param {string} value The initial string value (e.g. '453,323')
    * @param {string} locale The locale used to parse the string, defaults to the navigator's locale
    * @return {int} The float value of the string (e.g. 453323)
    */
    parseNumber(value, locale = navigator.language) {
        const example = Intl.NumberFormat(locale).format('1.1');
        const cleanPattern = new RegExp(`[^-+0-9${ example.charAt( 1 ) }]`, 'g');
        const cleaned = value.replace(cleanPattern, '');
        const normalized = cleaned.replace(example.charAt(1), '.');
  
        return parseFloat(normalized);
    }

    /**
     * Sets the value at a row and column in a given file
     * @param {*} args Object containing arguments, including COlUMN, ROW, and VALUE to set to
     */
    setColumnAtRow(args) {
        let { COLUMN, ROW, VALUE} = args;

        let colArr = COLUMN.split(']');
        let fileName = colArr[0].substring(1);
        let col = colArr.slice(1, colArr.length).join(']').substring(1);

        if(!files[fileName] || ROW < 1 || ROW > files[fileName].length || !files[fileName][ROW - 1][col]) {
            return "";
        }
        console.log(files[fileName][ROW - 1][col]); 
        if(typeof(files[fileName][ROW - 1][col]) === "number") {
            files[fileName][ROW - 1][col] = this.parseNumber(VALUE);
        }
        else{
            files[fileName][ROW - 1][col] = VALUE;
        }
        
        
        console.log(files[fileName][ROW - 1][col]);       
    }

    addDataFileRow(args) {
        let { FILENAME } = args;

        let first = files[FILENAME][0];
        let newRow = {};
        Object.keys(first).map(key => {
            if(typeof(first[key]) === 'number')
                newRow[key] = 0;
            else {
                newRow[key] = '';
            }
        });

        files[FILENAME].push(newRow);
    }

    /**
     * Gets the row count of a given file
     * @param {*} args Object containing arguments, including FILENAME
     * @returns {Number} The row count of the given file
     */
    getRowCount(args){
        let { FILENAME } = args;

        if(!files[FILENAME]) {
            return 0;
        }

        return files[FILENAME].length;
    }

    /**
     * Gets the filename of a given reporter block
     * @param {*} args Unused, holds arguments from the block
     * @param {*} util Unused, holds utility functions for the block
     * @param {*} block The block that originally called this function, used to extract the file name
     * @returns {String} The name of the file
     */
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
        if(fileData.length < 1) return;

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

    getDataFileNames() {
        let names = [];
        this.getFileNames().map(name => {
            names.push({tag: name, intlLabel: {
                id: 'datatools.library.' + name,
                defaultMessage: name,
                description: 'Label for file name tag to revert to all items after filtering by tag.'
            }})
        });
        return names;
    }

    getDataFileContents(name) {
        return [...files[name]];
    }

    updateDataFileFromTable(fileName, row, colName, value) {
        files[fileName][row][colName] = value;

        return [...files[fileName]];
    }
}

module.exports = DataTools;