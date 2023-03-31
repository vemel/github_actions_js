import { Step } from "./../../src/workflow/step.js";

describe("step", () => {
    test("create", () => {
        const step = new Step({
            id: "stepid",
            name: "stepname",
            if: "condition",
            uses: "using@v1"
        });
        expect(step.id).toBe("stepid");
        expect(step.name).toBe("stepname");
        expect(step.uses).toBe("using");
        expect(new Step({ key: "value" }).name).toBe(null);
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
        expect(
            new Step({
                with: { "github-actions-managed": false },
                name: "test"
            }).makeManaged().data
        ).toEqual({
            with: { "github-actions-managed": true },
            name: "test"
        });
    });

    test("make non managed", () => {
        expect(
            new Step({
                run: "# github-actions-managed: true\nmyline"
            }).makeNonManaged().data
        ).toEqual({
            run: "myline"
        });

        expect(
            new Step({
                with: {
                    script: "// github-actions-managed: true\nmyline\n  other",
                    "github-actions-managed": true
                }
            }).makeNonManaged().data
        ).toEqual({
            with: { script: "myline\n  other" }
        });

        expect(
            new Step({
                run: "myline\nother"
            }).makeNonManaged().data
        ).toEqual({
            run: "myline\nother"
        });
    });

    test("clone", () => {
        const step = new Step({ id: "test", with: { script: "asd" } });
        expect(step.clone().id).toBe("test");
    });

    test("equals", () => {
        const step = new Step({
            run: "# github-actions-managed: true\nmyline"
        });
        expect(step.equals(step.clone())).toBeTruthy();
        expect(step.equals(new Step({}))).toBeFalsy();
    });

    test("is same", () => {
        expect(
            new Step({
                id: "test",
                name: "test2"
            }).isSame(
                new Step({
                    id: "test",
                    name: "test3"
                })
            )
        ).toBeTruthy();
        expect(
            new Step({
                name: "test2"
            }).isSame(
                new Step({
                    name: "test2"
                })
            )
        ).toBeTruthy();
        expect(
            new Step({
                name: "test2",
                uses: "checkout@v2"
            }).isSame(
                new Step({
                    uses: "checkout@v3"
                })
            )
        ).toBeTruthy();
        expect(
            new Step({
                name: "test2",
                uses: "checkout@v2"
            }).isSame(
                new Step({
                    name: "test3",
                    uses: "checkout@v3"
                })
            )
        ).toBeFalsy();
        expect(new Step({}).isSame(new Step({}))).toBeTruthy();
        expect(
            new Step({}).isSame(
                new Step({ with: { "github-actions-managed": true } })
            )
        ).toBeTruthy();
    });
});
