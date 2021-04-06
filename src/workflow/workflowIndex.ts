import yaml from "js-yaml";

import { download, joinURL } from "../urlUtils";
import { IWorkflow, WorkflowResource } from "./resource";

export interface IWorkflowIndex {
    name: string;
    id: string;
    documentation?: string;
    workflows: Array<IWorkflow>;
}

export class WorkflowIndex {
    url: string;
    data: IWorkflowIndex;
    name: string;
    workflowsPath: string;
    private _workflows: Array<WorkflowResource>;

    constructor(url: string, data: IWorkflowIndex, workflowsPath: string) {
        this.data = data;
        this.url = url;
        this.name = this.data.name;
        this.workflowsPath = workflowsPath;
        this._workflows = this.data.workflows.map(
            data =>
                new WorkflowResource(
                    data,
                    this.workflowsPath,
                    this.getURL(data.url),
                    this.data
                )
        );
    }

    get names(): Array<string> {
        return this.data.workflows.map(w => w.name);
    }

    getURL(url: string): string {
        if (url.startsWith("./")) {
            return joinURL(this.url, url);
        }
        return url;
    }

    getWorkflow(name: string): WorkflowResource {
        const workflow = this._workflows.find(w => w.name === name);
        if (!workflow)
            throw new Error(`Workflow ${name} does not exist in index`);
        return workflow;
    }

    getAllWorkflows(): Array<WorkflowResource> {
        return this.names.map(name => this.getWorkflow(name));
    }

    getInstalledWorkflows(): Array<WorkflowResource> {
        return this.getAllWorkflows().filter(workflow =>
            workflow.existsLocally()
        );
    }

    getWorkflows(names: Array<string>): Array<WorkflowResource> {
        const result: Array<WorkflowResource> = [];
        names.forEach(name => {
            const workflows: Array<WorkflowResource> = {
                all: this.getAllWorkflows(),
                installed: this.getInstalledWorkflows()
            }[name] || [this.getWorkflow(name)];
            result.push(
                ...workflows.filter(
                    w => !result.map(x => x.name).includes(w.name)
                )
            );
        });
        return result;
    }

    static async download(
        url: string,
        ref: string,
        workflowsPath: string
    ): Promise<WorkflowIndex> {
        url = url.replace("{ref}", ref);
        const content = await download(url);
        const data = yaml.load(content) as IWorkflowIndex;
        return new WorkflowIndex(url, data, workflowsPath);
    }
}
