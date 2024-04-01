export = Cloud;
declare class Cloud {
    /**
     * @typedef updateVariable
     * @param {string} name The name of the cloud variable to update on the server
     * @param {(string | number)} value The value to update the cloud variable with.
     */
    /**
     * A cloud data provider, responsible for managing the connection to the
     * cloud data server and for posting data about cloud data activity to
     * this IO device.
     * @typedef {object} CloudProvider
     * @property {updateVariable} updateVariable A function which sends a cloud variable
     * update to the cloud data server.
     * @property {Function} requestCloseConnection A function which closes
     * the connection to the cloud data server.
     */
    /**
     * Part of a cloud io data post indicating a cloud variable update.
     * @typedef {object} VarUpdateData
     * @property {string} name The name of the variable to update
     * @property {(number | string)} value The scalar value to update the variable with
     */
    /**
     * A cloud io data post message.
     * @typedef {object} CloudIOData
     * @property {VarUpdateData} varUpdate A {@link VarUpdateData} message indicating
     * a cloud variable update
     */
    /**
     * Cloud IO Device responsible for sending and receiving messages from
     * cloud provider (mananging the cloud server connection) and interacting
     * with cloud variables in the current project.
     * @param {Runtime} runtime The runtime context for this cloud io device.
     */
    constructor(runtime: Runtime);
    /**
     * Reference to the cloud data provider, responsible for mananging
     * the web socket connection to the cloud data server.
     * @type {?CloudProvider}
     */
    provider: {
        /**
         * A function which sends a cloud variable
         * update to the cloud data server.
         */
        updateVariable: any;
        /**
         * A function which closes
         * the connection to the cloud data server.
         */
        requestCloseConnection: Function;
    };
    /**
     * Reference to the runtime that owns this cloud io device.
     * @type {!Runtime}
     */
    runtime: Runtime;
    /**
     * Reference to the stage target which owns the cloud variables
     * in the project.
     * @type {?Target}
     */
    stage: Target;
    /**
     * Set a reference to the cloud data provider.
     * @param {CloudProvider} provider The cloud data provider
     */
    setProvider(provider: {
        /**
         * A function which sends a cloud variable
         * update to the cloud data server.
         */
        updateVariable: any;
        /**
         * A function which closes
         * the connection to the cloud data server.
         */
        requestCloseConnection: Function;
    }): void;
    /**
     * Set a reference to the stage target which owns the
     * cloud variables in the project.
     * @param {Target} stage The stage target
     */
    setStage(stage: Target): void;
    /**
     * Handle incoming data to this io device.
     * @param {CloudIOData} data The {@link CloudIOData} object to process
     */
    postData(data: {
        /**
         * A {@link VarUpdateData } message indicating
         * a cloud variable update
         */
        varUpdate: {
            /**
             * The name of the variable to update
             */
            name: string;
            /**
             * The scalar value to update the variable with
             */
            value: (number | string);
        };
    }): void;
    requestCreateVariable(variable: any): void;
    /**
     * Request the cloud data provider to update the given variable with
     * the given value. Does nothing if this io device does not have a provider set.
     * @param {string} name The name of the variable to update
     * @param {string | number} value The value to update the variable with
     */
    requestUpdateVariable(name: string, value: string | number): void;
    /**
     * Request the cloud data provider to rename the variable with the given name
     * to the given new name. Does nothing if this io device does not have a provider set.
     * @param {string} oldName The name of the variable to rename
     * @param {string | number} newName The new name for the variable
     */
    requestRenameVariable(oldName: string, newName: string | number): void;
    /**
     * Request the cloud data provider to delete the variable with the given name
     * Does nothing if this io device does not have a provider set.
     * @param {string} name The name of the variable to delete
     */
    requestDeleteVariable(name: string): void;
    /**
     * Update a cloud variable in the runtime based on the message received
     * from the cloud provider.
     * @param {VarData} varUpdate A {@link VarData} object describing
     * a cloud variable update received from the cloud data provider.
     */
    updateCloudVariable(varUpdate: VarData): void;
    /**
     * Request the cloud data provider to close the web socket connection and
     * clear this io device of references to the cloud data provider and the
     * stage.
     */
    clear(): void;
}
