import { Job } from "../../src/workflow/job";
import { Workflow } from "../../src/workflow/workflow";

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

        expect(new Workflow({ name: "test" }, []).job.data).toEqual({
            "runs-on": "ubuntu:latest",
            steps: []
        });
        expect(clone.job.steps.length).toBe(1);
        clone.job = new Job({ "runs-on": "test", steps: [] });
        new Workflow({ name: "test" }, []).job = workflow.job;
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
