import chalk from "chalk";
import fs from "fs";
import path from "path";

import { Namespace } from "./cli";
import { LOCAL_WORKFLOWS_PATH } from "./constants";
import {
    chooseIndex,
    confirmApply,
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
    console.log("");
    for (const workflow of workflows) {
        const hasChanges = await logChecks(workflow, args);
        if (hasChanges) result.push(workflow);
    }
    if (!result.length) return result;
    if (!(await confirmApply())) {
        console.log("");
        console.log("Okay, makes sense. Start me again any time. Bye for now!");
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

    if (!args.indexResource.url) {
        args.indexResource = await chooseIndex(args.path);
        console.log("");
        console.log(
            `Next time run me with ${chalk.blue(
                `-i ${args.indexResource.id}`
            )} to skip this question`
        );
        console.log("");
    }
    console.log(`Downloading index ${chalk.blue(args.indexResource.name)} ...`);
    console.log("");

    const workflowIndex = await WorkflowIndex.download(
        args.indexResource.url,
        args.ref,
        localPath
    );
    // await Promise.all([
    //     ...workflowIndex
    //         .getInstalledWorkflows()
    //         .map(worklfow => worklfow.getLocal()),
    //     ...workflowIndex
    //         .getInstalledWorkflows()
    //         .map(worklfow => worklfow.getRemote())
    // ]);
    const workflows = await getWorkflowResources(workflowIndex, args);
    await runUpdateAll(workflows, args.force, args.diff);
    console.log("");
    console.log(
        "My job here is done! Start me from time to time. Bye for now!"
    );
}
