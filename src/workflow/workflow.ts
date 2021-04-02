import yaml from "js-yaml";

import { IJobData, Job } from "./job";

interface Jobs {
    [index: string]: IJobData;
}

export interface IWorkflowData {
    name: string;
    on?: unknown;
    jobs?: Jobs;
    [index: string]: unknown;
}

export class Workflow {
    data: IWorkflowData;
    commentLines: Array<string>;

    constructor(data: IWorkflowData, commentLines: Array<string>) {
        this.data = data;
        this.commentLines = commentLines;
    }

    get name(): string {
        return this.data.name;
    }

    set name(value: string) {
        this.data.name = value;
    }

    get triggers(): unknown {
        return this.data.on;
    }

    set triggers(value: unknown) {
        this.data.on = value;
    }

    get job(): Job {
        const jobs = Object.values(this.data.jobs || {});
        if (jobs.length) return new Job(jobs[0]);
        return new Job({ "runs-on": "ubuntu:latest", steps: [] });
    }

    set job(value: Job) {
        if (!this.data.jobs) this.data.jobs = {};
        const jobNames = Object.keys(this.data.jobs);
        const jobName = jobNames.length ? jobNames[0] : "build";
        this.data.jobs[jobName] = value.data;
    }

    render(): string {
        const comment = this.commentLines
            .map(line => (line ? `# ${line}` : "#"))
            .join("\n");
        const body = yaml.dump(this.data, {
            lineWidth: 999,
            quotingType: '"'
        });
        return [comment, body].filter(x => x).join("\n\n");
    }

    static fromString(content: string): Workflow {
        const data = yaml.load(content) as IWorkflowData;
        const commentLines = content
            .split(/\r?\n/)
            .filter(line => line.startsWith("# ") || line === "#")
            .map(line => line.substr(2));
        return new Workflow(data, commentLines);
    }

    clone(): Workflow {
        return Workflow.fromString(this.render());
    }
}
