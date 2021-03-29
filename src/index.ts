import chalk from "chalk";
import fs from "fs";

import { getHelp, Namespace, parseArgs } from "./cli";
import { DOCS_URL, JS_INDEX_URL } from "./constants";
import { readWorkflowIndex } from "./manager";
import { runCheckAll } from "./runCheck";
import { runUpdateAll } from "./runUpdate";
import { WorkflowIndex } from "./workflow";

async function main(indexURL: string): Promise<void> {
    let args: Namespace;
    const commandName = process.argv[1]
        ? process.argv[1].split("/").pop()
        : "ghactions";
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
    if (!fs.existsSync("./.github/workflows")) {
        console.warn(
            chalk.red(
                `✗  ${chalk.bold(
                    ".github/workflows"
                )} directory does not exist in current path`
            )
        );
        console.warn(
            chalk.yellow("✎  Probably this is not a GitHub repository root")
        );
        console.warn(
            chalk.yellow(
                `✎  If it is, create this directory with: ${chalk.bold(
                    "mkdir -p .github/workflows"
                )}`
            )
        );
        process.exit(1);
    }

    indexURL = (args.index || indexURL).replace("{ref}", args.ref);
    let workflowIndex: WorkflowIndex;
    try {
        workflowIndex = await readWorkflowIndex(indexURL, args.update);
        console.log(
            chalk.grey(
                `✓  checking workflows from ${chalk.bold(workflowIndex.name)}`
            )
        );
    } catch (e) {
        console.log(chalk.red(`✗  ${e.message}`));
        process.exit(1);
    }

    if (args.check) {
        const result = await runCheckAll(workflowIndex.workflows, args.force);
        if (result) {
            console.log(
                chalk.green(
                    `✓  Run ${chalk.bold(
                        `${commandName} all`
                    )} any time you want!`
                )
            );
        } else {
            console.log(chalk.red("✗  Found errors that prevent update"));
            console.log(
                chalk.grey(
                    "✎  Delete invalid workflows, update all, and merge your changes"
                )
            );
            console.log(chalk.grey(`✎  Check for updates: ${DOCS_URL}`));
        }
        process.exit(result ? 0 : 1);
    }

    if (!args.update.length) {
        console.log(getHelp());
        process.exit(0);
    }

    await runUpdateAll(workflowIndex.workflows, args.force);
}

if (typeof require !== "undefined" && require.main === module) {
    main(JS_INDEX_URL);
}

export default main;
