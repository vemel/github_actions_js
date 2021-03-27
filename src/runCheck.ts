import chalk from "chalk";

import {
    getLocalPath,
    getWorkflowData,
    readLocalWorkflows,
    readRemoteWorkflows
} from "./manager";
import { checkWorkflow, checkWorkflowRemote } from "./sanitizer";

export function runCheck(
    name: string,
    localContent: string | null,
    remoteContent: string | null
): boolean {
    let hasErrors = false;
    if (!localContent) {
        console.log(
            chalk.grey("  ✓  Does not exist locally yet and can be created")
        );
        return false;
    }
    if (!remoteContent) {
        console.log(
            chalk.red(
                "  ✗  Could not download remote workflow, running only local checks"
            )
        );
    }
    const data = getWorkflowData(localContent);
    const messages = checkWorkflow(data);
    if (remoteContent) {
        const remoteData = getWorkflowData(remoteContent);
        messages.push(...checkWorkflowRemote(data, remoteData));
    }
    hasErrors =
        hasErrors || messages.filter(m => m.level == "error").length > 0;

    console.log(`${chalk.bold(getLocalPath(name))} : `);
    if (!messages.length) {
        console.log(
            chalk.grey("  ✓  All good, the workflow can be fully updated")
        );
    }
    messages.forEach(report => {
        const icon = {
            info: "✓",
            warn: "✎",
            error: "✗"
        }[report.level];
        const color = {
            info: chalk.grey,
            warn: chalk.white,
            error: chalk.yellow
        }[report.level];
        let message = report.message;
        if (report.highlight)
            message = message.replace(
                report.highlight,
                chalk.bold(report.highlight)
            );
        console.log(color(`  ${icon}  ${message}`));
    });
    return hasErrors;
}

export async function runCheckAll(
    names: Array<string>,
    ref: string
): Promise<boolean> {
    const remoteContents = await readRemoteWorkflows(names, ref);
    const localContents = new Map(await readLocalWorkflows(names));
    let hasErrors = false;
    remoteContents.forEach(([name, remoteContent]) => {
        const localContent = localContents.get(name) || null;
        const result = runCheck(name, localContent, remoteContent);
        hasErrors = hasErrors || result;
    });
    if (!hasErrors) {
        console.log(
            chalk.green(
                `✓  Run ${chalk.bold("ghactions all")} any time you want!`
            )
        );
    } else {
        console.log(
            chalk.red(
                "✗  Workflows have errors so updating them automatically is not recommended"
            )
        );
        console.log(
            "  ✎  Delete invalid workflows, update all, and merge your changes"
        );
        console.log(
            "  ✎  Check for updates: https://github.com/vemel/github_actions_js"
        );
    }
    return hasErrors;
}
