import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { DOCS_URL } from "./constants";
import { getIndexResource } from "./indexes";

export interface Namespace {
    help: boolean;
    version: boolean;
    names: Array<string>;
    ref: string;
    path: string;
    force: boolean;
    update: boolean;
    list: boolean;
    diff: boolean;
    clean: boolean;
    index: string;
}

export function getHelp(): string {
    return commandLineUsage([
        {
            header: "GitHub Actions Manager",
            content: [
                "CLI tool to install and update GitHub Actions",
                "",
                `Documentation: ${DOCS_URL}`,
                "",
                "{bold ghactions} - Run in interactive mode",
                "{bold ghactions -i node} - Manage workflows for Node.js projects",
                "{bold ghactions -i python} - Manage workflows for Python projects"
            ].join("\n")
        },
        {
            header: "Options",
            optionList: [
                {
                    name: "names",
                    alias: "n",
                    typeLabel: "name",
                    multiple: true,
                    description: `Workflow name {bold <name>}.yml, {bold all}, or {bold installed}, default: {bold interactive mode}`
                },
                {
                    name: "ref",
                    alias: "r",
                    typeLabel: "version",
                    description:
                        "Update workflows to a specific tag/branch, default: {bold main}"
                },
                {
                    name: "index",
                    alias: "i",
                    typeLabel: "url",
                    description:
                        "Link to workflows index YAML file, supports {bold ref} placeholder",
                    type: String
                },
                {
                    name: "path",
                    alias: "p",
                    typeLabel: "path",
                    description: `Path to GitHub project root, default {bold CWD}`,
                    type: Boolean
                },
                {
                    name: "update",
                    alias: "u",
                    description: "Apply suggested changes",
                    type: Boolean
                },
                {
                    name: "force",
                    alias: "f",
                    description: "Update user-managed workflow parts",
                    type: Boolean
                },
                {
                    name: "list",
                    alias: "l",
                    description: "List available workflows",
                    type: Boolean
                },
                {
                    name: "diff",
                    alias: "d",
                    description: "Show diff for update and check runs",
                    type: Boolean
                },
                {
                    name: "clean",
                    alias: "c",
                    description:
                        "Do not add {bold github-actions-managed} marker to workflow steps",
                    type: Boolean
                },
                {
                    name: "help",
                    alias: "h",
                    description: "Print this usage guide",
                    type: Boolean
                },
                {
                    name: "version",
                    alias: "v",
                    description: "Show package version",
                    type: Boolean
                }
            ]
        }
    ]);
}

export function parseArgs(): Namespace {
    const result = <Namespace>commandLineArgs([
        { name: "version", alias: "v", type: Boolean },
        { name: "list", alias: "l", type: Boolean },
        { name: "diff", alias: "d", type: Boolean },
        { name: "clean", alias: "c", type: Boolean },
        { name: "help", alias: "h", type: Boolean },
        { name: "force", alias: "f", type: Boolean },
        { name: "update", alias: "u", type: Boolean },
        { name: "index", alias: "i", type: String },
        { name: "path", alias: "p", type: String },
        {
            name: "names",
            alias: "n",
            type: String,
            multiple: true,
            defaultOption: true
        },
        {
            name: "ref",
            alias: "r",
            type: String
        }
    ]);
    result.names = result.names || [];
    result.help = result.help || false;
    result.force = result.force || false;
    result.update = result.update || false;
    result.ref = result.ref || "main";
    result.path = result.path || ".";
    result.index = getIndexResource(result.index || "").url;
    return result;
}
