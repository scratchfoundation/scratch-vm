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
}

module.exports = StringUtil;
