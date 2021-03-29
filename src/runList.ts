import chalk from "chalk";

import { WorkflowIndex } from "./workflow";

export function runList(index: WorkflowIndex): void {
    index.workflows.forEach(item => {
        if (item.title) {
            console.log(`- ${chalk.bold(chalk.blue(item.name))} ${item.title}`);
        } else {
            console.log(`- ${chalk.bold(chalk.blue(item.name))}`);
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
