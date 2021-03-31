import chalk from "chalk";

import { WorkflowResource } from "./workflow/resource";

export function runList(workflows: Array<WorkflowResource>): void {
    workflows.forEach(item => {
        if (item.title) {
            console.log(`${chalk.bold(chalk.blue(item.name))} : ${item.title}`);
        } else {
            console.log(`${chalk.bold(chalk.blue(item.name))}`);
        }
        if (item.description) {
            item.description
                .split(/\r?\n/)
                .filter(line => line.trim())
                .forEach(line => {
                    console.log(`  ${line}`);
                });
            console.log("");
        }
    });
}
