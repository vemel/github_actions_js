import chalk from "chalk";
import fs from "fs";
import path from "path";

import { Namespace } from "./cli";
import { LOCAL_WORKFLOWS_PATH } from "./constants";
import {
    chooseIndex,
    confirmProceed,
    createWorkflowsDir,
    selectWorkflows
} from "./inquire";
import { runCheck } from "./runCheck";
import { runList } from "./runList";
import { runUpdateAll } from "./runUpdate";
import { WorkflowResource } from "./workflow/resource";
import { WorkflowIndex } from "./workflow/workflowIndex";

async function logChecks(
    workflow: WorkflowResource,
    args: Namespace
): Promise<boolean> {
    if (workflow.existsLocally()) {
        console.log(workflow.getTitle());
        return (
            runCheck(
                (await workflow.getLocal()) || "",
                (await workflow.getRemote()) || "",
                args.force,
                args.diff
            ) === "hasupdates"
        );
    }
    runList(workflow);
    return true;
}

async function getWorkflowResources(
    workflowIndex: WorkflowIndex,
    args: Namespace
): Promise<Array<WorkflowResource>> {
    let workflows: Array<WorkflowResource> = [];
    while (!workflows.length) {
        workflows = await selectWorkflows(workflowIndex);
    }

    const result: Array<WorkflowResource> = [];
    for (const workflow of workflows) {
        const hasChanges = await logChecks(workflow, args);
        if (hasChanges) result.push(workflow);
    }
    if (!result.length) return result;
    if (!(await confirmProceed())) {
        console.log("Bye then!");
        return [];
    }

    return result;
}

async function checkLocalPath(localPath: string): Promise<boolean> {
    if (fs.existsSync(localPath)) return true;
    console.log(
        `Let's set up some ${chalk.bold("GitHub Actions")} for this project!\n`
    );
    if (!(await createWorkflowsDir(localPath))) {
        console.log("Okay, looks like I was in a wrong directory.");
        console.log(
            `Restart me where I should be, or specify ${chalk.bold("--path")}`
        );
        console.log("Bye for now!");
        return false;
    }
    fs.mkdirSync(localPath, { recursive: true });
    console.log(
        `Awesome, we have just created ${chalk.bold(localPath)} directory!`
    );
    return true;
}

export async function runInteractive(args: Namespace): Promise<void> {
    console.log("Hi there!\n");
    console.log(
        `I am ${chalk.bold(
            chalk.blue("GitHub Actions Manager")
        )}, as you probably know already.\n`
    );
    const localPath = path.join(args.path, LOCAL_WORKFLOWS_PATH);
    if (!checkLocalPath(localPath)) {
        return;
    }

    if (!args.index) {
        args.index = await chooseIndex(args.path);
    }
    const indexURL = args.index.replace("{ref}", args.ref);
    console.log(`Downloading index from ${indexURL} ...`);
    const workflowIndex = await WorkflowIndex.download(indexURL, localPath);
    const workflows = await getWorkflowResources(workflowIndex, args);
    await runUpdateAll(workflows, args.force, args.diff);
}
