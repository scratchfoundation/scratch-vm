//Created by: Alex Burroughs, Zachary Fernbaugh, Phillip Carroll, and Nathanael Hood with the KSU Scratch Data Tools group
//See LICENSE for more information.

// Core, Team, and Official extensions can `require` VM code:
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

// ...or VM dependencies:
const formatMessage = require('format-message');

const DataFunctionHelper = require('./data-function-helper');

//this is where we define the icon image like 
const blockIconURI ='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgaWQ9IkxheWVyXzEiCiAgIGRhdGEtbmFtZT0iTGF5ZXIgMSIKICAgdmlld0JveD0iMCAwIDE1MCAxNTAiCiAgIHZlcnNpb249IjEuMSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iU2NyYXRjaC0wMi5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTIuNCAoZjhkY2U5MSwgMjAxOS0wOC0wMikiPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTIxIj4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT5TY3JhdGNoPC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMjUiCiAgICAgaWQ9Im5hbWVkdmlldzE5IgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpbmtzY2FwZTp6b29tPSI1LjY1Njg1NDMiCiAgICAgaW5rc2NhcGU6Y3g9IjY4LjA2MDcxOCIKICAgICBpbmtzY2FwZTpjeT0iNzUuOTA4NjkyIgogICAgIGlua3NjYXBlOndpbmRvdy14PSIwIgogICAgIGlua3NjYXBlOndpbmRvdy15PSIyNyIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkxheWVyXzEiIC8+CiAgPGRlZnMKICAgICBpZD0iZGVmczQiPgogICAgPHN0eWxlCiAgICAgICBpZD0ic3R5bGUyIj4uY2xzLTEsLmNscy0ye2ZpbGw6bm9uZTtzdHJva2U6IzAwMDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9LmNscy0xe3N0cm9rZS13aWR0aDoxLjRweDt9LmNscy0ye3N0cm9rZS13aWR0aDoxLjc4cHg7fTwvc3R5bGU+CiAgPC9kZWZzPgogIDx0aXRsZQogICAgIGlkPSJ0aXRsZTYiPlNjcmF0Y2g8L3RpdGxlPgogIDxyZWN0CiAgICAgY2xhc3M9ImNscy0xIgogICAgIHg9IjMxLjEiCiAgICAgeT0iMTMuNjkiCiAgICAgd2lkdGg9Ijg4LjQ4IgogICAgIGhlaWdodD0iMTI2LjQiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuNCAxNTIuMzcpIHJvdGF0ZSgtOTAuMTEpIgogICAgIGlkPSJyZWN0OCIKICAgICBzdHlsZT0iZmlsbDojZWJkOWI2O2ZpbGwtb3BhY2l0eToxIiAvPgogIDxwYXRoCiAgICAgY2xhc3M9ImNscy0yIgogICAgIGQ9Ik0xOC41MSwxMDkuNjhjMi44Ni01LjgsNS4yMS03LDYuODQtNywyLjE1LDAsMi42MywyLjA5LDYuNzgsNC4yNS44Ni40NCw3LjMyLDMuNzMsMTMuNTksMi44OCw0LjIzLS41Nyw0LjA1LTIuNDMsMTEuMzctNS41NSw0LjM5LTEuODgsOC4xNi0zLjQ4LDExLjM2LTIuNzUsNC4wNi45MiwyLjgzLDQuNTksNi43OCw1LjY1LDQuODgsMS4zMiw5LjM1LTMuNjEsMTUuODktMi43Miw2LjI1Ljg1LDguMzUsNi4xOCwxMS4zMSw1LjY4LDIuNzEtLjQ2LDEuNjItNSw0LjU3LTUuNiwzLjE5LS42LDYuMjgsNC40NiwxMS4zMSw0LjI4LDQuNjEtLjE3LDYuNzEtNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yNCw1LjYzIgogICAgIGlkPSJwYXRoMTAiIC8+CiAgPHBhdGgKICAgICBjbGFzcz0iY2xzLTIiCiAgICAgZD0iTTE4LjE5LDg5LjkxYzIuODYtNS44LDUuMjItNyw2Ljg0LTcsMi4xNiwwLDIuNjMsMi4wOSw2Ljc5LDQuMjUuODUuNDQsNy4zMiwzLjcyLDEzLjU5LDIuODgsNC4yMy0uNTcsNC4wNS0yLjQzLDExLjM3LTUuNTYsNC4zOS0xLjg3LDguMTUtMy40OCwxMS4zNi0yLjc1LDQsLjkzLDIuODMsNC41OSw2Ljc3LDUuNjYsNC44OSwxLjMyLDkuMzUtMy42MSwxNS44OS0yLjcyLDYuMjUuODQsOC4zNiw2LjE3LDExLjMyLDUuNjcsMi43LS40NSwxLjYyLTUsNC41Ni01LjU5LDMuMi0uNiw2LjI4LDQuNDYsMTEuMzIsNC4yOCw0LjYxLS4xNyw2LjctNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yMyw1LjYzIgogICAgIGlkPSJwYXRoMTIiIC8+CiAgPHBhdGgKICAgICBjbGFzcz0iY2xzLTIiCiAgICAgZD0iTTE5LjE5LDczLjkxYzIuODYtNS44LDUuMjItNyw2Ljg0LTcsMi4xNiwwLDIuNjMsMi4wOSw2Ljc5LDQuMjUuODUuNDQsNy4zMiwzLjcyLDEzLjU5LDIuODgsNC4yMy0uNTcsNC4wNS0yLjQzLDExLjM3LTUuNTYsNC4zOS0xLjg3LDguMTUtMy40OCwxMS4zNi0yLjc1LDQsLjkzLDIuODMsNC41OSw2Ljc3LDUuNjYsNC44OSwxLjMyLDkuMzUtMy42MSwxNS44OS0yLjcyLDYuMjUuODQsOC4zNiw2LjE3LDExLjMyLDUuNjcsMi43LS40NSwxLjYyLTUsNC41Ni01LjU5LDMuMi0uNiw2LjI4LDQuNDYsMTEuMzIsNC4yOCw0LjYxLS4xNyw2LjctNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yMyw1LjYzIgogICAgIGlkPSJwYXRoMTQiIC8+CiAgPHBhdGgKICAgICBjbGFzcz0iY2xzLTIiCiAgICAgZD0iTTIwLjE5LDU1LjkxYzIuODYtNS44LDUuMjItNyw2Ljg0LTcsMi4xNiwwLDIuNjMsMi4wOSw2Ljc5LDQuMjUuODUuNDQsNy4zMiwzLjcyLDEzLjU5LDIuODgsNC4yMy0uNTcsNC4wNS0yLjQzLDExLjM3LTUuNTYsNC4zOS0xLjg3LDguMTUtMy40OCwxMS4zNi0yLjc1LDQsLjkzLDIuODMsNC41OSw2Ljc3LDUuNjYsNC44OSwxLjMyLDkuMzUtMy42MSwxNS44OS0yLjcyLDYuMjUuODQsOC4zNiw2LjE3LDExLjMyLDUuNjcsMi43LS40NSwxLjYyLTUsNC41Ni01LjU5LDMuMi0uNiw2LjI4LDQuNDYsMTEuMzIsNC4yOCw0LjYxLS4xNyw2LjctNC41Nyw5LjEtNC4xNywxLC4xOCwyLjE3LDEuMjUsMi4yMyw1LjYzIgogICAgIGlkPSJwYXRoMTYiIC8+Cjwvc3ZnPg==';

const NO_FILES ="NO FILES UPLOADED";


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
        
        
        /**
         * holds data for any uploaded data set
         */
        this._files = {};

        this._hiddenFiles = [];

        this._helper = new DataFunctionHelper();

        this.getRow = this.getRow.bind(this);
        this.generateFileDisplayName = this.generateFileDisplayName.bind(this);
        this.addDataFile = this.addDataFile.bind(this);
    }

    /**
     * Define the DataTools extension.
     * @return {Object} Extension description.
     */
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
            
            color1: '#7851a9',
            color2: '#553A76',

            blocks: [
                ...this.generateDisplayedBlocks(),
                '---',
                //Add other blocks below
                '---',
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
                    opcode: 'addDataFileRow',
                    text: formatMessage({
                        id: 'datatools.addDataFileRow',
                        default: 'add row to [FILENAME]',
                        description: 'add an empty row to a file'
                    }),
                    blocktype: BlockType.COMMAND,
                    arguments: {
                        FILENAME: {
                            type: ArgumentType.STRING,
                            menu: 'fileMenu',
                        }
                    }
                },
                {
                    opcode: 'addDataFileColumn',
                    text: formatMessage({
                        id: 'datatools.addDataFileColumn',
                        default: 'add [TYPE] column [NAME] to [FILENAME]',
                        description: 'add an empty column to a file'
                    }),
                    blocktype: BlockType.COMMAND,
                    arguments: {
                        
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'typeMenu',
                        },
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        },
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
                        },
                        ROW: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
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
                        },
                        ROW: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: " "
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
                    blockType: BlockType.COMMAND,
                    arguments: {
                        ORIGINAL: {
                          type: ArgumentType.STRING,
                          menu: 'fileMenu'  
                        },
                        NEW: {
                            type: ArgumentType.STRING,
                            defaultValue: " "
                        }
                    }
                },
                {
                    opcode: 'createEmptyDataset',
                    text: formatMessage({
                        id: 'datatools.createDataset',
                        default: 'create new data set [NAME]',
                        description: 'create an empty dataset and give it a name'
                    }),
                    blocktype: BlockType.COMMAND,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: " "
                        }
                    },
                },
                '---',
                {
                    opcode: 'saveFunctionData',
                    text: formatMessage({
                        id: 'datatools.saveFunctionData',
                        default: 'save [FUNCTION] as [NAME]',
                        description: 'saves a mapped data set'
                    }),
                    blockType: BlockType.FUNCTION,
                    branchCount: 0,
                    arguments: {
                        FUNCTION: {
                            type: ArgumentType.STRING,
                            menu: 'fileMenuSquare',
                        },
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'filename',
                        }
                    }
                },
                {
                    opcode: 'executeDataFunction',
                    text: formatMessage({
                        id: 'datatools.executeDataFunction',
                        default: '[FUNCTION] [NAME]',
                        description: 'maps a given dataset'
                    }),
                    blockType: BlockType.FUNCTION,
                    branchCount: 1,
                    arguments: {
                        FUNCTION: {
                            type: ArgumentType.STRING,
                            menu: 'functionMenu'
                        },
                        NAME: {
                            type: ArgumentType.STRING,
                            menu: 'fileMenuSquare',
                        }
                    }
                },
                {
                    opcode: 'getCurrentRow',
                    text: formatMessage({
                        id: 'datatools.getCurrentRow',
                        default: 'current row at [COLUMN]',
                        description: 'gets the value of a column for a function'
                    }),     
                    arguments: {
                        COLUMN: {
                            type: ArgumentType.STRING,
                            defaultValue: "column"
                        }
                    },      
                    blockType: BlockType.REPORTER,
                },
                {
                    opcode: 'setMapResult',
                    text: formatMessage({
                        id: 'datatools.setMapResult',
                        default: 'map: set result at [COLUMN] to [VALUE]',
                        description: 'sets the value of the map function'
                    }),                
                    blockType: BlockType.COMMAND,
                    arguments: {
                        COLUMN: {
                            type: ArgumentType.STRING,
                            defaultValue: "column"
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: " "
                        }
                    }
                },
                //FOR REFERENCE: This is theoretical, and not an actual representation of
                //               how the implementation might work. Just a proof of concept
                {
                    opcode: 'setFilterResult',
                    text: formatMessage({
                        id: 'datatools.setFilterResult',
                        default: 'filter: return [VALUE]',
                        description: 'sets the return value of the filter function'
                    }),                
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VALUE: {
                            type: ArgumentType.STRING,
                            menu: 'filterMenu'
                        }
                    }
                },
                {
                    opcode: 'updateReduceResult',
                    text: formatMessage({
                        id: 'datatools.updateReduceResult',
                        default: 'reduce: update accumulator by [VALUE]',
                        description: 'updates the accumulator value of the reduce function'
                    }),                
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
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
                },
                typeMenu: {
                    items: ['word', 'number']
                },
                fileMenuSquare: {
                    acceptReporters: true,
                    squareOutput: true,
                    items: 'getFileNames'
                },
                functionMenu: {
                    items: ['map', 'filter', 'reduce']
                },
                filterMenu: {
                    acceptReporters: true,
                    items: ['true', 'false']
                }
            }
        }
    }

//#region pls hide this

    /**
     * Performs a specified action
     * @param {String} action The action
     * @param {Object} args The arguments for the function
     */
    performAction(action, args) {
        switch(action) {
            case 'addDataFile':
                this.addDataFile(args.name, args.fileData);
                break;
            case 'removeDataFile':
                return this.removeDataFile(args.name);
            case 'getDataFileNames':
                return this.getDataFileNames();
            case 'getDataFileContents':
                return this.getDataFileContents(args.name);
            case 'updateDataFile':
                return this.updateDataFileFromTable(args.fileName, args.row, args.colName, args.value);
            case 'addDataFileRow':
                return this.addDataFileRow({FILENAME: args.fileName});
            case 'addDataFileColumn':
                return this.addDataFileColumn({TYPE: args.type, NAME: args.name, FILENAME: args.fileName});
            default:
                alert("DATATOOLS: Invalid action received");
                break;
        }
    }

    /**
     * 
     * @param {*} args 
     */
    addDataFileColumn(args){
        let {TYPE, NAME, FILENAME} = args;
        console.log(NAME);
        if(!FILENAME || FILENAME === NO_FILES)
            return;
        if(TYPE !='word' && TYPE!='number')
            return;
        if(this._files[FILENAME].length === 0){
            this._files[FILENAME][0]={};
            if(TYPE == 'word'){
                this._files[FILENAME][0][NAME] = '';
            } 
            else {
                this._files[FILENAME][0][NAME] = 0;
            }
        }
        else {
            if(this._files[FILENAME][0][NAME]){
                alert("Column already exists, please try again with a different name");
                return;
            }
            let i;
            let rowCount = this._files[FILENAME].length;
            if(TYPE == 'word'){
                for(i = 0; i < rowCount; i++){
                    this._files[FILENAME][i][NAME] = '';
                }
            }
            else{
                for(i =0; i<rowCount; i++){
                    this._files[FILENAME][i][NAME] = 0;
                }
            }
        }
        
    }

    /**
     * Creates a Data set with the desired name that does not have any rows or columns
     * @param {string} args{NAME} holds the name the user wishes to give to the newly created empty data set
     */
    createEmptyDataset(args) {
        let {NAME} = args;
        if(this._files[NAME]){
            NAME = this.generateFileDisplayName(NAME);
        }

        this._files[NAME] = [];//doing the exact same thing as addDataFile but without the check for an empty dataset so it is created without columns
        this._fileBlocks.push(
        {
            opcode: 'file_' + NAME,
            func: 'getFilename',
            text: NAME,
            blockType: BlockType.REPORTER
        });
        //Update the workspace to add the new file
        this._runtime.requestToolboxExtensionsUpdate();
    }

    /**
     * Generates column data for dropdown display
     * @returns {Object} An object containing arrays with the columns of each file
     */
    generateColumnData() {
        let fileNames = Object.keys(this._files);
        if(fileNames.length === 0) {
            return {
                
                "":["NO FILES UPLOADED"]
            };
        }
        let data = {};
    
        fileNames.forEach(name =>{
            let columns = Object.keys(this._files[name][0]);
            data[name] = columns;
        });

        return data;
    }

    /**
     * Duplicates an existing dataset either as the name given by the user or as the original name plus an incremented number
     * @param {Object} args Contains the original and new file names
     */
    duplicateDataset(args) {
        let {ORIGINAL, NEW} = args;
        if(!ORIGINAL || ORIGINAL === NO_FILES)
            return;
        if(NEW === ""){
            NEW = ORIGINAL;
        }
        let data = JSON.parse(JSON.stringify(this._files[ORIGINAL]));
        this.addDataFile(NEW, data);
    }

    /**
     * Dummy method to ensure the status button works
     */
    isConnected() {
        return Object.keys(this._files).length > 0;
    }

    /**
     * Dummy method to ensure the status button works
     */
    scan() { }

    /**
     * Dummy method to ensure the status button works
     */
    connect() { }

    /**
     * Dummy method to ensure the status button works
     */
    disconnect() { }

    /**
     * Gets a list of filenames that will be displayed in the dropdown
     * @returns {Array} The list of filenames
     */
    getFileNames() {
        let names = [];
        Object.keys(this._files).forEach(file => {
            if(!this._hiddenFiles.includes(file)) {
                names.push(file);
            }
        });

        if(names.length === 0) names.push("");
        return names;
    }

    /**
     * Gets the value at a row and column in a given file
     * @param {Object} args Object containing arguments, including COLUMN, ROW, and FILENAME
     * @returns {String | Number} The value at the specified row and column in the specified file 
     */
    getColumnAtRow(args) {
        let { COLUMN, ROW } = args;

        let colArr = COLUMN.split(']');
        let fileName = colArr[0].substring(1);
        let col = colArr.slice(1, colArr.length).join(']').substring(1);

        if(!this._files[fileName] || ROW < 1 || ROW > this._files[fileName].length || this._files[fileName][ROW - 1][col] === 'undefined') {
            return "";
        }

        return this._files[fileName][ROW - 1][col];
    }

    /**
    * Found at https://stackoverflow.com/questions/11665884/how-can-i-parse-a-string-with-a-comma-thousand-separator-to-a-number
    * Parses a number from a localized string 
    * @param {String} value The initial string value (e.g. '453,323')
    * @param {String} locale The locale used to parse the string, defaults to the navigator's locale
    * @return {Number} The float value of the string (e.g. 453323)
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
     * @param {Object} args Object containing arguments, including COlUMN, ROW, and VALUE to set to
     */
    setColumnAtRow(args) {
        let { COLUMN, ROW, VALUE} = args;

        let colArr = COLUMN.split(']');
        let fileName = colArr[0].substring(1);
        let col = colArr.slice(1, colArr.length).join(']').substring(1);

        if(!this._files[fileName] || ROW < 1 || ROW > this._files[fileName].length || this._files[fileName][ROW - 1][col]  === 'undefined') {
            return "";
        }
        if(typeof(this._files[fileName][ROW - 1][col]) === "number") {
            if(!isNaN(VALUE)){
                this._files[fileName][ROW - 1][col] = this.parseNumber(VALUE);
            }
        }
        else{
            this._files[fileName][ROW - 1][col] = VALUE;
        }
        
    }

    /**
     * Adds an empty row to a dataset
     * @param {Object} args Object containing the file name
     */
    addDataFileRow(args) {
        let { FILENAME } = args;
        console.log(FILENAME);
        if(!FILENAME || FILENAME === NO_FILES){
            return;
        }

        let first = this._files[FILENAME][0];
        let newRow = {};
        Object.keys(first).map(key => {
            if(typeof(first[key]) === 'number')
                newRow[key] = 0;
            else {
                newRow[key] = '';
            }
        });

        this._files[FILENAME].push(newRow);
    }

    /**
     * Gets the row count of a given file
     * @param {Object} args Object containing arguments, including FILENAME
     * @returns {Number} The row count of the given file
     */
    getRowCount(args){
        let { FILENAME } = args;

        if(!this._files[FILENAME]) {
            return 0;
        }

        return this._files[FILENAME].length;
    }

    /**
     * Gets the filename of a given reporter block
     * @param {Object} args Unused, holds arguments from the block
     * @param {Object} util Unused, holds utility functions for the block
     * @param {Object} block The block that originally called this function, used to extract the file name
     * @returns {String} The name of the file
     */
    getFilename(args, util, block) {
        return block.text;
    }

    /**
     * Adds a data file to the extension's array of files using the
     * file name as a key.
     * @param {String} name The original name of the file
     * @param {Array} fileData The parsed file data stored as an array of JSON objects
     */
    addDataFile(name, fileData, hidden = false) {
        //Generate a displayable file name if a duplicate is found
        if(fileData.length < 1) return;

        if(this._files[name]){
            name = this.generateFileDisplayName(name);
        }

        this._files[name] = fileData;

        if(hidden) {
            this._hiddenFiles.push(name);
        }

        //Update the workspace to add the new file
        this._runtime.requestToolboxExtensionsUpdate();
    }

    generateDisplayedBlocks() {
        let blocks = [];
        Object.keys(this._files).forEach(file => {
            if(!this._hiddenFiles.includes(file)) {
                blocks.push({
                    opcode: 'file_' + file,
                    func: 'getFilename',
                    text: file,
                    blockType: BlockType.REPORTER
                });
            }
        });

        return blocks;
    }

    /**
     * Removes a data file with a given name
     * @param {String} name The name of the file to be removed
     * @returns {Boolean} Whether or not the file was successfully removed
     */
    removeDataFile(name) {
        if(name === null || name === "" || !this._files[name]) {
            return false;
        }

        delete this._files[name];

        this._runtime.requestToolboxExtensionsUpdate();
        return true;
    }

    /**
     * Generates a displayable file name that will handle duplicates by appending "(DUPLICATE_NUM)" if necessary
     * @param {String} name The original name of the file
     * @returns {String} The file name that will be displayed
     */
    generateFileDisplayName(original) {
        if(!this._files[original]) return original;
        let num = 1;
        while(this._files[original + " (" + num + ")"]) {
            num++;
        }
        return original + " (" + num + ")";
    }

    /**
     * Creates an array of tags to be displayed with the table
     * @returns {Array} An array of each file name
     */
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

    /**
     * Gets the content of the file
     * @param {String} name The file's name
     * @returns {Array} An array representing the file's contents
     */
    getDataFileContents(name) {
        return [...this._files[name]];
    }

    /**
     * Updates a data file given a table update
     * @param {String} fileName The file's name
     * @param {Number} row The specified row
     * @param {String} colName The specified column
     * @param {String | Number} value The new value
     * @returns {Array} An array representing the updated data
     */
    updateDataFileFromTable(fileName, row, colName, value) {
        this._files[fileName][row][colName] = value;

        return [...this._files[fileName]];
    }

//#endregion

    getCurrentRow(args, util) {
        return this._helper.getCurrentRow(args, util);
    }

    executeDataFunctionAndSave(args, util) {
        args["SAVE"] = true;
        return this.executeDataFunction(args, util);
    }

    executeDataFunction(args, util) {
        switch(args.FUNCTION) {
            case 'map':
                return this.map(args, util);
            case 'filter':
                return "filter";
            case 'reduce':
                return "reduce";
            default:
                return null;
        }
    }

    saveFunctionData(args, util) {
        if(args.FUNCTION) {
            let oldName = args.FUNCTION;
            let file = this._files[oldName];

            if(!this._helper.checkDeleteSaveData(util)) {
                let check = this._helper.checkDataset(args, util);
                if(check) {
                    return args.NAME;
                }
    
                this._helper.saveDataset(args, util);
            }

            this._hiddenFiles = this._hiddenFiles.filter(file => file !== oldName);

            let name = args.NAME;

            if(this._files[name]){
                name = this.generateFileDisplayName(name);
            }
            this._files[name] = file;
            delete this._files[oldName];

            this._runtime.requestToolboxExtensionsUpdate();
            return name;
        }
    }

    setFilterResult(args, util) {
        console.log(args);
    }

    updateReduceResult(args, util) {
        console.log(args);
    }

    /**
     * Sets the result of a mapping function to a given value.
     * See 'setMapResult' in 'map-helper.js' for more.
     * @param {Object} args The block's arguments
     * @param {Object} util Block utility provided by the runtime
     */
    setMapResult(args, util) {
        this._helper.setMapResult(args, util);
    }


    /**
     * Defines the mapping function loop to iterate through a given data set.
     * Each iteration executes a branch on the given data set and requires 'setMapResult' 
     * to be called on each iteration. 
     * @param {Object} args The block's arguments
     * @param {Object} util Block utility object, used to control the stack frame.
     * @returns {String} The name of the resulting data set
     */
    map(args, util) {
        //Initialization
        if(typeof args.NAME === 'undefined' || args.NAME === "") return "";

        //If we're trying to run in the toolbar, don't
        if(this._helper.checkRunningInToolbar(util.thread.peekStack())) return;

        //let fileName = colArr[0].substring(1);
        let rowCount = this.getRowCount({FILENAME: args.NAME})

        let topBlock = util.thread.topBlock;

        this._helper.checkRegenerateFunctionBlockDepthMap(topBlock, util);
        let id = this._helper.getID(topBlock);

        let generatedMap = this._helper.getGeneratedData(topBlock, args.NAME);
        if(generatedMap) return generatedMap;

        return this._helper.executeMapFunction(args, util, id, rowCount, 
                                                    this.addDataFile, this.generateFileDisplayName,
                                                    this.getRow);
    }

    /**
     * Gets a row from a dataset
     * @param {String} fileName The name of the dataset
     * @param {Number} row The row number, off by 1
     * @returns {Object} The specified row, or null if the file doesn't exist
     */
    getRow(fileName, row) {
        if(this._files[fileName]) {
            return this._files[fileName][row - 1];
        }
        else return null;
    }
}

module.exports = DataTools;