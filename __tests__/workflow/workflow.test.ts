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
        expect(workflow.triggers).toEqual({ event: {} });
        expect(workflow.commentLines).toEqual(["comment", "", "line2"]);
        expect(workflow.job.steps.length).toBe(1);
    });

    test("render", () => {
        expect(workflow.render()).toBe(renderResult);
    });
});
