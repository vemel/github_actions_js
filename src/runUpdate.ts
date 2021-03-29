import chalk from "chalk";

import { logDiff } from "./differ";
import {
    getLocalPath,
    readLocalWorkflows,
    readRemoteWorkflows,
    updateWorkflow
} from "./manager";
import { mergeWorkflowContent } from "./merger";
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
    let message = check.updateMessage;
    if (check.noForceMessage && !forceUpdate) message = check.noForceMessage;
    if (check.highlight)
        message = message.replace(check.highlight, chalk.bold(check.highlight));

    if (check.noForceMessage && !forceUpdate) {
        message = `${message}, use ${chalk.bold("--force")} flag to update`;
    }
    if (!check.item) return color(`  ${icon}  ${message}`);
    return color(`  ${icon}  ${chalk.bold(check.item)} ${message}`);
}

function logChecks(checks: Array<WorkflowCheck>, forceUpdate: boolean): void {
    const errors = checks.filter(c => c.level === "error");
    if (errors.length) {
        checks = errors;
    }
    checks.forEach(check => console.log(renderCheck(check, forceUpdate)));
}

function runUpdate(
    workflowItem: WorkflowIndexItem,
    localContent: string | null,
    remoteContent: string | null,
    forceUpdate: boolean,
    showDiff: boolean
): void {
    const workflowChecks = getWorkflowChecks(localContent, remoteContent);
    const hasErrors =
        workflowChecks.filter(c => c.level === "error").length > 0;
    if (hasErrors || !remoteContent) {
        workflowChecks.push({
            item: "workflow",
            level: "error",
            highlight: "errors",
            checkMessage: "",
            updateMessage: "has errors that have to be fixed before update"
        });
        logChecks(workflowChecks, forceUpdate);
        return;
    }
    const renderedWorkflow = mergeWorkflowContent(
        localContent,
        remoteContent,
        forceUpdate
    );
    if (renderedWorkflow === localContent) {
        workflowChecks.push({
            level: "info",
            item: "workflow",
            checkMessage: "",
            updateMessage: "is up to date"
        });
        logChecks(workflowChecks, forceUpdate);
        return;
    }
    updateWorkflow(workflowItem.name, renderedWorkflow);
    workflowChecks.push({
        level: "success",
        item: "workflow",
        checkMessage: "",
        updateMessage: `updated`
    });
    logChecks(workflowChecks, forceUpdate);
    if (showDiff && localContent) {
        logDiff(localContent, renderedWorkflow);
    }
}

export async function runUpdateAll(
    items: Array<WorkflowIndexItem>,
    forceUpdate: boolean,
    showDiff: boolean
): Promise<void> {
    const remoteContents = await readRemoteWorkflows(items);
    const localContents = new Map(await readLocalWorkflows(items));
    remoteContents.forEach(([workflowItem, remoteContent]) => {
        const localContent = localContents.get(workflowItem) || null;
        const localPath = getLocalPath(workflowItem.name);
        const title = workflowItem.title || workflowItem.name;
        console.log(`${chalk.bold(title)} ${chalk.grey(localPath)}`);
        runUpdate(
            workflowItem,
            localContent,
            remoteContent,
            forceUpdate,
            showDiff
        );
    });
}
