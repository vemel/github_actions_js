import chalk from "chalk";
import fs from "fs";

import { getHelp, Namespace, parseArgs } from "./cli";
import { DOCS_URL, JS_INDEX_URL } from "./constants";
import { runCheckAll } from "./runCheck";
import { runList } from "./runList";
import { runUpdateAll } from "./runUpdate";
import { getCommandName, getVersionString } from "./utils";
import { WorkflowResource } from "./workflow/resource";
import { WorkflowIndex } from "./workflow/workflowIndex";

async function main(indexURL: string): Promise<void> {
    let args: Namespace;
    const commandName = getCommandName();
    try {
        args = parseArgs();
    } catch (e) {
        console.log(e.message);
        console.log("Use `--help` to know more");
        process.exit(1);
    }
    if (args.help) {
        console.log(getHelp());
        process.exit(0);
    }
    if (args.version) {
        console.log(getVersionString());
        process.exit(0);
    }
    if (!fs.existsSync(args.path)) {
        console.warn(
            chalk.red(`✗  ${chalk.bold(args.path)} directory does not exist`)
        );
        console.warn(
            chalk.yellow("✎  Probably this is not a GitHub repository root")
        );
        console.warn(
            chalk.yellow(
                `✎  If it is, create this directory with: ${chalk.bold(
                    `mkdir -p ${args.path}`
                )}`
            )
        );
        process.exit(1);
    }

    indexURL = (args.index || indexURL).replace("{ref}", args.ref);
    let workflowIndex: WorkflowIndex;
    let workflows: Array<WorkflowResource>;
    try {
        workflowIndex = await WorkflowIndex.download(indexURL, args.path);
        workflows = workflowIndex.getWorkflows(args.names);
    } catch (e) {
        console.log(chalk.red(`✗  ${e.message}`));
        process.exit(1);
    }
    if (workflows.length === 0) {
        const commandList = `${getCommandName()} --list`;
        console.log(
            `✎  No workflows found, run ${chalk.bold(
                commandList
            )} for full info`
        );
        workflowIndex.getAllWorkflows().map(workflow => {
            const command = `${getCommandName()} -u ${workflow.name}`;
            console.log(
                `${chalk.bold(chalk.blue(command))} : ${workflow.title}`
            );
        });
        process.exit(0);
    }
    if (args.list) {
        runList(workflows);
        process.exit(0);
    }
    if (!args.update) {
        const result = await runCheckAll(workflows, args.force, args.diff);
        if (result) {
            console.log(
                chalk.green(
                    `✓  Run ${chalk.bold(
                        `${commandName} all`
                    )} any time you want!`
                )
            );
        } else logUpdateError();
        process.exit(result ? 0 : 1);
    }

    await runUpdateAll(workflows, args.force, args.diff);
}

function logUpdateError(): void {
    console.log(chalk.red("✗  Found errors that prevent update"));
    console.log(
        chalk.grey(
            "✎  Delete invalid workflows, update all, and merge your changes"
        )
    );
    console.log(chalk.grey(`✎  Check for updates: ${DOCS_URL}`));
}

if (typeof require !== "undefined" && require.main === module) {
    main(JS_INDEX_URL);
}

export default main;
