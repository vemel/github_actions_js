import { isFileURL, isGitHubURL, joinURL, replaceRef } from "../src/urlUtils";

test("join url", () => {
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

test("is GitHub URL", () => {
    expect(isGitHubURL("https://google.com")).toBe(false);
    expect(isGitHubURL("https://github.com")).toBe(true);
    expect(isGitHubURL("https://github.com/user/repo")).toBe(true);
});

test("is file URL", () => {
    expect(isFileURL("https://google.com")).toBe(false);
    expect(isFileURL("https://github.com")).toBe(false);
    expect(isFileURL("file:///home/user/")).toBe(true);
});

test("replace ref", () => {
    expect(replaceRef("https://google.com", "newref")).toBe(
        "https://google.com"
    );
    expect(replaceRef("file:///my/ref", "newref")).toBe("file:///my/ref");
    expect(
        replaceRef(
            "https://github.com/psf/black/tree/master/.github/workflows",
            "newref"
        )
    ).toBe("https://github.com/psf/black/tree/newref/.github/workflows");
});
