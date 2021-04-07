import { IStepData, Step } from "./step";

interface IEnv {
    [index: string]: string;
}
interface IStrategy {
    [index: string]: unknown;
}

export interface IJobData {
    steps: Array<IStepData>;
    "runs-on": string;
    if?: string;
    env?: IEnv;
    strategy?: IStrategy;
    [index: string]: unknown;
}

export class Job {
    name: string;
    data: IJobData;

    constructor(name: string, data: IJobData) {
        this.name = name;
        this.data = data;
    }

    get title(): string {
        return `job ${this.name}`;
    }

    get runsOn(): string {
        return this.data["runs-on"];
    }
    set runsOn(value: string) {
        this.data["runs-on"] = value;
    }

    get strategy(): IStrategy | undefined {
        return this.data.strategy;
    }
    set strategy(value: IStrategy | undefined) {
        if (value) this.data.strategy = value;
        else delete this.data.strategy;
    }

    get runsIf(): string | undefined {
        return this.data.if;
    }
    set runsIf(value: string | undefined) {
        if (value) this.data.if = value;
        else delete this.data.if;
    }

    get env(): IEnv | undefined {
        return this.data.env;
    }
    set env(value: IEnv | undefined) {
        if (value) this.data.env = value;
        else delete this.data.env;
    }

    get steps(): Array<Step> {
        return this.data.steps.map(data => new Step(data));
    }

    set steps(value: Array<Step>) {
        this.data.steps = value.map(step => step.data);
    }

    mergeSteps(newSteps: Array<Step>): Array<Step> {
        const result: Array<Step> = [];
        const localSteps = this.steps;
        newSteps.reverse().forEach(newStep => {
            const localStepIndex = newStep.findIndex(localSteps);
            if (localStepIndex < 0) return result.push(newStep);

            const [localStep, ...followSteps] = localSteps.splice(
                localStepIndex
            );
            result.push(
                ...followSteps.reverse().filter(step => !step.isManaged())
            );
            if (!localStep.isManaged()) return result.push(localStep);

            result.push(newStep);
        });
        result.push(...localSteps.reverse().filter(step => !step.isManaged()));
        return result.reverse();
    }

    clone(): Job {
        const newData = JSON.parse(JSON.stringify(this.data));
        return new Job(this.name, newData);
    }
}
