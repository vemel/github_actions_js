import equal from "deep-equal";

import { Check, TAction } from "./check";
import { Workflow } from "./workflow";

export class Checker {
    force: boolean;
    current: Workflow;

    constructor(force: boolean, current: Workflow) {
        this.force = force;
        this.current = current;
    }

    getChecks(update: Workflow): Array<Check> {
        return [
            ...this.getWorkflowChecks(update),
            ...this.getJobChecks(update),
            ...this.getStepChecks(update)
        ];
    }

    getStepErrors(): Array<string> {
        const stepIds = new Set();
        const result: Array<string> = [];
        this.current.job.steps.forEach(step => {
            if (!step.id) return;
            if (stepIds.has(step.id))
                result.push(`${step.name} step has duplicate id ${step.id}`);
        });
        return result;
    }

    getErrors(): Array<string> {
        return [...this.getStepErrors()];
    }

    static getAction(oldValue: unknown, newValue: unknown): TAction {
        if (equal(oldValue, newValue)) return "equal";
        if (!oldValue) return "added";
        if (!newValue) return "deleted";
        return "updated";
    }

    static getCheck(
        item: string,
        force: boolean,
        oldValue: unknown,
        newValue: unknown
    ): Check | null {
        const action = Checker.getAction(oldValue, newValue);
        if (!action) return null;
        return new Check(item, action, force);
    }

    getWorkflowChecks(update: Workflow): Array<Check> {
        return [
            new Check(
                "top comment",
                Checker.getAction(
                    this.current.commentLines,
                    update.commentLines
                ),
                true
            ),
            new Check(
                "workflow name",
                Checker.getAction(this.current.name, update.name),
                true
            ),
            new Check(
                "triggers",
                Checker.getAction(this.current.triggers, update.triggers),
                true
            )
        ];
    }

    getJobChecks(update: Workflow): Array<Check> {
        const currentJob = this.current.job;
        const updateJob = update.job;
        return [
            new Check(
                "environment",
                Checker.getAction(currentJob.env, updateJob.env),
                true
            ),
            new Check(
                "runner",
                Checker.getAction(currentJob.runsOn, updateJob.runsOn),
                true
            ),
            new Check(
                "strategy",
                Checker.getAction(currentJob.strategy, updateJob.strategy),
                true
            ),
            new Check(
                "run condition",
                Checker.getAction(currentJob.runsIf, updateJob.runsIf),
                true
            )
        ];
    }

    getStepChecks(update: Workflow): Array<Check> {
        const currentSteps = this.current.job.steps;
        const updateSteps = update.job.steps;
        return [
            ...currentSteps
                .filter(step => step.findIndex(updateSteps) < 0)
                .map(step => new Check(`${step.name} step`, "deleted")),
            ...updateSteps.map(
                step =>
                    new Check(
                        `${step.name} step`,
                        (() => {
                            const stepIndex = step.findIndex(currentSteps);
                            if (stepIndex < 0) return "added";
                            const localStep = currentSteps[stepIndex];
                            if (!step.isManaged()) return "kept";
                            if (step.equals(localStep)) return "equal";
                            return "updated";
                        })() as TAction
                    )
            )
        ];
    }
}
