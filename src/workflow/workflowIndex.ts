import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { EXTENSIONS } from "./../constants.js";
import { listWorkflowURLs } from "./../github.js";
import { isFileURL, isGitHubURL } from "./../urlUtils.js";
import { WorkflowResource } from "./resource.js";

export class WorkflowIndex {
    url: string;
    name: string;
    names: Array<string>;
    workflowsPath: string;
    shortcut: string;
    private _workflows: Array<WorkflowResource>;

    constructor(
        url: string,
        workflowsPath: string,
        workflowURLs: Array<string>
    ) {
        this.url = url;
        this.name = url;
        this.workflowsPath = workflowsPath;
        this._workflows = workflowURLs.map(
            url => new WorkflowResource(url, this.workflowsPath)
        );
        this.names = this._workflows.map(w => w.name);
        this.shortcut = "";
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

    static async fromURL(
        url: string,
        workflowsPath: string
    ): Promise<WorkflowIndex> {
        if (isFileURL(url))
            return WorkflowIndex.fromFileURL(url, workflowsPath);
        if (isGitHubURL(url))
            return WorkflowIndex.fromGitHubURL(url, workflowsPath);
        throw new Error(
            `URL ${url} is not supported, provide https://github.com URL or file url`
        );
    }

    static async fromGitHubURL(
        url: string,
        workflowsPath: string
    ): Promise<WorkflowIndex> {
        const workflowURLs = (await listWorkflowURLs(url)).filter(url =>
            EXTENSIONS.includes(path.parse(url).ext)
        );
        const result = new WorkflowIndex(url, workflowsPath, workflowURLs);
        return result;
    }

    static async fromFileURL(
        url: string,
        workflowsPath: string
    ): Promise<WorkflowIndex> {
        const rootPath = fileURLToPath(url);
        const files = fs.readdirSync(rootPath);
        const workflows: Array<string> = files
            .filter(filePath => EXTENSIONS.includes(path.parse(filePath).ext))
            .map(filePath => pathToFileURL(path.join(rootPath, filePath)).href);
        return new WorkflowIndex(url, workflowsPath, workflows);
    }
}
