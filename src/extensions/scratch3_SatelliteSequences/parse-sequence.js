/* eslint-disable no-return-assign */
/* eslint-disable no-undef */
/* eslint-disable no-loop-func */
/* eslint-disable linebreak-style */
const original = require('./Assets/originalCostume');
const Cast = require('../../util/cast');

class Parse {

    parseSingleInput (input, prevPositions, color) {
        const newCostumeSVG = original.originalCostume;
        const copyOfCostume = {};
        Object.assign(copyOfCostume, newCostumeSVG);
        const toSplit = input.toString();
        let splitSeq = '';
        let splitLength = 0;
        let k = 0;
        if (toSplit.includes(',')) {
            splitSeq = toSplit.split(',');
            splitLength = splitSeq.length;
            while (splitLength > 0) {
                const stringToEdit = splitSeq[k].split(' ');
                const filteredString = stringToEdit.filter(e => e === 0 || e);
                theColor = filteredString.splice(1, 1);
                color = theColor;
                const positions = this.convertBase(filteredString[1]);
                const absolute = positions.map(pos => +pos + Cast.toNumber(1));
                absolute.unshift(Cast.toString(color));
                const joined = absolute.join(',');

                if (prevPositions.length > 0) {
                    let length = prevPositions.length;
                    let i = 0;
                    while (length > 0) {
                        const splitPrev = prevPositions[i].split(',');
                        const contColor = splitPrev.splice(0, 1);
                        const splitAbsolute = joined.split(',');
                        const newColor = splitAbsolute.splice(0, 1);
                        splitAbsolute.map(item => copyOfCostume[`Light${item}`] = `"#${newColor}"`);
                        splitPrev.map(item => copyOfCostume[`Light${item}`] = `"#${contColor}"`);
                        length--;
                        i++;
                    }
                } else {
                    const split = joined.split(',');
                    const currColor = split.splice(0, 1);
                    split.map(item => copyOfCostume[`Light${item}`] = `"#${currColor}"`);
                }
                prevPositions.push(joined);
                splitLength--;
                k++;
            }
        } else {
            const stringToEdit = toSplit.split(' ');
            const filteredString = stringToEdit.filter(e => e === 0 || e);
            theColor = filteredString.splice(1, 1);
            color = theColor;
            const positions = this.convertBase(filteredString[1]);
            const absolute = positions.map(pos => +pos + Cast.toNumber(1));
            absolute.unshift(Cast.toString(color));
            const joined = absolute.join(',');

            if (prevPositions.length > 0) {
                let length = prevPositions.length;
                let i = 0;
                while (length > 0) {
                    const splitPrev = prevPositions[i].split(',');
                    const contColor = splitPrev.splice(0, 1);
                    const splitAbsolute = joined.split(',');
                    const newColor = splitAbsolute.splice(0, 1);
                    splitAbsolute.map(item => copyOfCostume[`Light${item}`] = `"#${newColor}"`);
                    splitPrev.map(item => copyOfCostume[`Light${item}`] = `"#${contColor}"`);
                    length--;
                    i++;
                }
            } else {
                const split = joined.split(',');
                const currColor = split.splice(0, 1);
                split.map(item => copyOfCostume[`Light${item}`] = `"#${currColor}"`);
            }
        }
        return copyOfCostume;
    }

    convertBase (hex) {
        const convert = (baseFrom, baseTo) => number => parseInt(number, baseFrom).toString(baseTo);
        const hex2bin = convert(16, 2);
        const result = hex2bin(hex);
        let newResult = '';
        if (result.length < 16){
            newResult = result.padStart(16, 0);
        } else {
            newResult = result;
        }
        return this.tracePosition(newResult);
    }

    tracePosition (binary) {
        const binaryString = binary;
        const splittedString = binaryString.split('');
        const filtered = splittedString.filter(Number);
        let length = filtered.length;
        const tempPositions = [];
        while (length > 0) {
            const indexOfPosition = splittedString.indexOf('1');
            const value = indexOfPosition;
            splittedString.splice(indexOfPosition, 1, '0');
            tempPositions.push(value);
            length--;
        }
        return tempPositions;
    }
}

module.exports = Parse;
