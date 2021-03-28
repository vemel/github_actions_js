import equal from "deep-equal";

import { getTopCommentLines, getWorkflowData } from "./manager";
import { decapitalize } from "./utils";
import { Step, Workflow } from "./workflow";

export interface WorkflowCheck {
    highlight?: string;
    level: "info" | "success" | "update" | "delete" | "add" | "error";
    item: string;
    noForceMessage?: string;
    checkMessage: string;
    updateMessage: string;
}

interface StepMerge {
    step: Step;
    stepName: string;
    action: "same" | "keep" | "update" | "add" | "delete" | "local";
}

export function getCheckIcon(check: WorkflowCheck): string {
    return {
        info: "✓",
        success: "✓",
        update: "↻",
        delete: "✖",
        add: "✎",
        error: "✗"
    }[check.level];
}

function findStepIndex(step: Step, steps: Array<Step>): number {
    for (let i = 0; i < steps.length; i++) {
        const item = steps[i];
        if (item.id === step.id) return i;
    }
    return -1;
}

export function mergesToSteps(merges: Array<StepMerge>): Array<Step> {
    const result: Array<Step> = [];
    merges.forEach(stepMerge => {
        if (
            ["same", "keep", "update", "add", "local"].includes(
                stepMerge.action
            )
        ) {
            result.push(stepMerge.step);
        }
    });
    return result;
}

export function isStepManaged(step: Step): boolean {
    if (step.with?.["github-actions-managed"]) return true;
    if (step.run) {
        const lines = step.run.split(/\r?\n/).map(x => x.trim());
        if (lines.includes("# github-actions-managed: true")) return true;
    }
    if (step.with?.script) {
        const lines = step.with.script.split(/\r?\n/).map(x => x.trim());
        if (lines.includes("// github-actions-managed: true")) return true;
    }
    return false;
}

function getSteps(workflow: Workflow): Array<Step> {
    const jobs = Object.values(workflow.jobs || {});
    if (!jobs.length) return [];
    return jobs[0].steps || [];
}

export function mergeWorkflows(
    localWorkflow: Workflow,
    remoteWorkflow: Workflow
): Array<StepMerge> {
    const result: Array<StepMerge> = [];
    const localSteps = getSteps(localWorkflow);
    const remoteSteps = getSteps(remoteWorkflow);
    remoteSteps.reverse().forEach((remoteStep, remoteIndex) => {
        const localStepIndex = findStepIndex(remoteStep, localSteps);
        if (localStepIndex < 0) {
            result.push({
                step: remoteStep,
                stepName: remoteStep.name || remoteStep.id || `${remoteIndex}`,
                action: "add"
            });
            return;
        }
        const [localStep, ...followSteps] = localSteps.splice(localStepIndex);
        followSteps.reverse().forEach(step => {
            if (isStepManaged(step)) {
                result.push({
                    step: step,
                    stepName: step.name || step.id || `${remoteIndex}`,
                    action: "delete"
                });
            } else {
                result.push({
                    step: step,
                    stepName: step.name || step.id || `${remoteIndex}`,
                    action: "local"
                });
            }
        });
        if (localStep.id === remoteStep.id) {
            if (equal(localStep, remoteStep)) {
                result.push({
                    step: localStep,
                    stepName:
                        localStep.name || localStep.id || `${remoteIndex}`,
                    action: "same"
                });
            } else {
                if (isStepManaged(localStep)) {
                    result.push({
                        step: remoteStep,
                        stepName:
                            remoteStep.name ||
                            remoteStep.id ||
                            `${remoteIndex}`,
                        action: "update"
                    });
                } else {
                    result.push({
                        step: localStep,
                        stepName:
                            localStep.name || localStep.id || `${remoteIndex}`,
                        action: "keep"
                    });
                }
            }
        }
    });
    localSteps.reverse().forEach(step => {
        if (isStepManaged(step)) {
            result.push({
                step: step,
                stepName: step.name || step.id || "0",
                action: "delete"
            });
        } else {
            result.push({
                step: step,
                stepName: step.name || step.id || "0",
                action: "local"
            });
        }
    });
    return result.reverse();
}

export function checkWorkflowRemote(
    local: Workflow,
    remote: Workflow
): Array<WorkflowCheck> {
    const result: Array<WorkflowCheck> = [];
    if (!equal(local.name, remote.name)) {
        result.push({
            level: "update",
            item: "name",
            highlight: remote.name,
            noForceMessage: "is different from remote",
            checkMessage: `will be updated to ${remote.name}`,
            updateMessage: `updated to ${remote.name}`
        });
    }
    if (!equal(local.on, remote.on)) {
        result.push({
            level: "update",
            item: "triggers",
            highlight: "updated",
            noForceMessage: "are different from remote",
            checkMessage: "will be updated",
            updateMessage: "updated"
        });
    }
    const stepMerges = mergeWorkflows(local, remote);
    stepMerges.forEach(stepMerge => {
        if (stepMerge.action === "update") {
            result.push({
                level: "update",
                highlight: "updated",
                item: stepMerge.stepName,
                checkMessage: "step will be updated",
                updateMessage: "step is updated"
            });
        }
        if (stepMerge.action === "local") {
            result.push({
                level: "info",
                highlight: "kept untouched",
                item: stepMerge.stepName,
                checkMessage: "local-only step will be kept untouched",
                updateMessage: "local-only step is kept untouched"
            });
        }
        if (stepMerge.action === "keep") {
            result.push({
                level: "info",
                highlight: "kept untouched",
                item: stepMerge.stepName,
                checkMessage: "step will be kept untouched",
                updateMessage: "step is kept untouched"
            });
        }
        if (stepMerge.action === "add") {
            result.push({
                level: "add",
                highlight: "added",
                item: stepMerge.stepName,
                checkMessage: "step will be added",
                updateMessage: "step added"
            });
        }
        if (stepMerge.action === "delete") {
            result.push({
                level: "delete",
                highlight: "deleted",
                item: stepMerge.stepName,
                checkMessage:
                    "step will be deleted, remove github-actions-managed to keep it",
                updateMessage: "step deleted"
            });
        }
    });
    return result;
}

export function checkWorkflow(workflow: Workflow): Array<WorkflowCheck> {
    const result: Array<WorkflowCheck> = [];
    Object.keys(workflow.jobs || {}).forEach(jobName => {
        const job = (workflow.jobs || {})[jobName];
        if (!job) return;
        job.steps?.forEach((step, stepIndex) => {
            const stepName = step.name || step.id || `${stepIndex + 1}`;
            if (!step.name) {
                return result.push({
                    level: "error",
                    highlight: "name",
                    item: stepName,
                    checkMessage: "step has no name, please add it",
                    updateMessage: "step has no name, please add it"
                });
            }
        });
    });
    return result;
}

function validateWorkflow(workflow: Workflow): Array<WorkflowCheck> {
    const result: Array<WorkflowCheck> = [];
    const steps = getSteps(workflow);
    const stepIds = new Set();
    steps.forEach(step => {
        if (!step.id) return;
        if (stepIds.has(step.id))
            result.push({
                level: "error",
                item: step.id,
                checkMessage: "step id is not unique",
                updateMessage: "step id is not unique"
            });
        stepIds.add(step.id);
    });

    return result;
}

export function getWorkflowChecks(
    localContent: string | null,
    remoteContent: string | null
): Array<WorkflowCheck> {
    const result: Array<WorkflowCheck> = [];
    if (!remoteContent) {
        result.push({
            level: "error",
            item: "remote workflow",
            highlight: "failed",
            checkMessage: "download failed",
            updateMessage: "download failed"
        });
        return result;
    }
    const remoteData = getWorkflowData(remoteContent);
    const workflowPurpose = decapitalize(remoteData.name);
    if (!localContent) {
        result.push({
            level: "info",
            item: "workflow",
            highlight: workflowPurpose,
            checkMessage: `will be created to ${workflowPurpose}`,
            updateMessage: `created to ${workflowPurpose}`
        });
        return result;
    }
    const data = getWorkflowData(localContent);
    result.push(...validateWorkflow(data));
    result.push(...checkWorkflow(data));

    if (
        !equal(
            getTopCommentLines(localContent),
            getTopCommentLines(remoteContent)
        )
    ) {
        result.push({
            level: "update",
            item: "top comment",
            highlight: "updated",
            noForceMessage: "is different from remote",
            checkMessage: "will be updated",
            updateMessage: "updated"
        });
    }
    result.push(...checkWorkflowRemote(data, remoteData));
    return result;
}
