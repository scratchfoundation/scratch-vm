/**
 * @typedef {object} MessageDescriptor
 * @property {string} id - the translator-friendly unique ID of this message.
 * @property {string} default - the message text in the default language (English).
 * @property {string} [description] - a description of this message to help translators understand the context.
 */

/**
 * This is a hook for extracting messages from extension source files.
 * This function simply returns the message descriptor map object that's passed in.
 * @param {object.<MessageDescriptor>} messages - the messages to be defined
 * @return {object.<MessageDescriptor>} - the input, unprocessed
 */
const defineMessages = function (messages) {
    return messages;
};

module.exports = defineMessages;
