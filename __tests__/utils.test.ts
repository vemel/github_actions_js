import { decapitalize, getVersionString, joinURL } from "../src/utils";

test("decapitalize", async () => {
    expect(decapitalize("")).toBe("");
    expect(decapitalize("name")).toBe("name");
    expect(decapitalize("NAME")).toBe("nAME");
});

test("join url", async () => {
    expect(joinURL("https://example.com/old", "new")).toBe(
        "https://example.com/new"
    );
    expect(joinURL("https://example.com/test/old", "new")).toBe(
        "https://example.com/test/new"
    );
    expect(joinURL("https://example.com/test/", "new")).toBe(
        "https://example.com/test/new"
    );
    expect(joinURL("https://username:password@example.com/test/", "new")).toBe(
        "https://username:password@example.com/test/new"
    );
});

test("get version string", () => {
    expect(getVersionString() === "unknown").toBeFalsy();
});
