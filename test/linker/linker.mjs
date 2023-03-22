import fs from 'fs';
import path from "path";
import { expect } from "chai";
import PyatchLinker from '../../src/linker/pyatch-linker.mjs';
const linker = new PyatchLinker();

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe("Pyatch File Linker", function() {
  describe("Generates executable code from Python-Target dicts", function() {
    it("1 target, 1 line of code, 1 thread", function() {
        const targetCode = {
            target1: ['move(10)']
        }
        const file = path.join(__dirname, "./", "expected/simple-code-link-expected.py");
        const expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [targetArr, code] = linker.generatePython(targetCode)

        expect(targetArr).to.deep.equal(['target1']);
        expect(code).to.equal(expected);
    });

    it("1 target, 1 line of code, 2 threads", function() {
        const targetCode = {
            target1: ['goTo("target1")', 'move(10)']
        }
        const file = path.join(__dirname, "./", "expected/single-target-multithread-code-link-expected.py");
        const expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [targetArr, code] = linker.generatePython(targetCode)

        expect(targetArr).to.deep.equal(['target1']);
        expect(code).to.equal(expected);
    });

    it("2 target, 1 line of code, 2 threads", function() {
        const targetCode = {
            target1: ['move(10)', 'goToXY(10, 10)'],
            target2: ['goTo("target2")', 'turnRight(90)'],
        }

        let file = path.join(__dirname, "./", "expected/multi-target-multithread-code-link-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [targetArr, code] = linker.generatePython(targetCode)

        expect(targetArr).to.deep.equal(['target1', 'target2']);
        expect(code).to.equal(expected);
    });

    it("1 target, 2 line of code, 1 threads", function() {
        const targetCode = {
            target1: ['goTo("target1")\nmove(10)']
        }
        let file = path.join(__dirname, "./", "expected/multiline-code-link-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [targetArr, code] = linker.generatePython(targetCode)

        expect(targetArr).to.deep.equal(['target1']);
        expect(code).to.equal(expected);
    });
  });
});