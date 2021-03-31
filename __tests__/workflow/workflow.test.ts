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
        expect(workflow.name).toBe("workflow");
        workflow.name = workflow.name;

        expect(workflow.triggers).toEqual({ event: {} });
        workflow.triggers = workflow.triggers;

        expect(workflow.commentLines).toEqual(["comment", "", "line2"]);
        workflow.commentLines = workflow.commentLines;

        expect(new Workflow({ name: "test" }, []).job.data).toEqual({
            "runs-on": "ubuntu:latest",
            steps: []
        });
        expect(workflow.job.steps.length).toBe(1);
        workflow.job = workflow.job;
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
