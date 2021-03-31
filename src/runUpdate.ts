import chalk from "chalk";

import { logDiff } from "./differ";
import { Checker, ICheck } from "./workflow/checker";
import { Merger } from "./workflow/merger";
import { WorkflowResource } from "./workflow/resource";
import { Workflow } from "./workflow/workflow";

function logCheck(check: ICheck, forceUpdate: boolean) {
    if (check.action === "equal") return;
    const icon = Checker.getCheckIcon(check);
    const color = {
        added: chalk.green,
        updated: chalk.blue,
        deleted: chalk.yellow
    }[check.action];
    if (!check.force || forceUpdate) {
        console.log(
            color(`  ${icon}  ${chalk.bold(check.item)} ${check.action}`)
        );
        return;
    }
    console.log(
        chalk.grey(
            `  ${icon}  ${chalk.bold(check.item)} can be ${
                check.action
            }, use ${chalk.bold("--force")} flag to apply`
        )
    );
}

function runUpdate(
    workflowItem: WorkflowResource,
    localContent: string | null,
    remoteContent: string | null,
    forceUpdate: boolean,
    showDiff: boolean
): void {
    if (!remoteContent) {
        console.log(chalk.red("  ✗  download failed"));
        return;
    }
    const remoteWorkflow = Workflow.fromString(remoteContent);
    if (!localContent) {
        remoteWorkflow.toFile(workflowItem.path);
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
    const checks = checker
        .getChecks(newWorkflow)
        .filter(check => check.action !== "equal");
    const applyChecks = checks.filter(({ force }) => !force || forceUpdate);
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

    newWorkflow.toFile(workflowItem.path);
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
        runUpdate(item, localContent, remoteContent, forceUpdate, showDiff);
    });
}
