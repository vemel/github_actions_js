import { Job } from "../../src/workflow/job.js";
import { Workflow } from "../../src/workflow/workflow.js";

const renderResult = `# comment
#
# line2

name: workflow
"on":
  event: {}
jobs:
  main:
    runs-on: runner
    env:
      key: value
    if: cond
    steps:
      - {}
`;

describe("workflow", () => {
    const workflow = new Workflow(
        {
            name: "workflow",
            on: { event: {} },
            jobs: {
                main: {
                    "runs-on": "runner",
                    env: { key: "value" },
                    if: "cond",
                    steps: [{}]
                }
            }
        },
        ["comment", "", "line2"]
    );
    test("create", () => {
        const clone = workflow.clone();
        expect(clone.name).toBe("workflow");
        clone.name = "test";

        expect(clone.triggers).toEqual({ event: {} });
        clone.triggers = {};

        expect(clone.commentLines).toEqual(["comment", "", "line2"]);
        clone.commentLines = [];
        expect(clone.jobNames).toEqual(["main"]);
        expect(clone.jobs.length).toBe(1);

        expect(
            new Workflow(
                {
                    name: "test",
                    jobs: {
                        test: {
                            "runs-on": "ubuntu:latest",
                            steps: []
                        }
                    }
                },
                []
            ).getJob("test").data
        ).toEqual({
            "runs-on": "ubuntu:latest",
            steps: []
        });
        expect(clone.getJob("main").steps.length).toBe(1);
        clone.setJob(new Job("main", { "runs-on": "test", steps: [] }));
        new Workflow({ name: "test" }, []).setJob(
            new Job("main", { "runs-on": "test", steps: [] })
        );
        clone.deleteJob("main");
        expect(() => new Workflow({ name: "test" }, []).getJob("main")).toThrow(
            Error
        );
    });

    test("render", () => {
        expect(workflow.render()).toBe(renderResult);
    });
    test("from string", () => {
        Workflow.fromString(renderResult);
    });
    test("clone", () => {
        expect(workflow.clone().name).toBe("workflow");
    });
});
