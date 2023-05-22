import fs from 'fs';
import path from "path";
import { expect } from "chai";
import PyatchLinker from '../../src/linker/pyatch-linker.mjs';
const linker = new PyatchLinker();

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe("Pyatch File Linker", function() {
  describe("Generates executable code from Python-Target dicts", function() {

    it("1 line of code, 4 threads", function() {
        const globalVariables= {}
        
        const threadCode = {
            'id_0': 'move(10)', 
            'id_1': 'goToXY(10, 10)',
            'id_2': 'goTo("target2")', 
            'id_3': 'turnRight(90)',
        }

        let file = path.join(__dirname, "./", "expected/multithread-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [threads, code] = linker.generatePython(threadCode, globalVariables)

        expect(threads).to.deep.equal(['id_0', 'id_1', 'id_2', 'id_3']);
        expect(code).to.equal(expected);
    });

    it("2 line of code, 1 thread", function() {
        const globalVariables= {}
        
        const threadCode = {
            'id_0': 'goTo("target1")\nmove(10)'
        }
        let file = path.join(__dirname, "./", "expected/multiline-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [threads, code] = linker.generatePython(threadCode, globalVariables)

        expect(threads).to.deep.equal(['id_0']);
        expect(code).to.equal(expected);
    });

    it("2 lines of code nested, 1 thread", function() {
        const globalVariables= {}
        let inputFile = path.join(__dirname, "./", "input", "while-loop.py");
        let inputStr = fs.readFileSync(inputFile, "utf8", function(err, data) {return data});
        const threadCode = {
            'id_0': inputStr
        }
        let file = path.join(__dirname, "./", "expected", "while-loop-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [threads, code] = linker.generatePython(threadCode, globalVariables)

        expect(threads).to.deep.equal(['id_0']);
        expect(code).to.equal(expected);
    });

    it("1 line of code, 1 thread and Global Variable", function() {
        const globalVariables = {
            'globalName1': 'value'
        }

        const threadCode = {
            'id_0': 'move(10)'
        }

        let file = path.join(__dirname, "./", "expected/simple-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        const [threads, code] = linker.generatePython(threadCode, globalVariables)

        expect(threads).to.deep.equal(['id_0']);
        expect(code).to.equal(expected);
    });
  });
});