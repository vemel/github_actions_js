import chalk from "chalk";
import equal from "deep-equal";

import {
    getLocalPath,
    getTopCommentLines,
    getWorkflowData,
    readLocalWorkflows,
    readRemoteWorkflows,
    renderWorkflow,
    updateWorkflow
} from "./manager";
import {
    getCheckIcon,
    getWorkflowChecks,
    mergesToSteps,
    mergeWorkflows,
    WorkflowCheck
} from "./sanitizer";
import { decapitalize } from "./utils";
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
    checks.forEach(check => console.log(renderCheck(check, forceUpdate)));
}

export function runUpdate(
    name: string,
    localContent: string | null,
    remoteContent: string | null,
    forceUpdate: boolean
): boolean {
    const workflowChecks = getWorkflowChecks(localContent, remoteContent);
    const workflowCheckErrors = workflowChecks.filter(c => c.level === "error");
    if (!remoteContent) {
        logChecks(workflowCheckErrors, forceUpdate);
        return false;
    }
    if (workflowCheckErrors.length) {
        workflowCheckErrors.push({
            item: "action",
            level: "error",
            highlight: "errors",
            checkMessage: "",
            updateMessage: "has errors that have to be fixed before update"
        });
        logChecks(workflowCheckErrors, forceUpdate);
        return false;
    }
    const remoteWorkflow = getWorkflowData(remoteContent);
    const workflowPurpose = chalk.bold(decapitalize(remoteWorkflow.name));
    if (!localContent) {
        logChecks(workflowChecks, forceUpdate);
        updateWorkflow(name, remoteContent);
        return true;
    }
    const localWorkflow = getWorkflowData(localContent);
    const localCommentLines = getTopCommentLines(localContent);
    const remoteCommentLines = getTopCommentLines(remoteContent);
    let commentLines = localCommentLines;
    if (forceUpdate && !equal(commentLines, remoteCommentLines)) {
        commentLines = remoteCommentLines;
    }
    if (forceUpdate && localWorkflow.name !== remoteWorkflow.name) {
        localWorkflow.name = remoteWorkflow.name;
    }
    if (forceUpdate && !equal(localWorkflow.on, remoteWorkflow.on)) {
        localWorkflow.on = remoteWorkflow.on;
    }
    const stepMerges = mergeWorkflows(localWorkflow, remoteWorkflow);
    localWorkflow.jobs = localWorkflow.jobs || remoteWorkflow.jobs || {};
    const workflowJob = Object.values(localWorkflow.jobs || {})[0];
    workflowJob.steps = mergesToSteps(stepMerges);
    const renderedWorkflow = renderWorkflow(localWorkflow, commentLines);
    if (renderedWorkflow === localContent) {
        workflowChecks.push({
            level: "success",
            item: "",
            checkMessage: "",
            highlight: workflowPurpose,
            updateMessage: `up to date and ready to ${workflowPurpose}`
        });
        logChecks(workflowChecks, forceUpdate);
        return false;
    }

    workflowChecks.push({
        level: "success",
        item: "",
        checkMessage: "",
        highlight: workflowPurpose,
        updateMessage: `safely updated to ${workflowPurpose} even better`
    });
    logChecks(workflowChecks, forceUpdate);
    updateWorkflow(name, renderedWorkflow);
    return true;
}

export async function runUpdateAll(
    items: Array<WorkflowIndexItem>,
    forceUpdate: boolean
): Promise<void> {
    const remoteContents = await readRemoteWorkflows(items);
    const localContents = new Map(await readLocalWorkflows(items));
    remoteContents.forEach(([workflowItem, remoteContent]) => {
        const localContent = localContents.get(workflowItem) || null;
        const localPath = getLocalPath(workflowItem.name);
        const title = workflowItem.title || workflowItem.name;
        console.log(`${chalk.bold(title)} ${chalk.grey(localPath)}`);
        runUpdate(workflowItem.name, localContent, remoteContent, forceUpdate);
    });
}
