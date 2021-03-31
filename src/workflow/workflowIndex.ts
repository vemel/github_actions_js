import download from "download";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { promisify } from "util";

import { UTF8 } from "../constants";
import { getTempDir, joinURL } from "../utils";
import { IWorkflow, WorkflowResource } from "./resource";

export interface IWorkflowIndex {
    name: string;
    workflows: Array<IWorkflow>;
}

export class WorkflowIndex {
    url: string;
    data: IWorkflowIndex;
    name: string;

    constructor(url: string, data: IWorkflowIndex) {
        this.data = data;
        this.url = url;
        this.name = this.data.name;
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

    getWorkflow(name: string, workflowsPath: string): WorkflowResource {
        const data = this.data.workflows.find(w => w.name === name);
        if (!data) throw new Error(`Workflow ${name} does not exist in index`);
        return new WorkflowResource(data, workflowsPath, this.getURL(data.url));
    }

    getWorkflows(
        names: Array<string>,
        workflowsPath: string
    ): Array<WorkflowResource> {
        if (!names.length || names.includes("all")) names = this.names;
        return names.map(name => this.getWorkflow(name, workflowsPath));
    }

    static async download(url: string): Promise<WorkflowIndex> {
        const tempPath = getTempDir();
        const downloadPath = path.join(tempPath, "index.yml");
        await download(url, tempPath, { filename: "index.yml" });
        const content = await promisify(fs.readFile)(downloadPath, {
            encoding: UTF8
        });
        await promisify(fs.rmdir)(tempPath, { recursive: true });
        const data = yaml.load(content) as IWorkflowIndex;
        return new WorkflowIndex(url, data);
    }
}
