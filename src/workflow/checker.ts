import equal from "deep-equal";

import { Check, TAction } from "./check";
import { Job } from "./job";
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
            ...this.getJobsChecks(update)
        ];
    }

    getStepErrors(currentJob: Job): Array<string> {
        const stepIds = new Set();
        const result: Array<string> = [];
        currentJob.steps.forEach(step => {
            if (!step.id) return;
            if (stepIds.has(step.id))
                result.push(`${step.name} step has duplicate id ${step.id}`);
        });
        return result;
    }

    getErrors(): Array<Check> {
        const result = [] as Array<Check>;
        this.current.jobs.forEach(job => {
            this.getStepErrors(job).map(
                error => new Check("error", "error", false, error)
            );
        });
        return result;
    }

    static getAction(oldValue: unknown, newValue: unknown): TAction {
        if (equal(oldValue, newValue)) return "equal";
        if (!oldValue) return "added";
        if (!newValue) return "deleted";
        return "updated";
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

    getJobsChecks(update: Workflow): Array<Check> {
        const result = [] as Array<Check>;
        update.jobNames.forEach(jobName => {
            const updateJob = update.getJob(jobName);
            if (!this.current.jobNames.includes(jobName)) {
                result.push(new Check("job", "added", false, null, updateJob));
                return;
            }
            const currentJob = this.current.getJob(jobName);
            result.push(...this.getJobChecks(currentJob, updateJob));
        });
        this.current.jobNames
            .filter(jobName => !update.jobNames.includes(jobName))
            .map(jobName => {
                const currentJob = this.current.getJob(jobName);
                result.push(
                    new Check("job", "deleted", true, currentJob, null)
                );
            });
        return result;
    }

    getJobChecks(currentJob: Job, updateJob: Job): Array<Check> {
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
            ),
            ...this.getStepChecks(currentJob, updateJob)
        ];
    }

    getStepChecks(currentJob: Job, updateJob: Job): Array<Check> {
        const currentSteps = currentJob.steps;
        const updateSteps = updateJob.steps;
        return [
            ...currentSteps
                .filter(step => step.findIndex(updateSteps) < 0)
                .map(step => new Check("step", "deleted", false, step)),
            ...updateSteps.map(step => {
                const stepIndex = step.findIndex(currentSteps);
                const localStep = currentSteps[stepIndex] || new Step({});
                return new Check(
                    "step",
                    (() => {
                        if (stepIndex < 0) return "added";
                        if (!localStep.isManaged()) return "kept";
                        if (localStep.equals(step)) return "equal";
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
