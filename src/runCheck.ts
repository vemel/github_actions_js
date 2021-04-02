import chalk from "chalk";

import { logDiff } from "./differ";
import { Check } from "./workflow/check";
import { Checker } from "./workflow/checker";
import { Merger } from "./workflow/merger";
import { WorkflowResource } from "./workflow/resource";
import { Workflow } from "./workflow/workflow";

type TCheckStatus = "error" | "hasupdates" | "updated";

function logCheck(check: Check, forceUpdate: boolean, showDiff: boolean) {
    if (check.action === "equal") return;
    if (!forceUpdate && check.force) {
        return console.log(chalk.grey(`  ${check.noForceMessage}`));
    }
    console.log(check.color(`  ${check.checkMessage}`));
    if (showDiff) logDiff(check.oldValue, check.newValue);
}

export function runCheck(
    workflowItem: WorkflowResource,
    localContent: string,
    remoteContent: string,
    forceUpdate: boolean,
    showDiff: boolean
): TCheckStatus {
    let localWorkflow: Workflow;
    try {
        localWorkflow = Workflow.fromString(localContent);
    } catch (e) {
        console.log(chalk.red(`  ✗  ${e}`));
        return "error";
    }
    const remoteWorkflow = Workflow.fromString(remoteContent);
    if (!remoteWorkflow.commentLines)
        remoteWorkflow.commentLines = workflowItem.getCommentLines();

    const checker = new Checker(forceUpdate, localWorkflow);

    const errors = checker.getErrors();
    if (errors.length) {
        errors.forEach(error => console.log(chalk.red(`  ✗  ${error}`)));
        console.log(
            chalk.red(`  ✗  has ${chalk.bold("errors")} that prevent update`)
        );
        return "error";
    }
    const newWorkflow = new Merger(true).merge(localWorkflow, remoteWorkflow);
    const checks = checker.getChecks(newWorkflow);
    const applyChecks = checks.filter(check => check.isApplied(forceUpdate));

    checks.forEach(check => logCheck(check, forceUpdate, showDiff));
    if (!applyChecks.length) {
        console.log(chalk.grey("  ✓  is up to date"));
        return "updated";
    }
    console.log(chalk.green("  ✓  can be updated"));
    return "hasupdates";
}

export async function runCheckAll(
    items: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<boolean> {
    const results: Array<Promise<TCheckStatus>> = items.map(async item => {
        const remoteContent = await item.getRemote();
        const localContent = await item.getLocal();
        console.log(item.getTitle());
        if (!remoteContent) {
            console.log(chalk.red(`  ✗  download failed: ${item.url}`));
            return "error";
        }
        if (!localContent) {
            console.log(chalk.green("  ✓  will be created"));
            return "hasupdates";
        }

        return runCheck(
            item,
            localContent,
            remoteContent,
            forceUpdate,
            showDiff
        );
    });
    return Promise.all(results).then(
        results => results.filter(x => x === "error").length === 0
    );
}
