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
            const executionObj = {
                event_whenflagclicked: {
                    id_0: "move(10)",
                },
            };
            const file = path.join(__dirname, "./", "expected/simple-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(executionObj);

            expect(threads).to.deep.equal({ event_whenflagclicked: ["id_0"] });
            expect(code).to.equal(expected);
        });

        it("1 target, 1 line of code, 1 thread w/ option", () => {
            const executionObj = {
                event_whenbroadcastreceived: {
                    message1: {
                        id_0: "move(10)",
                    },
                },
            };
            const file = path.join(__dirname, "./", "expected/simple-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(executionObj);

            expect(threads).to.deep.equal({ event_whenbroadcastreceived: { message1: ["id_0"] } });
            expect(code).to.equal(expected);
        });

        it("1 line of code, 4 threads", () => {
            const executionObj = {
                event_whenflagclicked: {
                    id_0: "move(10)",
                    id_1: "goToXY(10, 10)",
                    id_2: 'goTo("target2")',
                    id_3: "turnRight(90)",
                },
            };

            const file = path.join(__dirname, "./", "expected/multithread-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(executionObj);

            expect(threads).to.deep.equal({ event_whenflagclicked: ["id_0", "id_1", "id_2", "id_3"] });
            expect(code).to.equal(expected);
        });

        it("1 line of code, 4 threads, 2 events", () => {
            const executionObj = {
                event_whenflagclicked: {
                    id_0: "move(10)",
                    id_1: "goToXY(10, 10)",
                },
                event_whenkeypressed: {
                    id_2: 'goTo("target2")',
                    id_3: "turnRight(90)",
                },
            };

            const file = path.join(__dirname, "expected", "multithread-multievent-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(executionObj);

            expect(threads).to.deep.equal({
                event_whenflagclicked: ["id_0", "id_1"],
                event_whenkeypressed: ["id_2", "id_3"],
            });
            expect(code).to.equal(expected);
        });

        it("2 line of code, 1 thread", () => {
            const executionObj = {
                event_whenflagclicked: {
                    id_0: 'goTo("target1")\nmove(10)',
                },
            };
            const file = path.join(__dirname, "./", "expected/multiline-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(executionObj);

            expect(threads).to.deep.equal({ event_whenflagclicked: ["id_0"] });
            expect(code).to.equal(expected);
        });

        it("2 lines of code nested, 1 thread", () => {
            const inputFile = path.join(__dirname, "./", "input", "while-loop.py");
            const inputStr = fs.readFileSync(inputFile, "utf8", (err, data) => data);
            const executionObj = {
                event_whenflagclicked: {
                    id_0: inputStr,
                },
            };
            const file = path.join(__dirname, "./", "expected", "while-loop-expected.py");
            const expected = fs.readFileSync(file, "utf8", (err, data) => data);

            const [code, threads] = linker.generatePython(executionObj);

            expect(threads).to.deep.equal({ event_whenflagclicked: ["id_0"] });
            expect(code).to.equal(expected);
        });

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
    });
});
