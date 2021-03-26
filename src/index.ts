import chalk from "chalk";
import fs from "fs";

import { getHelp, Namespace, parseArgs } from "./cli";
import {
    getLocalPath,
    getWorkflowTitle,
    readLocalWorkflows,
    readRemoteWorkflows,
    updateWorkflow
} from "./manager";
import { decapitalize } from "./utils";

function processWorkflowUpdate(
    name: string,
    localContent: string | null,
    remoteContent: string | null,
    updateExisting: boolean
): boolean {
    const localPath = getLocalPath(name);
    const workflowPrefix = `Workflow ${chalk.bold(localPath)}`;
    if (!remoteContent) {
        console.warn(
            chalk.red(`✗  ${workflowPrefix} download failed, skipping`)
        );
        return false;
    }
    const workflowPurpose = chalk.bold(
        decapitalize(getWorkflowTitle(remoteContent))
    );
    if (!localContent) {
        updateWorkflow(name, remoteContent);
        console.info(
            chalk.green(
                `✓  Workflow ${chalk.bold(
                    localPath
                )} added to ${workflowPurpose}`
            )
        );
        return true;
    }
    if (localContent === remoteContent) {
        console.log(
            chalk.grey(
                `✓  ${workflowPrefix} is up to date and ready to ${workflowPurpose}`
            )
        );
        return false;
    }
    if (!updateExisting) {
        console.info(
            chalk.yellow(
                `↻  ${workflowPrefix} can ${workflowPurpose} better, add ${chalk.bold(
                    "-f"
                )} CLI flag to update`
            )
        );
        return false;
    }
    updateWorkflow(name, remoteContent);
    console.info(
        chalk.green(`✓  ${workflowPrefix} updated, cross-check changes`)
    );
    return true;
}

async function main(): Promise<void> {
    let args: Namespace;
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
    if (!args.update.length) {
        console.log(getHelp());
        process.exit(0);
    }

    console.log(
        chalk.grey(
            `Checking https://github.com/vemel/github_actions_js for workflow updates`
        )
    );
    const remoteContents = await readRemoteWorkflows(args.update, args.ref);
    const localContents = new Map(await readLocalWorkflows(args.update));
    remoteContents.forEach(([name, remoteContent]) => {
        const localContent = localContents.get(name) || null;
        processWorkflowUpdate(name, localContent, remoteContent, args.force);
    });
}

if (typeof require !== "undefined" && require.main === module) {
    main();
}

export default main;
