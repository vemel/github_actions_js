import {
    getLocalPath,
    getRemoteURL,
    getTopCommentLines,
    renderWorkflow
} from "../src/manager";
import { Workflow } from "../src/workflow";

test("get local path", async () => {
    expect(getLocalPath("name")).toBe(".github/workflows/name.yml");
});

test("render workflow", () => {
    const workflow: Workflow = { name: "workflow" };
    expect(renderWorkflow(workflow, [])).toBe("name: workflow\n");
    expect(renderWorkflow(workflow, ["first", "", "second"])).toBe(
        "# first\n#\n# second\n\nname: workflow\n"
    );
});

test("get remote URL", () => {
    expect(getRemoteURL("workflow", "master", "my_workflows")).toBe(
        "https://raw.githubusercontent.com/vemel/github_actions_js/master/my_workflows/workflow.yml"
    );
});

test("get top comment lines", () => {
    expect(getTopCommentLines("name: workflow")).toEqual([]);
    expect(
        getTopCommentLines("# test\n#comment\n#\nname: workflow\n#  one more")
    ).toEqual(["test", "comment", "", "one more"]);
});
