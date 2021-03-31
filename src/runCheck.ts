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
        console.log(check.color(`  ${check.checkMessage}`));
        return;
    }
    console.log(chalk.grey(`  ${check.noForceMessage}`));
}

export function runCheck(
    localContent: string,
    remoteContent: string,
    forceUpdate: boolean,
    showDiff: boolean
): boolean {
    const localWorkflow = Workflow.fromString(localContent);
    const remoteWorkflow = Workflow.fromString(remoteContent);
    const checker = new Checker(forceUpdate, localWorkflow);

    const errors = checker.getErrors();
    if (errors.length) {
        errors.forEach(error => console.log(chalk.red(`  ✗  ${error}`)));
        console.log(
            chalk.red(`  ✗  has ${chalk.bold("errors")} that prevent update`)
        );
        return false;
    }
    const newWorkflow = new Merger(true).merge(localWorkflow, remoteWorkflow);
    const checks = checker.getChecks(newWorkflow);
    const applyChecks = checks.filter(check => check.isApplied(forceUpdate));

    checks.forEach(check => logCheck(check, forceUpdate));
    if (!applyChecks.length) {
        console.log(chalk.grey("  ✓  is up to date"));
        return true;
    }
    console.log(chalk.green("  ✓  can be updated"));
    if (showDiff && remoteContent && localContent) {
        const newContent = new Merger(forceUpdate)
            .merge(localWorkflow, remoteWorkflow)
            .render();
        logDiff(localContent, newContent);
    }
    return true;
}

export async function runCheckAll(
    items: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<boolean> {
    const remoteContents = await Promise.all(
        items.map(item => item.getRemote())
    );
    const localContents = await Promise.all(items.map(item => item.getLocal()));
    const statuses: Array<boolean> = items.map((item, index) => {
        const title = item.title || item.name;
        console.log(`${chalk.bold(title)} ${chalk.grey(item.path)}`);

        const remoteContent = remoteContents[index];
        const localContent = localContents[index];
        if (!remoteContent) {
            console.log(chalk.red(`  ✗  download failed: ${item.url}`));
            return true;
        }
        if (!localContent) {
            console.log(chalk.green("  ✓  will be created"));
            return true;
        }

        return runCheck(localContent, remoteContent, forceUpdate, showDiff);
    });
    return statuses.filter(x => !x).length === 0;
}
