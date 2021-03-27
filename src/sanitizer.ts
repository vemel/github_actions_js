import equal from "deep-equal";

import { Workflow } from "./workflow";

interface WorkflowCheck {
    highlight?: string;
    level: "info" | "warn" | "error";
    message: string;
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
    return result;
}

export function checkWorkflow(workflow: Workflow): Array<WorkflowCheck> {
    const result: Array<WorkflowCheck> = [];
    Object.keys(workflow.jobs || {}).forEach(jobName => {
        const job = (workflow.jobs || {})[jobName];
        if (!job) return;
        job.steps?.forEach((step, stepIndex) => {
            if (!step.name) {
                const stepName = step.name || `${stepIndex + 1}`;
                return result.push({
                    level: "error",
                    highlight: stepName,
                    message: `${jobName} : step ${stepName} has no name, update can duplicate it accidentally`
                });
            }
            if (!step.id) {
                return result.push({
                    level: "error",
                    highlight: step.name,
                    message: `${jobName} : step ${step.name} has no id, update can duplicate it accidentally`
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
