import chalk from "chalk";
import fs from "fs";
import path from "path";

import { Namespace } from "./cli";
import { LOCAL_WORKFLOWS_PATH } from "./constants";
import {
    chooseIndex,
    confirmRerunApply,
    createWorkflowsDir,
    selectWorkflows
} from "./inquire";
import { getCheckResult, logCheck, runCheck } from "./runCheck";
import { runList, runListAll } from "./runList";
import { logUpdate, runUpdate } from "./runUpdate";
import { highlightURL } from "./urlUtils";
import { Check } from "./workflow/check";
import { WorkflowResource } from "./workflow/resource";

async function logWorkflowChecks(
    resources: Array<WorkflowResource>,
    args: Namespace
): Promise<Array<[WorkflowResource, Array<Check>]>> {
    await Promise.all(resources.map(resource => resource.getRemote()));
    const checkLists = await Promise.all(
        resources.map(resource => runCheck(resource, args.force, args.clean))
    );
    const result: Array<[WorkflowResource, Array<Check>]> = [];
    resources.forEach((resource, index) => {
        const checks = checkLists[index];
        result.push([resource, checks]);
        if (resource.existsLocally()) {
            console.log(resource.getTitle());
            checks.forEach(check => logCheck(check, args.force, args.diff));
            logCheck(getCheckResult(resource, checks, args.force));
        } else {
            runList(resource, resource.getRemoteCached());
        }
    });
    return result;
}

function logWorkflowUpdates(
    resource: WorkflowResource,
    checks: Array<Check>,
    forceUpdate: boolean
) {
    console.log(resource.getTitle());
    logUpdate(getCheckResult(resource, checks, forceUpdate));
}

async function checkLocalPath(localPath: string): Promise<boolean> {
    if (fs.existsSync(localPath)) return true;
    console.log(
        `Let's set up some ${chalk.bold("GitHub Actions")} for this project!\n`
    );
    if (!(await createWorkflowsDir(localPath))) {
        console.log("Okay, looks like that was a wrong directory.");
        console.log(
            `Restart me where I should be, or just use ${chalk.blue(
                "--path <github repo path>"
            )}`
        );
        console.log("Bye for now!");
        return false;
    }
    fs.mkdirSync(localPath, { recursive: true });
    console.log(
        `Awesome, we have just created ${chalk.bold(localPath)} directory!\n`
    );
    return true;
}

export async function runInteractive(args: Namespace): Promise<void> {
    console.clear();
    console.log("Hi there!\n");
    console.log(
        `I am ${chalk.bold(
            chalk.blue("GitHub Actions Manager")
        )}, as you probably know already.\n`
    );
    const localPath = path.join(args.path, LOCAL_WORKFLOWS_PATH);
    if (!(await checkLocalPath(localPath))) {
        return;
    }
    const workflowIndex = await chooseIndex(args.index, args.ref, localPath);
    if (!workflowIndex.names.length) {
        console.log(`No workflows found in ${workflowIndex.url}`);
        return;
    }

    console.log(`Using index ${highlightURL(workflowIndex.url)}`);

    const resources = await selectWorkflows(workflowIndex);
    if (args.list) {
        await runListAll(resources);
        return;
    }
    while (true) {
        const resourceCheckLists = await logWorkflowChecks(resources, args);
        const changedResourceChecks = resourceCheckLists.filter(
            ([resource, checks]) =>
                !resource.existsLocally() ||
                checks.filter(check => check.isApplied(args.force)).length
        );
        const changedResources = changedResourceChecks.map(
            ([resource]) => resource
        );
        const confirmResult = await confirmRerunApply(
            args.force,
            args.diff,
            changedResources.length > 0
        );
        if (confirmResult === "discard") {
            console.log("");
            console.log("Okay, let's keep things as they are...");
            break;
        }
        if (confirmResult === "apply") {
            changedResourceChecks.map(([resource, checks]) =>
                logWorkflowUpdates(resource, checks, args.force)
            );
            await Promise.all(
                changedResources.map(resource =>
                    runUpdate(resource, args.force, args.clean)
                )
            );
            break;
        }
        if (confirmResult === "rerun_force") args.force = true;
        if (confirmResult === "rerun_noforce") args.force = false;
        if (confirmResult === "rerun_diff") args.diff = true;
        if (confirmResult === "rerun_nodiff") args.diff = false;
    }

    console.log("");
    console.log(
        "My job here is done! Start me from time to time to sync up changes. Bye for now!"
    );
}
