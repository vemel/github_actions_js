import equal from "deep-equal";

import { Check, TAction } from "./check";
import { Step } from "./step";
import { Workflow } from "./workflow";

export class Checker {
    force: boolean;
    current: Workflow;

    constructor(force: boolean, current: Workflow) {
        this.force = force;
        this.current = current;
    }

    getChecks(update: Workflow): Array<Check> {
        const errors = this.getErrors();
        if (errors.length) return errors;

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

    getErrors(): Array<Check> {
        return this.getStepErrors().map(error => new Check(error, "error"));
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
        return new Check(item, action, force, oldValue, newValue);
    }

    getWorkflowChecks(update: Workflow): Array<Check> {
        return [
            new Check(
                "top comment",
                Checker.getAction(
                    this.current.commentLines,
                    update.commentLines
                ),
                true,
                this.current.commentLines.join("\n"),
                update.commentLines.join("\n")
            ),
            new Check(
                "workflow name",
                Checker.getAction(this.current.name, update.name),
                true,
                this.current.name,
                update.name
            ),
            new Check(
                "trigger",
                Checker.getAction(this.current.triggers, update.triggers),
                true,
                this.current.triggers,
                update.triggers
            )
        ];
    }

    getJobChecks(update: Workflow): Array<Check> {
        const currentJob = this.current.job;
        const updateJob = update.job;
        return [
            new Check(
                "job environment",
                Checker.getAction(currentJob.env, updateJob.env),
                true,
                currentJob.env,
                updateJob.env
            ),
            new Check(
                "job runner",
                Checker.getAction(currentJob.runsOn, updateJob.runsOn),
                true,
                currentJob.runsOn,
                updateJob.runsOn
            ),
            new Check(
                "job strategy",
                Checker.getAction(currentJob.strategy, updateJob.strategy),
                true,
                currentJob.strategy,
                updateJob.strategy
            ),
            new Check(
                "job run condition",
                Checker.getAction(currentJob.runsIf, updateJob.runsIf),
                true,
                currentJob.runsIf,
                updateJob.runsIf
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
            ...updateSteps.map(step => {
                const stepIndex = step.findIndex(currentSteps);
                const localStep = currentSteps[stepIndex] || new Step({});
                return new Check(
                    `${step.name} step`,
                    (() => {
                        if (stepIndex < 0) return "added";
                        if (!step.isManaged()) return "kept";
                        if (step.equals(localStep)) return "equal";
                        return "updated";
                    })() as TAction,
                    false,
                    localStep,
                    step
                );
            })
        ];
    }
}
