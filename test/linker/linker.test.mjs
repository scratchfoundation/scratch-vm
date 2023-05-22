import fs from "fs";
import path from "path";
import { expect } from "chai";
import * as url from "url";
import PyatchLinker from "../../src/linker/pyatch-linker.mjs";

const linker = new PyatchLinker();
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

describe("Pyatch File Linker", () => {
    describe("Generates executable code from Python-Target dicts", () => {
        it("1 target, 1 line of code, 1 thread", () => {
            const threadCode = {
                id_0: "move(10)",
            };
            const file = path.join(__dirname, "./", "expected/simple-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [threads, code] = linker.generatePython(threadCode);

            expect(threads).to.deep.equal(["id_0"]);
            expect(code).to.equal(expected);
        });

        it("1 line of code, 4 threads", () => {
            const threadCode = {
                id_0: "move(10)",
                id_1: "goToXY(10, 10)",
                id_2: 'goTo("target2")',
                id_3: "turnRight(90)",
            };

            const file = path.join(__dirname, "./", "expected/multithread-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [threads, code] = linker.generatePython(threadCode);

            expect(threads).to.deep.equal(["id_0", "id_1", "id_2", "id_3"]);
            expect(code).to.equal(expected);
        });

        it("2 line of code, 1 thread", () => {
            const threadCode = {
                id_0: 'goTo("target1")\nmove(10)',
            };
            const file = path.join(__dirname, "./", "expected/multiline-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [threads, code] = linker.generatePython(threadCode);

            expect(threads).to.deep.equal(["id_0"]);
            expect(code).to.equal(expected);
        });

        it("2 lines of code nested, 1 thread", () => {
            const inputFile = path.join(__dirname, "./", "input", "while-loop.py");
            const inputStr = fs.readFileSync(inputFile, "utf8", (err, data) => data);
            const threadCode = {
                id_0: inputStr,
            };
            const file = path.join(__dirname, "./", "expected", "while-loop-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [threads, code] = linker.generatePython(threadCode);

            expect(threads).to.deep.equal(["id_0"]);
            expect(code).to.equal(expected);
        });
    });
});
