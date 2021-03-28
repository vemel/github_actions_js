export interface StepWith {
    "github-actions-managed"?: boolean;
    "github-actions-comment"?: string;
    script?: string;
    [index: string]: unknown;
}

export interface Step {
    name?: string;
    id?: string;
    with?: StepWith;
    env?: Env;
    run?: string;
    [index: string]: unknown;
}

export interface Jobs {
    [index: string]: Job;
}

interface Env {
    [index: string]: string;
}

export interface Job {
    steps?: Array<Step>;
    "runs-on": string;
    if?: string;
    env?: Env;
    [index: string]: unknown;
}

export interface Workflow {
    name: string;
    on?: unknown;
    jobs?: Jobs;
    strategy?: unknown;
    [index: string]: unknown;
}
