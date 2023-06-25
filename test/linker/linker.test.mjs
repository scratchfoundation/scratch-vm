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
            const file = path.join(__dirname, "./", "expected/simple-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const code = linker.generatePython("id_0", "move(10)");

            expect(code).to.equal(expected);
        });

        it("2 line of code, 1 thread", () => {
            const file = path.join(__dirname, "./", "expected/multiline-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const code = linker.generatePython("id_0", `goTo("target1")\nmove(10)`);

            expect(code).to.equal(expected);
        });

        it("2 lines of code nested, 1 thread", () => {
            const inputFile = path.join(__dirname, "./", "input", "while-loop.py");
            const script = fs.readFileSync(inputFile, "utf8", (err, data) => data);

            const file = path.join(__dirname, "./", "expected", "while-loop-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const code = linker.generatePython("id_0", script);

            expect(code).to.equal(expected);
        });
        /*
        it("1 line of code, 1 thread and Global Variable String", () => {
            const globalVariables = {
                globalName1: "value",
            };

            const threadCode = {
                event_whenflagclicked: {
                    id_0: "move(10)",
                },
            };

            const file = path.join(__dirname, "expected", "global-string-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(threadCode, globalVariables);

            expect(threads).to.deep.equal({ event_whenflagclicked: ["id_0"] });
            expect(code).to.equal(expected);
        });

        it("1 line of code, 1 thread and Global Variable Number", () => {
            const globalVariables = {
                globalName1: 12.1,
            };

            const threadCode = {
                event_whenflagclicked: {
                    id_0: "move(10)",
                },
            };

            const file = path.join(__dirname, "expected", "global-number-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(threadCode, globalVariables);

            expect(threads).to.deep.equal({ event_whenflagclicked: ["id_0"] });
            expect(code).to.equal(expected);
        });
        */
        it("No code, 1 thread", () => {
            const file = path.join(__dirname, "expected", "no-code-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const code = linker.generatePython("id_0", "");

            expect(code).to.equal(expected);
        });

        it("1 target, 1 line of code pre awaited, 1 thread", () => {
            const file = path.join(__dirname, "expected", "simple-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const code = linker.generatePython("id_0", "await move(10)");

            expect(code).to.equal(expected);
        });
    });
});
