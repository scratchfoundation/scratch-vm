/**
 * Cloud IO Device responsible for sending and receiving messages from
 * cloud provider (mananging the cloud server connection) and interacting
 * with cloud variables in the current project.
 */

const Variable = require('../engine/variable');
const log = require('../util/log');

class Cloud {
    constructor () {
        /**
         * Reference to the cloud data provider, responsible for mananging
         * the web socket connection to the cloud data server.
         * @type{!object}
         */
        this.provider = null;

        /**
         * Reference to the stage target which owns the cloud variables
         * in the project.
         * @type{!Target}
         */
        this.stage = null;
    }

    /**
     * Set a reference to the cloud data provider.
     * @param {object} provider The cloud data provider
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
     * @param {object} data The data to process
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
     * @param {object} varUpdate Data describing a cloud variable update received
     * from the cloud data provider.
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
