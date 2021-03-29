import yaml from "js-yaml";

import {
    getWorkflowChecks,
    isStepManaged,
    makeStepManaged,
    mergeWorkflows
} from "../src/sanitizer";
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
        {
            action: "add",
            stepName: "remote1",
            step: {
                id: "remote1",
                with: {
                    "github-actions-managed": true
                }
            }
        }
    ]);

    localJob.steps = [{ name: "local1" }];
    remoteJob.steps = [{ id: "remote1" }];
    expect(mergeWorkflows(local, remote)).toEqual([
        { action: "local", stepName: "local1", step: { name: "local1" } },
        {
            action: "add",
            stepName: "remote1",
            step: {
                id: "remote1",
                with: {
                    "github-actions-managed": true
                }
            }
        }
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

test("get workflow checks env", async () => {
    const localJob: Job = {
        "runs-on": "localrunner",
        env: { key: "local" },
        steps: []
    };
    const remoteJob: Job = {
        "runs-on": "remoterunner",
        env: { key: "remote" },
        steps: []
    };
    const local: Workflow = {
        name: "local",
        jobs: { test: localJob }
    };
    const remote: Workflow = {
        name: "remote",
        jobs: { test: remoteJob }
    };

    expect(getWorkflowChecks(yaml.dump(local), yaml.dump(local))).toEqual([]);
    expect(getWorkflowChecks(yaml.dump(local), yaml.dump(remote))).toEqual([
        {
            checkMessage: "will be updated to remote",
            highlight: "remote",
            item: "name",
            level: "update",
            noForceMessage: "is different from remote",
            updateMessage: "updated to remote"
        },
        {
            checkMessage: "will be updated",
            highlight: "updated",
            item: "job environment",
            level: "update",
            noForceMessage: "is different from remote",
            updateMessage: "updated"
        },
        {
            checkMessage: "will be updated",
            highlight: "updated",
            item: "runner",
            level: "update",
            noForceMessage: "is different from remote",
            updateMessage: "updated"
        }
    ]);
});

test("is step managed", () => {
    expect(isStepManaged({ id: "remote1" })).toBeFalsy();
    expect(
        isStepManaged({
            id: "remote1",
            run: "\n# github-actions-managed: false"
        })
    ).toBeFalsy();
    expect(
        isStepManaged({
            id: "remote1",
            run: "\ntest\n# github-actions-managed: true"
        })
    ).toBeTruthy();
    expect(
        isStepManaged({
            id: "remote1",
            with: { script: "\n// github-actions-managed: true\ntest" }
        })
    ).toBeTruthy();
    expect(
        isStepManaged({
            id: "remote1",
            with: {
                "github-actions-managed": true
            }
        })
    ).toBeTruthy();
});

test("make step managed", () => {
    expect(makeStepManaged({ id: "remote1" })).toEqual({
        id: "remote1",
        with: { "github-actions-managed": true }
    });
    expect(
        makeStepManaged({
            id: "remote1",
            run: "\n# github-actions-managed: false"
        })
    ).toEqual({
        id: "remote1",
        run: "\n# github-actions-managed: true\n# github-actions-managed: false"
    });
    expect(
        makeStepManaged({
            id: "remote1",
            run: "test"
        })
    ).toEqual({
        id: "remote1",
        run: "\n# github-actions-managed: true\ntest"
    });
    expect(
        makeStepManaged({
            id: "remote1",
            with: { script: "\ntest" }
        })
    ).toEqual({
        id: "remote1",
        with: { script: "\n// github-actions-managed: true\ntest" }
    });
    expect(
        makeStepManaged({
            id: "remote1",
            with: { script: "\n// github-actions-managed: true\ntest" }
        })
    ).toEqual({
        id: "remote1",
        with: { script: "\n// github-actions-managed: true\ntest" }
    });
});
