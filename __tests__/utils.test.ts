import fs from "fs";

import {
    decapitalize,
    getCommandArgs,
    getCommandName,
    getTempDir,
    getVersionString,
    yamlDump
} from "../src/utils";

test("decapitalize", async () => {
    expect(decapitalize("")).toBe("");
    expect(decapitalize("name")).toBe("name");
    expect(decapitalize("NAME")).toBe("nAME");
});

test("get version string", () => {
    expect(getVersionString() === "unknown").toBeFalsy();
});

test("get command name", () => {
    expect(getCommandName()).toBeTruthy();
    getCommandArgs();
});

test("get temp dir", () => {
    const tempDir = getTempDir();
    fs.rmSync(tempDir, { recursive: true, force: true });
});

test("yaml dump", () => {
    expect(yamlDump([1, 2, 3])).toBe("- 1\n- 2\n- 3\n");
});
