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
            color(
                `  ${icon}  ${chalk.bold(check.item)} will be ${chalk.bold(
                    check.action
                )}`
            )
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

export async function runCheckAll(
    items: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<boolean> {
    const remoteContents = await Promise.all(
        items.map(item => item.getRemote())
    );
    const localContents = await Promise.all(items.map(item => item.getLocal()));
    let noErrors = true;
    items.forEach((item, index) => {
        const remoteContent = remoteContents[index];
        const localContent = localContents[index];
        if (!remoteContent) {
            console.log(chalk.red("  ✗  download failed"));
            return;
        }
        if (!localContent) {
            console.log(chalk.green("  ✓  will be created"));
            return;
        }
        const title = item.title || item.name;
        console.log(`${chalk.bold(title)} ${chalk.grey(item.path)}`);

        const localWorkflow = Workflow.fromString(localContent);
        const remoteWorkflow = Workflow.fromString(remoteContent);
        const checker = new Checker(forceUpdate, localWorkflow);

        const errors = checker.getErrors();
        if (errors.length) {
            errors.forEach(error => console.log(chalk.red(`  ✗  ${error}`)));
            console.log(
                chalk.red(
                    `  ✗  has ${chalk.bold("errors")} that prevent update`
                )
            );
            return;
        }
        const newWorkflow = new Merger(true).merge(
            localWorkflow,
            remoteWorkflow
        );
        const checks = checker
            .getChecks(newWorkflow)
            .filter(check => check.action !== "equal");
        const applyChecks = checks.filter(({ force }) => !force || forceUpdate);

        checks.forEach(check => logCheck(check, forceUpdate));
        if (!applyChecks.length) {
            console.log(chalk.grey("  ✓  is up to date"));
            return;
        }
        console.log(chalk.green("  ✓  can be updated"));
        if (showDiff && remoteContent && localContent) {
            const newContent = new Merger(forceUpdate)
                .merge(localWorkflow, remoteWorkflow)
                .render();
            logDiff(localContent, newContent);
        }
        noErrors = noErrors && errors.length === 0;
    });
    return noErrors;
}
