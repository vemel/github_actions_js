import { decapitalize, getVersionString } from "../src/utils";

test("decapitalize", async () => {
    expect(decapitalize("")).toBe("");
    expect(decapitalize("name")).toBe("name");
    expect(decapitalize("NAME")).toBe("nAME");
});

test("get version string", () => {
    expect(getVersionString() === "unknown").toBeFalsy();
});
