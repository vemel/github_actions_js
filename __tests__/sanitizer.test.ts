import { mergeWorkflows } from "../src/sanitizer";
import { Job, Workflow } from "../src/workflow";

test("merge workflows", async () => {
    const localJob: Job = { "runs-on": "", steps: [] };
    const remoteJob: Job = { "runs-on": "", steps: [] };
    const local: Workflow = {
        name: "local",
        jobs: { test: localJob }
    };
    const remote: Workflow = {
        name: "remote",
        jobs: { test: remoteJob }
    };

    localJob.steps = [];
    remoteJob.steps = [{ id: "remote1" }];
    expect(mergeWorkflows(local, remote)).toEqual([
        { action: "add", stepName: "remote1", step: { id: "remote1" } }
    ]);

    localJob.steps = [{ name: "local1" }];
    remoteJob.steps = [{ id: "remote1" }];
    expect(mergeWorkflows(local, remote)).toEqual([
        { action: "local", stepName: "local1", step: { name: "local1" } },
        { action: "add", stepName: "remote1", step: { id: "remote1" } }
    ]);

    localJob.steps = [
        {
            id: "remote1",
            run: "\n\n  # github-actions-managed: true \n\nkey: local"
        },
        {
            id: "local11",
            with: { "github-actions-managed": true, key: "local" }
        },
        {
            id: "local12",
            with: { "github-actions-managed": true, key: "local" }
        },
        {
            id: "remote2",
            with: { "github-actions-managed": false, key: "local" }
        },
        {
            id: "local21",
            with: { "github-actions-managed": false, key: "local" }
        },
        {
            id: "local22",
            with: { "github-actions-managed": true, key: "local" }
        },
        {
            id: "remote3",
            with: { "github-actions-managed": true, key: "local" }
        }
    ];
    remoteJob.steps = [
        {
            id: "remote1",
            run: "\n# github-actions-managed: true\nkey: remote"
        },
        {
            id: "remote2",
            with: { "github-actions-managed": true, key: "remote" }
        },
        {
            id: "remote21",
            with: { "github-actions-managed": true, key: "remote" }
        },
        {
            id: "remote3",
            with: { "github-actions-managed": true, key: "remote" }
        }
    ];
    expect(mergeWorkflows(local, remote)).toEqual([
        {
            action: "update",
            stepName: "remote1",
            step: {
                id: "remote1",
                run: "\n# github-actions-managed: true\nkey: remote"
            }
        },
        {
            action: "delete",
            stepName: "local11",
            step: {
                id: "local11",
                with: {
                    "github-actions-managed": true,
                    key: "local"
                }
            }
        },
        {
            action: "delete",
            stepName: "local12",
            step: {
                id: "local12",
                with: {
                    "github-actions-managed": true,
                    key: "local"
                }
            }
        },
        {
            action: "keep",
            stepName: "remote2",
            step: {
                id: "remote2",
                with: {
                    "github-actions-managed": false,
                    key: "local"
                }
            }
        },
        {
            action: "local",
            stepName: "local21",
            step: {
                id: "local21",
                with: {
                    "github-actions-managed": false,
                    key: "local"
                }
            }
        },
        {
            action: "delete",
            stepName: "local22",
            step: {
                id: "local22",
                with: {
                    "github-actions-managed": true,
                    key: "local"
                }
            }
        },
        {
            action: "add",
            stepName: "remote21",
            step: {
                id: "remote21",
                with: {
                    "github-actions-managed": true,
                    key: "remote"
                }
            }
        },
        {
            action: "update",
            stepName: "remote3",
            step: {
                id: "remote3",
                with: {
                    "github-actions-managed": true,
                    key: "remote"
                }
            }
        }
    ]);
});
