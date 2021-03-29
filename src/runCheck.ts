import chalk from "chalk";

import {
    getLocalPath,
    readLocalWorkflows,
    readRemoteWorkflows
} from "./manager";
import { getCheckIcon, getWorkflowChecks, WorkflowCheck } from "./sanitizer";
import { WorkflowIndexItem } from "./workflow";

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
    items: Array<WorkflowIndexItem>,
    forceUpdate: boolean
): Promise<boolean> {
    const remoteContents = await readRemoteWorkflows(items);
    const localContents = new Map(await readLocalWorkflows(items));
    let noErrors = true;
    remoteContents.forEach(([workflowItem, remoteContent]) => {
        const localContent = localContents.get(workflowItem) || null;
        const localPath = getLocalPath(workflowItem.name);
        const title = workflowItem.title || workflowItem.name;
        console.log(`${chalk.bold(title)} ${chalk.grey(localPath)}`);
        const workflowChecks = getWorkflowChecks(localContent, remoteContent);
        const noChecks = !workflowChecks.length;
        const noErrorChecks = !workflowChecks.filter(c => c.level === "error")
            .length;
        if (noChecks) {
            workflowChecks.push({
                level: "success",
                item: "action",
                checkMessage: "is up-to-date",
                updateMessage: "is up-to-date",
                highlight: "up-to-date"
            });
        }
        if (!noErrorChecks) {
            workflowChecks.push({
                level: "error",
                item: "",
                checkMessage: "found errors",
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
