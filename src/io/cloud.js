const Variable = require('../engine/variable');
const log = require('../util/log');

class Cloud {
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
     */
    constructor () {
        /**
         * Reference to the cloud data provider, responsible for mananging
         * the web socket connection to the cloud data server.
         * @type {?CloudProvider}
         */
        this.provider = null;

        /**
         * Reference to the stage target which owns the cloud variables
         * in the project.
         * @type {?Target}
         */
        this.stage = null;
    }

    /**
     * Set a reference to the cloud data provider.
     * @param {CloudProvider} provider The cloud data provider
     */
    setProvider (provider) {
        this.provider = provider;
    }

    /**
     * Set a reference to the stage target which owns the
     * cloud variables in the project.
     * @param {Target} stage The stage target
     */
    setStage (stage) {
        this.stage = stage;
    }

    /**
     * Handle incoming data to this io device.
     * @param {CloudIOData} data The {@link CloudIOData} object to process
     */
    postData (data) {
        if (data.varUpdate) {
            this.updateCloudVariable(data.varUpdate);
        }
    }

    /**
     * Request the cloud data provider to update the given variable with
     * the given value. Does nothing if this io device does not have a provider set.
     * @param {string} name The name of the variable to update
     * @param {string | number} value The value to update the variable with
     */
    requestUpdateVariable (name, value) {
        if (this.provider) {
            this.provider.updateVariable(name, value);
        }
    }

    /**
     * Update a cloud variable in the runtime based on the message received
     * from the cloud provider.
     * @param {VarUpdateData} varUpdate A {@link VarUpdateData} object describing
     * a cloud variable update received from the cloud data provider.
     */
    updateCloudVariable (varUpdate) {
        const varName = varUpdate.name;

        const variable = this.stage.lookupVariableByNameAndType(varName, Variable.SCALAR_TYPE);
        if (!variable || !variable.isCloud) {
            log.warn(`Received an update for a cloud variable that does not exist: ${varName}`);
            return;
        }

        variable.value = varUpdate.value;
    }

    /**
     * Request the cloud data provider to close the web socket connection and
     * clear this io device of references to the cloud data provider and the
     * stage.
     */
    clear () {
        if (!this.provider) return;

        this.provider.requestCloseConnection();
        this.provider = null;
        this.stage = null;
    }
}

module.exports = Cloud;
