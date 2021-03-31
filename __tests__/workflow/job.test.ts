import { Job } from "../../src/workflow/job";
import { Step } from "../../src/workflow/step";

describe("job", () => {
    const job = new Job({
        "runs-on": "runner",
        strategy: { matrix: [1, 2, 3] },
        env: { key: "value" },
        if: "cond",
        steps: [{}]
    });

    test("create", () => {
        expect(job.runsOn).toBe("runner");
        job.runsOn = job.runsOn;

        expect(job.runsIf).toBe("cond");
        job.runsIf = job.runsIf;

        expect(job.env).toEqual({ key: "value" });
        job.env = job.env;

        expect(job.strategy).toEqual({ matrix: [1, 2, 3] });
        job.strategy = job.strategy;

        expect(job.steps.length).toBe(1);
        job.steps = job.steps;
    });

    test("merge steps", () => {
        job.steps = [];
        let steps = [new Step({ id: "remote1" })];
        expect(job.mergeSteps(steps).map(i => i.data)).toEqual([
            { id: "remote1" }
        ]);

        job.steps = [new Step({ name: "local1" })];
        expect(job.mergeSteps(steps).map(i => i.data)).toEqual([
            { name: "local1" },
            { id: "remote1" }
        ]);

        job.steps = [
            new Step({
                id: "remote1",
                run: "\n\n  # github-actions-managed: true \n\nkey: local"
            }),
            new Step({
                id: "local11",
                with: { "github-actions-managed": true, key: "local" }
            }),
            new Step({
                id: "local12",
                with: { "github-actions-managed": true, key: "local" }
            }),
            new Step({
                id: "remote2",
                with: { "github-actions-managed": false, key: "local" }
            }),
            new Step({
                id: "local21",
                with: { "github-actions-managed": false, key: "local" }
            }),
            new Step({
                id: "local22",
                with: { "github-actions-managed": true, key: "local" }
            }),
            new Step({
                id: "remote3",
                with: { "github-actions-managed": true, key: "local" }
            })
        ];
        steps = [
            new Step({
                id: "remote1",
                run: "\n# github-actions-managed: true\nkey: remote"
            }),
            new Step({
                id: "remote2",
                with: { "github-actions-managed": true, key: "remote" }
            }),
            new Step({
                id: "remote21",
                with: { "github-actions-managed": true, key: "remote" }
            }),
            new Step({
                id: "remote3",
                with: { "github-actions-managed": true, key: "remote" }
            })
        ];
        expect(job.mergeSteps(steps).map(i => i.data)).toEqual([
            {
                id: "remote1",
                run: "\n# github-actions-managed: true\nkey: remote"
            },
            {
                id: "remote2",
                with: {
                    "github-actions-managed": false,
                    key: "local"
                }
            },
            {
                id: "local21",
                with: {
                    "github-actions-managed": false,
                    key: "local"
                }
            },
            {
                id: "remote21",
                with: {
                    "github-actions-managed": true,
                    key: "remote"
                }
            },
            {
                id: "remote3",
                with: {
                    "github-actions-managed": true,
                    key: "remote"
                }
            }
        ]);
    });
});
