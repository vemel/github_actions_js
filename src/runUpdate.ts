import chalk from "chalk";

import { logDiff } from "./differ";
import { Check } from "./workflow/check";
import { Checker } from "./workflow/checker";
import { Merger } from "./workflow/merger";
import { WorkflowResource } from "./workflow/resource";
import { Workflow } from "./workflow/workflow";

function logCheck(check: Check, forceUpdate: boolean, showDiff: boolean) {
    if (check.action === "equal") return;
    if (!forceUpdate && check.force) {
        return console.log(chalk.grey(`  ${check.noForceMessage}`));
    }
    console.log(check.color(`  ${check.updateMessage}`));
    if (showDiff) logDiff(check.oldValue, check.newValue);
}

export async function runUpdate(
    workflowItem: WorkflowResource,
    localContent: string | null,
    remoteContent: string,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<void> {
    const remoteWorkflow = Workflow.fromString(remoteContent);
    if (!remoteWorkflow.commentLines)
        remoteWorkflow.commentLines = workflowItem.getCommentLines();
    if (!localContent) {
        console.log(chalk.green("  ✓  created"));
        await workflowItem.setLocal(remoteContent);
        return;
    }

    let localWorkflow: Workflow;
    try {
        localWorkflow = Workflow.fromString(localContent);
    } catch (e) {
        console.log(chalk.red(`  ✗  ${e}`));
        return;
    }
    const checker = new Checker(forceUpdate, localWorkflow);

    const errors = checker.getErrors();
    if (errors.length) {
        errors.forEach(error => console.log(chalk.red(`  ✗  ${error}`)));
        console.log(
            chalk.red(`  ✗  has ${chalk.bold("errors")} that prevent update`)
        );
        return;
    }
    let newWorkflow = new Merger(true).merge(localWorkflow, remoteWorkflow);
    const checks = checker.getChecks(newWorkflow);
    const applyChecks = checks.filter(check => check.isApplied(forceUpdate));
    checks.forEach(check => logCheck(check, forceUpdate, showDiff));
    if (!applyChecks.length) {
        console.log(chalk.grey("  ✓  is up to date"));
        return;
    }
    console.log(chalk.green("  ✓  updated successfully"));
    if (!forceUpdate)
        newWorkflow = new Merger(forceUpdate).merge(
            localWorkflow,
            remoteWorkflow
        );

    await workflowItem.setLocal(newWorkflow.render());
}

export async function runUpdateAll(
    items: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<void> {
    const results: Array<Promise<void>> = items.map(async item => {
        const remoteContent = await item.getRemote();
        const localContent = await item.getLocal();
        console.log(item.getTitle());
        if (!remoteContent) {
            console.log(chalk.red(`  ✗  download failed: ${item.url}`));
            return;
        }
        await runUpdate(
            item,
            localContent,
            remoteContent,
            forceUpdate,
            showDiff
        );
    });
    return Promise.all(results).then(() => undefined);
}
