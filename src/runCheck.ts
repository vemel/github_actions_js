import chalk from "chalk";

import {
    getLocalPath,
    readLocalWorkflows,
    readRemoteWorkflows
} from "./manager";
import { getCheckIcon, getWorkflowChecks, WorkflowCheck } from "./sanitizer";

function renderCheck(check: WorkflowCheck, forceUpdate: boolean): string {
    const icon = getCheckIcon(check);
    const color =
        {
            info: chalk.grey,
            success: chalk.green,
            delete: chalk.yellow,
            error: chalk.red
        }[check.level] || chalk.blue;
    let message = check.checkMessage;
    if (check.noForceMessage && !forceUpdate) message = check.noForceMessage;
    if (check.highlight)
        message = message.replace(check.highlight, chalk.bold(check.highlight));

    if (check.noForceMessage && !forceUpdate) {
        message = `${message}, use ${chalk.bold("--force")} flag to update`;
    }
    if (!check.item) return color(`  ${icon}  ${message}`);
    return color(`  ${icon}  ${chalk.bold(check.item)} ${message}`);
}

export async function runCheckAll(
    names: Array<string>,
    ref: string,
    remotePath: string,
    forceUpdate: boolean
): Promise<boolean> {
    const remoteContents = await readRemoteWorkflows(names, ref, remotePath);
    const localContents = new Map(await readLocalWorkflows(names));
    let noErrors = true;
    remoteContents.forEach(([name, remoteContent]) => {
        const localContent = localContents.get(name) || null;
        console.log(`${chalk.bold(getLocalPath(name))} : `);
        const workflowChecks = getWorkflowChecks(localContent, remoteContent);
        const noChecks = !workflowChecks.length;
        const noErrorChecks = !workflowChecks.filter(c => c.level === "error")
            .length;
        if (noChecks) {
            workflowChecks.push({
                level: "success",
                item: "workflow",
                checkMessage: "is up-to-date",
                updateMessage: "is up-to-date",
                highlight: "up-to-date"
            });
        } else if (noErrorChecks) {
            workflowChecks.push({
                level: "info",
                item: "workflow",
                checkMessage: "can be safely updated",
                updateMessage: "updated",
                highlight: "updated"
            });
        } else {
            workflowChecks.push({
                level: "error",
                item: "workflow",
                checkMessage: "has errors that need to be fixed before update",
                updateMessage: "updated, even though it had errors",
                highlight: "errors"
            });
        }
        workflowChecks.forEach(check =>
            console.log(renderCheck(check, forceUpdate))
        );
        noErrors = noErrors && noErrorChecks;
    });
    return noErrors;
}
