import equal from "deep-equal";

import { Workflow } from "./workflow";

type TAction = "updated" | "deleted" | "added" | "equal";

export interface ICheck {
    highlight?: string;
    action: TAction;
    item: string;
    force?: boolean;
    checkMessage?: string;
    updateMessage?: string;
}

export class Checker {
    force: boolean;
    current: Workflow;

    constructor(force: boolean, current: Workflow) {
        this.force = force;
        this.current = current;
    }

    getChecks(update: Workflow): Array<ICheck> {
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
    ): ICheck | null {
        const action = Checker.getAction(oldValue, newValue);
        if (!action) return null;
        return {
            item,
            action,
            force
        };
    }

    getWorkflowChecks(update: Workflow): Array<ICheck> {
        return [
            {
                item: "top comment",
                action: Checker.getAction(
                    this.current.commentLines,
                    update.commentLines
                ),
                force: true
            },
            {
                item: "workflow name",
                action: Checker.getAction(this.current.name, update.name),
                force: true
            },
            {
                item: "triggers",
                action: Checker.getAction(
                    this.current.triggers,
                    update.triggers
                ),
                force: true
            }
        ];
    }

    getJobChecks(update: Workflow): Array<ICheck> {
        const currentJob = this.current.job;
        const updateJob = update.job;
        return [
            {
                item: "environment",
                action: Checker.getAction(currentJob.env, updateJob.env),
                force: true
            },
            {
                item: "runner",
                action: Checker.getAction(currentJob.runsOn, updateJob.runsOn),
                force: true
            },
            {
                item: "strategy",
                action: Checker.getAction(
                    currentJob.strategy,
                    updateJob.strategy
                ),
                force: true
            },
            {
                item: "run condition",
                action: Checker.getAction(currentJob.runsIf, updateJob.runsIf),
                force: true
            }
        ];
    }

    getStepChecks(update: Workflow): Array<ICheck> {
        const currentSteps = this.current.job.steps;
        const updateSteps = update.job.steps;
        return [
            ...currentSteps
                .filter(step => step.findIndex(updateSteps) < 0)
                .map(
                    step =>
                        ({
                            item: `${step.name} step`,
                            action: "deleted"
                        } as ICheck)
                ),
            ...updateSteps.map(step => ({
                item: `${step.name} step`,
                action: (() => {
                    const stepIndex = step.findIndex(currentSteps);
                    if (stepIndex < 0) return "added";
                    const localStep = currentSteps[stepIndex];
                    if (step.isEqual(localStep)) return "equal";
                    return "updated";
                })() as TAction
            }))
        ];
    }

    static getCheckIcon(check: ICheck): string {
        return {
            equal: "✓",
            updated: "↻",
            deleted: "✖",
            added: "✎"
        }[check.action];
    }
}
