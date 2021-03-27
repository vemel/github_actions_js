export interface StepWith {
    "github-actions-managed"?: boolean;
    "github-actions-comment"?: string;
}

export interface Step {
    name?: string;
    id?: string;
    with?: StepWith;
}

export interface Jobs {
    [index: string]: Job;
}

export interface Job {
    steps?: Array<Step>;
    "runs-on": string;
    if?: string;
}

export interface Workflow {
    name: string;
    on?: unknown;
    jobs?: Jobs;
}
