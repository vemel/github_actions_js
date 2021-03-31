import { Workflow } from "./workflow";

export class Merger {
    force: boolean;

    constructor(force: boolean) {
        this.force = force;
    }

    mergeWorkflow(current: Workflow, update: Workflow): void {
        if (this.force) current.commentLines = update.commentLines;
        if (this.force) current.name = update.name;
        if (this.force) current.triggers = update.triggers;
    }

    mergeJob(current: Workflow, update: Workflow): void {
        const currentJob = current.job;
        const updateJob = update.job;

        if (this.force) currentJob.env = updateJob.env;
        if (this.force) currentJob.runsOn = updateJob.runsOn;
        if (this.force) currentJob.runsIf = updateJob.runsIf;
        if (this.force) currentJob.strategy = updateJob.strategy;
    }

    mergeSteps(current: Workflow, update: Workflow): void {
        const currentJob = current.job;
        const updateSteps = update.job.steps.map(step => step.makeManaged());
        currentJob.steps = currentJob.mergeSteps(updateSteps);
    }

    merge(current: Workflow, update: Workflow): Workflow {
        const result = current.clone();
        this.mergeWorkflow(result, update);
        this.mergeJob(result, update);
        this.mergeSteps(result, update);
        return result;
    }
}
