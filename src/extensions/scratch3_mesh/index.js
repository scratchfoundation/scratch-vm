const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const formatMessage = require('format-message');
const uuidv4 = require('uuid/v4');
uuidv4();
const Variable = require('../../engine/variable');
const MeshService = require('./mesh-service');
const MeshHost = require('./mesh-host');
const MeshPeer = require('./mesh-peer');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV8/tCIVBzsUccjQOlkQFXHUKhShQqgVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg+AHi5Oik6CIl/i8ptIjx4Lgf7+497t4B/maVqWZwHFA1y8ikkkIuvyqEXhFEL8KIIi4xU58TxTQ8x9c9fHy9S/As73N/jgGlYDLAJxDPMt2wiDeIpzctnfM+cYSVJYX4nHjMoAsSP3JddvmNc8lhP8+MGNnMPHGEWCh1sdzFrGyoxFPEMUXVKN+fc1nhvMVZrdZZ+578heGCtrLMdZojSGERSxAhQEYdFVRhIUGrRoqJDO0nPfzDjl8kl0yuChg5FlCDCsnxg//B727N4uSEmxROAj0vtv0RB0K7QKth29/Htt06AQLPwJXW8deawMwn6Y2OFjsCBreBi+uOJu8BlztA9EmXDMmRAjT9xSLwfkbflAeGboH+Nbe39j5OH4AsdZW+AQ4OgdESZa97vLuvu7d/z7T7+wE5SnKQf0E1gwAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB+QEBg0qK1rlrBMAAAx1SURBVFjDtZh7kBXVncc/p7tv933P+wEMzPAcnoM8ZhiZCFHKOEFB1ggGXGNkddcyVVbWdbXWLS2TzSbZSu3W7hpTWuKKpaLGB8Ia1gpgcACB8BgY5CHPmWGcB3de931v3+4++8dc8DoZEaikq351uvre0/Wp7zn9O7/fV/DnucQ3/C7/Ui++1rniKsDkXxpQjHAvvgFQjgB3VaDadYDljpdCGfbsEsDXxVUrKq4DTskZFUDNuR8J0AHs7HgpZM54RUjtGsBEDpCanasBrux46XkuoJ2NDGDlhJ0DfcVlF9egmgpiCGjUAqNo8m154fLZUyzPmG+heeYj9KoyIfJcEgYdJx5zMm1Y4X10f7aLY39oJ3M8Ru9nKRBpkGYWeiRQeTWAuXAqQlGR0gXS8K58uyKhTLwZ4b1zdqkxvypf9SVSku1pWFHtYXaFTrEBsbBFa0+Gd5qj/b1xs5lI91avOHkgseXRDiABIgkyPQz0TyDFN8MJDYkO0sOqfY2k8/5m/ARP/TO3BbSqcW4KAiq2A719JnvOpOhNSZbN9FBc5OJEZ4YXd4R5pN7Hul1xc/vByFFof5sPGrcBUSAGJAEzZ+m/Avl1gLlwBkgvaw4/OrEo+ODMKndR9VidexuCdPZn6I/aOI7EoyuoLoWuPpNHXutj7jQPhyI2ZCSfPTYavyrZfjjOExv7w3393e/ydsPLwCAQHlKU9DDIEQG//BiEoiGlAdLHAyeerS7wPvDU3QVa64UUv9odZ3xAoR9BoU8hT1fwagINSUd7ipUNQe5bnIeZkbzQFOHIqSSNtX6kAwlT8uqOsHM+FPqAN+r+E+gDMSgEcSnlJchLe1JqX7u0Q3vOoz54/FFbuNfOmKSrL38SYWDQYtl0D08vLyDPq+LWIJmWtPVlCMUdnnjPonq0Tp5XIZJweOr2Aor3x5GH41SXu2gPZdBcQsEMrhCrm2LyzUXrQMply5azefNmZ1i+FNoICiogVJCG96FDtyVi7gdrKlBnFqrcems+sZjN+oNxgobCZ+cSvPDHJO19GeoLFCaVu6gp1di4M8yEUheFQY2uXhOEpL7K4P5FQVy6wt4zKf6wL6K8dFBdwR3vtPLhyo9aW1ut7F7MzZVSHSHPaSD04OrXK2Nm5T/jd0196YFiFs/yk+9VUTXBroMxms6kOfKFyfdnufnhoiD3LM4nP6iy9/MkBR6Fj86ZbD0U4xf7E0QTDrUVBlua4xhCcvMMH7OneBjtUYyPjyqF/qDv2IXmTdGcj+Vy2lFGUFAVZXONiFmxoLJUry2sUJlU5sLMSExLcvJCmt82J9F0wX/fV0pDjZ/JZTqHzyep+a9uvlfr46f3lfHivcXUFKvcNdFg2w+L2HvB5LuzfWw6EGfdx2H8hkLjPD+N84qnxQILF5I3LR/wAXpuwldGSshSm+3DW3j7qrqAu86vkjLBqwuazyZ5fmeU9Y+Usft0ioGUQ8BQ6BiweWZDiPfuKaRxbgDbkfjdCrOqfey5YHJLjZ8fLfDSdDzBk3cV8b9H4qxvilBRrLF0lkfDU7moonR8URbQyJ5MCiCUEZbYRc2tVYtHeeu/NcNLhUsSSTn0R23WbArzs2UFrL4xwPfmeHn89RCKKtjxx0EWTPeyfF6AhCmxHbAdCPpVzkdsUhnJzTV+bEfSc9Hk5YfKeHd/jFc/jfJpewbyg5M7xi+ZfCVAvrIHSyoXTyxzl0wZpVNR7GLnySSPf9DPK40Bpo01CIUtfry0kKqAwu2/7mZnp82TSwtwpBx6gQouFXR1KN/aEtwuwZob/azdHmVCkcYzf1XEk78OUTfZw9/WBdz4p90AeAF39nxXR1JwqAjQ/A3FhRpel6C+xsdPtgxSW6rRWBsknnJIZUBT4NnVJWxrSeJNWHRHHXRVkOdVCLgVXKogZUrKfCoel0BKmDvZx/3lKpv2RWg6GmNxvYdyv8KYMhd4i6qzgLkKKiMr6Lgm6LpAEaDrCgVxG+FS8OpD21UREk0RfN5l8vAcg6UNQR7bEOLfN/ZyosvE0Ib+F0s6fLvKQBXgcglOd5t0Xszw128OsGSml1+uKmLLqTQ9GUGp7i3NwrlySji0YYXnkIqOCETDFlLA3pY4d34nj9+dSHLTlAQNU9ykLYlLg3/cOMDDN/pZXhtg8QwfLzZFuOU3PczQoWaCm5NtKQak4NHXQhw+myKqCmaN0alOw8JpPgbjNpPzFJpDFhLNN6x0E8MT9ZeQCqKjJ8Op7gzH21P8eEURd852+PnGXp57oJSasW6a21Mk+0y+O28UUkLQo/BEYz5PNOZzJmSx/3yKQ8cTLK7xMb3C4K66AHPG6fQnHJb/RyehiI3HJZgyWuc3hxL0CUmOcmIkwMuXosvI8bQofm9/lC5FIc+rUl7gYvXCAP+2qZ9frSlhfVOEexqCBHWIphxUBQxNQQiYVKJRGvDy4YEYv1hVjKrAYMLBtCSZ7DkRNx2CbpXCPI3iqEWPtJLfVFFfPgN1mWkfXaRNOHAqyU3VHoSASNLmjnkB8twKT7/bx2stSdp/WXl5suWAYzoIAT5D4XhripBQsGyH3qgkbjpoqsC2JVKAzxCkM5JPWuIcCzvoeqrX/GrxKgGpjNDQ2KlE9PA4FyytdtOfHHqx5YBpSZbVBqgfb0DMYd2HvRxqSxNwKwTdCqoqEAhsCWc7Utw33SDjgOlIQKApkLElbkOhPy75+ft9dCUlS6tc2OmL53JaAzsXMPcaanAS5/e29aTjrQnJ+r1xPjwSJ+hWcBxJ2pZ0hUw2PFLCtIke5j3fw9oXumk6lUQRAq8hiCYctrRbLKp2Y2iCgFuh0KdQ4NPoHLQZ+CLN373SQ814g3vr/USSVtpuO3IyWxNmctqAy0ssc6oIa0rbttMf+2e1+Ezlxp/dWcALW8M4Dtw1389A3OFwp8XqW9xMKXexcIqHd/ZF+acNvZy34bbJbqYWqPT0W3SEHTqiKb4YsDneneHTtjRbj8SZNdbgxR+UUFWosXl3mF2fX2zl8Ja2YYWrAzjD96ANZE51nYgpld2/j/cbtbNWFmp1PyjhX38bwko7zBync1FTyPcqdIZtNAUeXpLP/YvzONOd4Vxnins3DvLQKJWNu8Ik0g5uTVCcr7G2zk++7bBsQYDxRRptFy3e2he1iZ1tFlpXRA4BpnJUlNoIPaxF176kP35kV0QvP9x0Oj3/H5Z5+Mn3S9i0N8pju6PcMVrH0BXISBKmQ8K00DXBrAqdcYUqSw8k+Pt7iigJasRNiWCo2Ojqt3guLamtMkiZkq1HEuw43HfeH9vTEhs8FwbiwxT8Sj2YkwuFkj67NcOM5Zk93f4FN1QY7jlVBjPGGVSZFs/vi6PHLQyfyphCF+7sUaZrgqff72daocpN070MJhxSpoNpSyxbsuNIjKllLirLDF7dPshPtwzGiTRvMZueagEuAgPZRuoypDqCjfFlnHzjIhNX+Tae4IaFkzyiulznTKfJrVM9WG6VH20e4NixOBmgssTFyW6L1z+J8C9rSvC4FBwJuirw6AqRhM2zv49g2/DaRwNs2BN3FNp3yA9WbMvC9WWbqGR2iR1AihG7OdBBeEDmAyXqyt2PGwXlK9atLVV6u1MEgi6+M8dHKOaw40SC7S0JDg7YdLammTfRYHmtH5cikEiiKUln2Gbb6SRlSDxBjYOn0o5pdnwq31j8FtCVjVAOoHlpD6pX08TL4//Tkplwt/beMTFhV8gxbq7SGVOsoyqCmrEGy+sCWIMZxuWr3F0fYLA/QyJqoZgOeYbgaE+GfNPh27P9nD4djV8Ind3BW0vezyoXAvqBSI56l/tj9Sr8vaHMfvyVk1QuCZn9nqJ4Wiv0KlKRqsClq+w9EWd/a5qnVxZTN8nL3Eke6qb6mDXRg7Qlb+6M0p3G/r8jF891ntq/hd/dvS0HrjenNzaHN+9XbtyH8qQBwgsyD8gP3vLshIh7bh2eUQ11lflTp5YbvuZOm/kzPDRMcpPKSOIJh3DEIhQyeeloIk14sA2r/RAdTS00P9eRVaz/ehr3P+2PhyB1wAP4gaAIjs+TrhlFTKyvYtzsufjLZhaqnjJha27HdkRCWsm0leglHTqvDRw9qX2xtz3VcWCAZFcku5Th7Hhd1sdIkGq2VjOyoN5s/3ApPMNKdXJst3RWoUQ2z12K5LCj7arNoyvYb5f9QD0Lmxt6TqnO5aT/JWQqO6aziuUWBtdsv12LganlKPd1BqY1zMQc7gvK6zEw/5wW8HAb+Kot4P8HVeGw2VaOZdIAAAAASUVORK5CYII=';

const MESH_HOST_PERIPHERAL_ID = 'mesh_host';

/**
 * Host for the Mesh-related blocks
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3MeshBlocks {
    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Mesh';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'mesh';
    }

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * Mesh ID
         * @type {string}
         */
        this.meshId = uuidv4();

        /**
         * Mesh Object
         * @type {MeshHost|MeshPeer}
         */
        this.meshService = new MeshService(this, this.meshId, null);

        this.setOpcodeFunctionHOC();
        this.setVariableFunctionHOC();

        this.runtime.registerPeripheralExtension(Scratch3MeshBlocks.EXTENSION_ID, this);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3MeshBlocks.EXTENSION_ID,
            name: Scratch3MeshBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'getSensorValue',
                    text: formatMessage({
                        id: 'mesh.sensorValue',
                        default: '[NAME] sensor value',
                        description: 'Any global variables from other projects'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            menu: 'variableNames',
                            defaultValue: ''
                        }
                    }
                }
            ],
            menus: {
                variableNames: {
                    acceptReporters: true,
                    items: 'getVariableNamesMenuItems'
                }
            }
        };
    }

    getSensorValue (args) {
        return this.meshService.getVariable(args.NAME);
    }

    getVariableNamesMenuItems () {
        return [' '].concat(this.meshService.variableNames);
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        this.meshService.scan(MESH_HOST_PERIPHERAL_ID);
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {string} meshId - the Mesh ID of the peripheral to connect to.
     */
    connect (meshId) {
        if (meshId === MESH_HOST_PERIPHERAL_ID) {
            this.meshService = new MeshHost(this, this.meshId, this.meshService.webSocket);
            this.meshService.connect();
        } else {
            this.meshService = new MeshPeer(this, this.meshId, this.meshService.webSocket);
            this.meshService.connect(meshId);
        }
    }

    /**
     * Disconnect from the Mesh.
     */
    disconnect () {
        this.meshService.disconnect();
    }

    /**
     * Return true if connected to the Mesh
     * @return {boolean} - whether the Mesh is connected.
     */
    isConnected () {
        return this.meshService.isConnected();
    }

    /**
     * Return connected message if connected to the Mesh
     * @return {string} - connected message.
     */
    connectedMessage () {
        let message;
        if (this.meshService.isHost) {
            message = formatMessage({
                id: 'mesh.registeredHost',
                default: 'Registered Host Mesh [{ MESH_ID }]',
                description: 'label for registered Host Mesh in connect modal for Mesh extension'
            }, {MESH_ID: this.makeMeshIdLabel(this.meshService.meshId)});
        } else {
            message = formatMessage({
                id: 'mesh.joinedMesh',
                default: 'Joined Mesh [{ MESH_ID }]',
                description: 'label for joined Mesh in connect modal for Mesh extension'
            }, {MESH_ID: this.makeMeshIdLabel(this.meshService.hostMeshId)});
        }
        return message;
    }

    makeMeshIdLabel (meshId) {
        return meshId.slice(0, 6);
    }

    setOpcodeFunctionHOC () {
        this.opcodeFunctions = {
            event_broadcast: this.runtime.getOpcodeFunction('event_broadcast'),
            event_broadcastandwait: this.runtime.getOpcodeFunction('event_broadcastandwait'),
            data_setvariableto: this.runtime.getOpcodeFunction('data_setvariableto'),
            data_changevariableby: this.runtime.getOpcodeFunction('data_changevariableby')
        };

        this.runtime._primitives.event_broadcast = this.broadcast.bind(this);
        this.runtime._primitives.event_broadcastandwait = this.broadcastAndWait.bind(this);
        this.runtime._primitives.data_setvariableto = this.setVariableTo.bind(this);
        this.runtime._primitives.data_changevariableby = this.changeVariableBy.bind(this);
    }

    broadcast (args, util) {
        try {
            log.log('event_broadcast in mesh');

            this.opcodeFunctions.event_broadcast(args, util);
            this.meshService.sendRTCBroadcastMessage(args.BROADCAST_OPTION.name);
        } catch (error) {
            log.error(`Failed to execute event_broadcast: ${error}`);
        }
    }

    broadcastAndWait (args, util) {
        try {
            log.log('event_broadcastandwait in mesh');

            const first = !util.stackFrame.startedThreads;
            this.opcodeFunctions.event_broadcastandwait(args, util);
            if (first) {
                this.meshService.sendRTCBroadcastMessage(args.BROADCAST_OPTION.name);
            }
        } catch (error) {
            log.error(`Failed to execute event_broadcastandwait: ${error}`);
        }
    }

    setVariableTo (args, util) {
        try {
            log.log('data_setvariableto in mesh');

            this.opcodeFunctions.data_setvariableto(args, util);
            this.sendVariableByOpcodeFunction(args);
        } catch (error) {
            log.error(`Failed to execute data_setvariableto: ${error}`);
        }
    }

    changeVariableBy (args, util) {
        try {
            log.log('data_changevariableby in mesh');

            this.opcodeFunctions.data_changevariableby(args, util);
            this.sendVariableByOpcodeFunction(args);
        } catch (error) {
            log.error(`Failed to execute data_changevariableby: ${error}`);
        }
    }

    sendVariableByOpcodeFunction (args) {
        const stage = this.runtime.getTargetForStage();
        let variable = stage.lookupVariableById(args.VARIABLE.id);
        if (!variable) {
            variable = stage.lookupVariableByNameAndType(args.VARIABLE.name, Variable.SCALAR_TYPE);
        }
        if (!variable) {
            return;
        }

        this.meshService.sendRTCVariableMessage(variable.name, variable.value);
    }

    setVariableFunctionHOC () {
        const stage = this.runtime.getTargetForStage();
        this.variableFunctions = {
            runtime: {
                createNewGlobalVariable: this.runtime.createNewGlobalVariable.bind(this.runtime)
            },
            stage: {
                lookupOrCreateVariable: stage.lookupOrCreateVariable.bind(stage),
                createVariable: stage.createVariable.bind(stage),
                setVariableValue: stage.setVariableValue.bind(stage),
                renameVariable: stage.renameVariable.bind(stage)
            }
        };

        this.runtime.createNewGlobalVariable = this.createNewGlobalVariable.bind(this);

        stage.lookupOrCreateVariable = this.lookupOrCreateVariable.bind(this);
        stage.createVariable = this.createVariable.bind(this);
        stage.setVariableValue = this.setVariableValue.bind(this);
        stage.renameVariable = this.renameVariable.bind(this);
    }

    createNewGlobalVariable (variableName, optVarId, optVarType) {
        log.log('runtime.createNewGlobalVariable in mesh');

        const variable = this.variableFunctions.runtime.createNewGlobalVariable(variableName, optVarId, optVarType);
        if (variable.type === Variable.SCALAR_TYPE) {
            this.meshService.sendRTCVariableMessage(variable.name, variable.value);
        }
        return variable;
    }

    lookupOrCreateVariable (id, name) {
        log.log('stage.lookupOrCreateVariable in mesh');

        const stage = this.runtime.getTargetForStage();
        let variable = stage.lookupVariableById(id);
        if (variable) return variable;

        variable = stage.lookupVariableByNameAndType(name, Variable.SCALAR_TYPE);
        if (variable) return variable;

        // No variable with this name exists - create it locally.
        const newVariable = new Variable(id, name, Variable.SCALAR_TYPE, false);
        stage.variables[id] = newVariable;
        this.meshService.sendRTCVariableMessage(newVariable.name, newVariable.value);
        return newVariable;
    }

    createVariable (id, name, type, isCloud) {
        log.log('stage.createVariable in mesh');

        const stage = this.runtime.getTargetForStage();
        if (!stage.variables.hasOwnProperty(id)) {
            this.variableFunctions.stage.createVariable(id, name, type, isCloud);
            if (type === Variable.SCALAR_TYPE) {
                const variable = stage.variables[id];
                this.meshService.sendRTCVariableMessage(variable.name, variable.value);
            }
        }
    }

    setVariableValue (id, newValue) {
        log.log('stage.setVariableValue in mesh');

        const stage = this.runtime.getTargetForStage();
        if (stage.variables.hasOwnProperty(id)) {
            const variable = stage.variables[id];
            if (variable.id === id) {
                this.variableFunctions.stage.setVariableValue(id, newValue);
                if (variable.type === Variable.SCALAR_TYPE) {
                    this.meshService.sendRTCVariableMessage(variable.name, variable.value);
                }
            }
        }
    }

    renameVariable (id, newName) {
        log.log('stage.renameVariable in mesh');

        const stage = this.runtime.getTargetForStage();
        if (stage.variables.hasOwnProperty(id)) {
            const variable = stage.variables[id];
            if (variable.id === id) {
                this.variableFunctions.stage.renameVariable(id, newName);
                if (variable.type === Variable.SCALAR_TYPE) {
                    this.meshService.sendRTCVariableMessage(variable.name, variable.value);
                }
            }
        }
    }
}

module.exports = Scratch3MeshBlocks;
