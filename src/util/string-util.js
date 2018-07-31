class StringUtil {
    static withoutTrailingDigits (s) {
        let i = s.length - 1;
        while ((i >= 0) && ('0123456789'.indexOf(s.charAt(i)) > -1)) i--;
        return s.slice(0, i + 1);
    }

    static unusedName (name, existingNames) {
        if (existingNames.indexOf(name) < 0) return name;
        name = StringUtil.withoutTrailingDigits(name);
        let i = 2;
        while (existingNames.indexOf(name + i) >= 0) i++;
        return name + i;
    }

    /**
     * Split a string on the first occurrence of a split character.
     * @param {string} text - the string to split.
     * @param {string} separator - split the text on this character.
     * @returns {string[]} - the two parts of the split string, or [text, null] if no split character found.
     * @example
     * // returns ['foo', 'tar.gz']
     * splitFirst('foo.tar.gz', '.');
     * @example
     * // returns ['foo', null]
     * splitFirst('foo', '.');
     * @example
     * // returns ['foo', '']
     * splitFirst('foo.', '.');
     */
    static splitFirst (text, separator) {
        const index = text.indexOf(separator);
        if (index >= 0) {
            return [text.substring(0, index), text.substring(index + 1)];
        }
        return [text, null];
        
    }
}

module.exports = StringUtil;
