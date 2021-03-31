import chalk from "chalk";

import { logDiff } from "./differ";
import { Check } from "./workflow/check";
import { Checker } from "./workflow/checker";
import { Merger } from "./workflow/merger";
import { WorkflowResource } from "./workflow/resource";
import { Workflow } from "./workflow/workflow";

function logCheck(check: Check, forceUpdate: boolean) {
    if (check.action === "equal") return;
    if (!check.force || forceUpdate) {
        console.log(check.color(`  ${check.updateMessage}`));
        return;
    }
    console.log(chalk.grey(`  ${check.noForceMessage}`));
}

function runUpdate(
    workflowItem: WorkflowResource,
    localContent: string | null,
    remoteContent: string,
    forceUpdate: boolean,
    showDiff: boolean
): void {
    const remoteWorkflow = Workflow.fromString(remoteContent);
    if (!localContent) {
        workflowItem.setLocal(remoteContent);
        console.log(chalk.green("  ✓  created"));
        return;
    }
    const localWorkflow = Workflow.fromString(localContent);
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
    checks.forEach(check => logCheck(check, forceUpdate));
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

    workflowItem.setLocal(newWorkflow.render());
    if (showDiff && localContent) {
        logDiff(localContent, newWorkflow.render());
    }
}

export async function runUpdateAll(
    items: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<void> {
    const remoteContents = await Promise.all(
        items.map(item => item.getRemote())
    );
    const localContents = await Promise.all(items.map(item => item.getLocal()));
    items.forEach((item, index) => {
        const remoteContent = remoteContents[index];
        const localContent = localContents[index];

        const title = item.title || item.name;
        console.log(`${chalk.bold(title)} ${chalk.grey(item.path)}`);
        if (!remoteContent) {
            console.log(chalk.red(`  ✗  download failed: ${item.url}`));
            return;
        }
        runUpdate(item, localContent, remoteContent, forceUpdate, showDiff);
    });
}
