import equal from "deep-equal";

import { Step, Workflow } from "./workflow";

interface WorkflowCheck {
    highlight?: string;
    level: "info" | "warn" | "error";
    message: string;
}

interface StepMerge {
    step: Step;
    stepName: string;
    action: "same" | "keep" | "update" | "add" | "delete" | "local";
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

export function mergeWorkflows(
    localWorkflow: Workflow,
    remoteWorkflow: Workflow
): Array<StepMerge> {
    const result: Array<StepMerge> = [];
    const localSteps = [
        ...(Object.values(localWorkflow.jobs || {})[0]?.steps || [])
    ];
    const remoteSteps = [
        ...(Object.values(remoteWorkflow.jobs || {})[0]?.steps || [])
    ];
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
            if (step.with?.["github-actions-managed"]) {
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
                if (localStep.with?.["github-actions-managed"]) {
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
        if (step.with?.["github-actions-managed"]) {
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
            level: "warn",
            highlight: "name",
            message:
                "workflow name is different from remote, update with --force"
        });
    }
    if (!equal(local.on, remote.on)) {
        result.push({
            level: "warn",
            highlight: "on:",
            message: "on: section is different from remote, update with --force"
        });
    }
    const stepMerges = mergeWorkflows(local, remote);
    stepMerges.forEach(stepMerge => {
        if (stepMerge.action === "update") {
            result.push({
                level: "warn",
                highlight: stepMerge.stepName,
                message: `step ${stepMerge.stepName} will be overwritten`
            });
        }
        if (stepMerge.action === "local") {
            result.push({
                level: "warn",
                highlight: stepMerge.stepName,
                message: `step ${stepMerge.stepName} exists only locally, so it will be kept untouched`
            });
        }
        if (stepMerge.action === "keep") {
            result.push({
                level: "warn",
                highlight: stepMerge.stepName,
                message: `step ${stepMerge.stepName} is user-edited and will be kept untouched`
            });
        }
        if (stepMerge.action === "add") {
            result.push({
                level: "warn",
                highlight: stepMerge.stepName,
                message: `step ${stepMerge.stepName} will be added`
            });
        }
        if (stepMerge.action === "delete") {
            result.push({
                level: "warn",
                highlight: stepMerge.stepName,
                message: `step ${stepMerge.stepName} will be deleted, set github-actions-managed: false to keep it`
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
            if (!step.name) {
                const stepName = step.id || `${stepIndex + 1}`;
                return result.push({
                    level: "error",
                    highlight: stepName,
                    message: `${jobName} : step ${stepName} has no name, please add it`
                });
            }
            if (!step.with?.["github-actions-managed"]) {
                return result.push({
                    level: "info",
                    highlight: step.name,
                    message: `${jobName} : step ${step.name} will not be updated because github-actions-managed is false`
                });
            }
        });
    });
    return result;
}
