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

    mergeJobs(current: Workflow, update: Workflow): void {
        update.jobNames.forEach(jobName => {
            const updateJob = update.getJob(jobName);
            if (!current.jobNames.includes(jobName)) {
                current.setJob(updateJob.clone());
                return;
            }

            const currentJob = current.getJob(jobName);
            if (this.force) currentJob.env = updateJob.env;
            if (this.force) currentJob.runsOn = updateJob.runsOn;
            if (this.force) currentJob.runsIf = updateJob.runsIf;
            if (this.force) currentJob.strategy = updateJob.strategy;

            const updateSteps = updateJob.steps.map(step => step.makeManaged());
            currentJob.steps = currentJob.mergeSteps(updateSteps);
        });
        if (this.force)
            current.jobNames
                .filter(jobName => !update.jobNames.includes(jobName))
                .map(jobName => {
                    current.deleteJob(jobName);
                });
    }

    merge(current: Workflow, update: Workflow): Workflow {
        const result = current.clone();
        this.mergeWorkflow(result, update);
        this.mergeJobs(result, update);
        return result;
    }
}
