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
        workflow.description
            .trim()
            .split(/\r?\n/)
            .filter(line => line.trim())
            .forEach(line => {
                console.log(`  ${line}`);
            });
    }
    if (workflow.data.env) {
        console.log("\n  Environment:");
        workflow.data.env.forEach(env => {
            if (env.description) {
                return console.log(
                    `    ${chalk.blue(env.name)} - ${
                        env.description
                    } (default: ${chalk.blue(env.default)})`
                );
            }
            console.log(`    ${chalk.blue(env.name)}`);
        });
    }
    if (workflow.data.secrets) {
        console.log("\n  Secrets:");
        workflow.data.secrets.forEach(secret => {
            if (secret.description) {
                return console.log(
                    `    ${chalk.blue(secret.name)} - ${secret.description}`
                );
            }
            console.log(`    ${chalk.blue(secret.name)}`);
        });
    }
    console.log("");
}

export function runListAll(workflows: Array<WorkflowResource>): void {
    workflows.forEach(workflow => {
        runList(workflow);
    });
}
