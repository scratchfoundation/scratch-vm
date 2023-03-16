const fs = require('fs');
const path = require("path");
const expect = require("chai").expect;
const PyatchLinker = require('../src/index.js');
const linker = new PyatchLinker();

describe("Pyatch File Linker", function() {
  describe("Generates executable code from Python-Target dicts", function() {
    it("1 target, 1 line of code, 1 thread", function() {
        let target1 = {
            id: 'target1',
            code: ['say("Hello World!")']
        }
        let file = path.join(__dirname, "./", "expected/simple-code-link-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        expect(linker.generatePython(target1)).to.equal(expected);
    });

    it("1 target, 1 line of code, 2 threads", function() {
        const target1 = {
            id: 'target1',
            code: ['say("Hello World!")', 'move(10)']
        }
        let file = path.join(__dirname, "./", "expected/single-target-multithread-code-link-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        expect(linker.generatePython(target1)).to.equal(expected);
    });

    it("2 target, 1 line of code, 2 threads", function() {
        const target1 = {
            id: 'target1',
            code: ['say("Hello World!")', 'move(10)']
        }
        const target2 = {
            id: 'target2',
            code: ['think("Hello Universe!")', 'move(5)']
        }
        let file = path.join(__dirname, "./", "expected/multi-target-multithread-code-link-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        expect(linker.generatePython(target1, target2)).to.equal(expected);
    });

    it("1 target, 2 line of code, 1 threads", function() {
        const target1 = {
            id: 'target1',
            code: ['say("Hello World!")\nmove(10)']
        }
        let file = path.join(__dirname, "./", "expected/multiline-code-link-expected.py");
        let expected = fs.readFileSync(file, "utf8", function(err, data) {return data});

        expect(linker.generatePython(target1)).to.equal(expected);
    });
  });
});