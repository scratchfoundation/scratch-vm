/**
 * Escape a string to be safe to use in XML content.
 * CC-BY-SA: hgoebl
 * https://stackoverflow.com/questions/7918868/
 * how-to-escape-xml-entities-in-javascript
 * @param {!string} unsafe Unsafe string.
 * @return {string} XML-escaped string, for use within an XML tag.
 */
const xmlEscape = function (unsafe) {
    // eslint-disable-next-line no-control-regex
    return unsafe.replace(/[<>&'"\u0008]/g, c => {
        switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        case '\u0008': return '';
        }
    });
};

module.exports = xmlEscape;
