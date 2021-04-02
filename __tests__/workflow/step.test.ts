import { Step } from "./../../src/workflow/step";

describe("test", () => {
    test("create", () => {
        const step = new Step({
            id: "stepid",
            name: "stepname",
            if: "condition"
        });
        expect(step.id).toBe("stepid");
        expect(step.name).toBe("stepname");
        expect(new Step({ key: "value" }).name).toBe("unnamed");
        expect(new Step({ name: "test" }).name).toBe("test");
        expect(new Step({ id: "test" }).name).toBe("test");
    });
    test("is managed", () => {
        expect(new Step({}).isManaged()).toBeFalsy();
        expect(
            new Step({ with: { "github-actions-managed": false } }).isManaged()
        ).toBeFalsy();
        expect(
            new Step({ with: { "github-actions-managed": true } }).isManaged()
        ).toBeTruthy();
        expect(
            new Step({
                run: "\n\n# github-actions-managed: true\n"
            }).isManaged()
        ).toBeTruthy();
        expect(
            new Step({
                with: { script: "// github-actions-managed: true\n" }
            }).isManaged()
        ).toBeTruthy();
    });
    test("make managed", () => {
        expect(new Step({ id: "myid" }).makeManaged().data).toEqual({
            id: "myid",
            with: { "github-actions-managed": true }
        });
        expect(
            new Step({
                run: "\n\n# github-actions-managed: true\n"
            }).makeManaged().data
        ).toEqual({
            run: "\n\n# github-actions-managed: true\n"
        });
        expect(
            new Step({
                run: "myline"
            }).makeManaged().data
        ).toEqual({
            run: "# github-actions-managed: true\nmyline"
        });
        expect(
            new Step({
                run: "myline\nother"
            }).makeManaged().data
        ).toEqual({
            run: "# github-actions-managed: true\nmyline\nother"
        });
        expect(
            new Step({
                with: { script: "\nmyline\n  other" }
            }).makeManaged().data
        ).toEqual({
            with: {
                script: "// github-actions-managed: true\nmyline\n  other"
            }
        });
    });
});
