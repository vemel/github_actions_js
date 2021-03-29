import equal from "deep-equal";

import { getTopCommentLines, getWorkflowData, renderWorkflow } from "./manager";
import { getFirstJob, mergesToSteps, mergeWorkflows } from "./sanitizer";

function mergeTopCommentLines(
    localContent: string | null,
    remoteContent: string | null,
    forceUpdate: boolean
): Array<string> {
    const localCommentLines = localContent
        ? getTopCommentLines(localContent)
        : [];
    const remoteCommentLines = remoteContent
        ? getTopCommentLines(remoteContent)
        : [];
    if (forceUpdate) return remoteCommentLines;
    return localCommentLines;
}

export function mergeWorkflowContent(
    localContent: string | null,
    remoteContent: string,
    forceUpdate: boolean
): string {
    if (!localContent) return remoteContent;
    const remoteWorkflow = getWorkflowData(remoteContent);

    const localWorkflow = getWorkflowData(localContent);
    const commentLines = mergeTopCommentLines(
        localContent,
        remoteContent,
        forceUpdate
    );
    if (forceUpdate && localWorkflow.name !== remoteWorkflow.name) {
        localWorkflow.name = remoteWorkflow.name;
    }
    if (forceUpdate && !equal(localWorkflow.on, remoteWorkflow.on)) {
        localWorkflow.on = remoteWorkflow.on;
    }
    const localJob = getFirstJob(localWorkflow);
    const remoteJob = getFirstJob(remoteWorkflow);
    if (forceUpdate && localJob && remoteJob) {
        if (!equal(localJob.env, remoteJob.env)) {
            if (remoteJob.env) localJob.env = remoteJob.env;
            else delete localJob.env;
        }
        if (localJob["runs-on"] !== remoteJob["runs-on"]) {
            localJob["runs-on"] = remoteJob["runs-on"];
        }
    }
    const stepMerges = mergeWorkflows(localWorkflow, remoteWorkflow);
    localWorkflow.jobs = localWorkflow.jobs || remoteWorkflow.jobs || {};
    const workflowJob = Object.values(localWorkflow.jobs || {})[0];
    workflowJob.steps = mergesToSteps(stepMerges);
    const renderedWorkflow = renderWorkflow(localWorkflow, commentLines);
    return renderedWorkflow;
}
