import { getLocalPath } from "../src/manager";

test("get local path", async () => {
    expect(getLocalPath("name")).toBe(".github/workflows/name.yml");
});
