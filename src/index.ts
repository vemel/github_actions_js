import chalk from "chalk";
import fs from "fs";
import path from "path";

import { getHelp, Namespace, parseArgs } from "./cli.js";
import { DOCS_URL, LOCAL_WORKFLOWS_PATH } from "./constants.js";
import { JS_INDEX_URL } from "./indexes.js";
import { runCheckAll } from "./runCheck.js";
import { runInteractive } from "./runInteractive.js";
import { runListAll } from "./runList.js";
import { runUpdateAll } from "./runUpdate.js";
import { highlightURL, replaceRef } from "./urlUtils.js";
import {
    decapitalize,
    getCommandArgs,
    getCommandName,
    getVersionString
} from "./utils.js";
import { WorkflowResource } from "./workflow/resource.js";
import { WorkflowIndex } from "./workflow/workflowIndex.js";

async function main(): Promise<void> {
    let args: Namespace;
    const commandName = getCommandName();
    try {
        args = parseArgs();
    } catch (e) {
        console.log(e instanceof Error ? e.message : e);
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

    if (args.names.length === 0) {
        try {
            await runInteractive(args);
        } catch (e) {
            console.warn(chalk.red(`✗  ${e}`));
            process.exit(1);
        }
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

    let workflowIndex: WorkflowIndex;
    let workflows: Array<WorkflowResource>;
    try {
        workflowIndex = await WorkflowIndex.fromURL(
            replaceRef(args.index || JS_INDEX_URL, args.ref),
            path.join(args.path, LOCAL_WORKFLOWS_PATH)
        );
        console.log(`Using index ${highlightURL(workflowIndex.url)}`);
        workflows = workflowIndex.getWorkflows(args.names);
    } catch (e) {
        console.log(chalk.red(`✗  ${e instanceof Error ? e.message : e}`));
        process.exit(1);
    }
    if (workflows.length === 0) {
        const commandList = `${getCommandName()} --list`;
        console.log(
            `✎  No workflows found, install them first, or check ${chalk.bold(
                commandList
            )}`
        );
        const command = `${getCommandName()} -u all`;
        console.log(
            `${chalk.bold(chalk.blue(command))} ${chalk.grey(
                "// install all workflows below"
            )}`
        );
        workflowIndex.getAllWorkflows().map(workflow => {
            const command = `${getCommandName()} -u ${workflow.name}`;
            const description = workflow.title
                ? `// install to ${decapitalize(workflow.title)}`
                : "";
            console.log(
                `${chalk.bold(chalk.blue(command))} ${chalk.grey(description)}`
            );
        });
        process.exit(0);
    }
    if (args.list) {
        runListAll(workflows);
        process.exit(0);
    }
    if (!args.update) {
        const result = await runCheckAll(
            workflows,
            args.force,
            args.diff,
            args.clean
        );
        if (result) {
            console.log(
                chalk.green(
                    `✓  Run ${chalk.bold(
                        `${commandName} ${getCommandArgs()} --update`
                    )} any time you want!`
                )
            );
        } else logUpdateError();
        process.exit(result ? 0 : 1);
    }

    await runUpdateAll(workflows, args.force, args.diff, args.clean);
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
    main();
}

export default main;
