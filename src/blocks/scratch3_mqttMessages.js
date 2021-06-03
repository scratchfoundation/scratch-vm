const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const convertBase = new convert();
const Color = require('../util/color');
const Timer = require('../util/timer');
const VM = require('../virtual-machine');


class Scratch3MqttMessages {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        
        this.runtime.on('MQTT_PUB_TO_BROADCAST_MSG', (broadcastVar, data) => {
            this.makeBroadcastMsg(broadcastVar, data);
        });

    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            messages_sendValueToTopic: this.sendValueToTopic,
            messages_addSubscription: this.addSubscription,
            messages_deleteSubscriptions: this.deleteSubscriptions
        };
    }

    sendValueToTopic (args, util) {
        if (    args.TOPIC === '' ||
                args.TOPIC === 'topic' ||
                args.VALUE === '' ||
                args.VALUE === 'value') {
            return;
        }
        const topic = args.TOPIC.split('/');
        const value = args.VALUE;
        const last = topic.length - 1;
        const action = topic[last];
        this.runtime.emit('SEND_BROADCAST', {
            topic: args.TOPIC,
            action: action,
            value: value
        });
    }

    addSubscription (args, util) {
        if (args) {
            this.runtime.emit('ADD_MQTT_SUBSCRIPTION', args.TOPIC);
        }
        this.runtime.on('MQTT_INBOUND', topic => {
            util.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: topic
            });
        });
    }

    deleteSubscriptions () {
        this.runtime.emit('DELETE_ALL_USER_MQTT_SUBSCRIPTIONS');
    }

    makeBroadcastMsg (broadcastVar, data) {
        const topic = broadcastVar.name;
        if (data.payload === '1') {
            this.runtime.emit('MQTT_INBOUND', topic);
        }
    }
}

module.exports = Scratch3MqttMessages;
