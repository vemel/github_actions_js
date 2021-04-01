import chalk from "chalk";

import { WorkflowResource } from "./workflow/resource";

export function runList(workflow: WorkflowResource): void {
    const state = workflow.existsLocally()
        ? "is installed to"
        : "can be installed to";
    console.log(
        `${workflow.title} (${chalk.bold(
            chalk.blue(workflow.name)
        )}) ${chalk.grey(state)} ${chalk.bold(workflow.path)}`
    );
    if (workflow.description) {
        console.log("");
        workflow.description
            .split(/\r?\n/)
            .filter(line => line.trim())
            .forEach(line => {
                console.log(`  ${line}`);
            });
        console.log("");
    }
}

export function runListAll(workflows: Array<WorkflowResource>): void {
    workflows.forEach(workflow => {
        runList(workflow);
    });
}
