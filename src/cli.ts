import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { DOCS_URL } from "./constants";

export interface Namespace {
    help: boolean;
    version: boolean;
    update: Array<string>;
    ref: string;
    force: boolean;
    check: boolean;
    list: boolean;
    diff: boolean;
    index?: string;
}

export function getHelp(): string {
    return commandLineUsage([
        {
            header: "GitHub Actions Manager",
            content:
                "CLI tool to install and update GitHub Actions\n\n" +
                `Documentation: ${DOCS_URL}\n`
        },
        {
            header: "Options",
            optionList: [
                {
                    name: "update",
                    alias: "u",
                    typeLabel: "name",
                    multiple: true,
                    description: `Create or update workflow .github/workflows/<name>.yml, or {bold all} to update all`
                },
                {
                    name: "ref",
                    alias: "r",
                    typeLabel: "version",
                    description: "Update workflows to a specific tag/version"
                },
                {
                    name: "force",
                    alias: "f",
                    description: "Update user-managed workflow parts",
                    type: Boolean
                },
                {
                    name: "help",
                    alias: "h",
                    description: "Print this usage guide",
                    type: Boolean
                },
                {
                    name: "check",
                    alias: "c",
                    description:
                        "Check if workflows are are update-friendly, does not update files",
                    type: Boolean
                },
                {
                    name: "index",
                    alias: "i",
                    typeLabel: "URL",
                    description:
                        "Link to workflows index YAML file, supports {bold ref} placeholder",
                    type: String
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
        { name: "help", alias: "h", type: Boolean },
        { name: "force", alias: "f", type: Boolean },
        { name: "check", alias: "c", type: Boolean },
        { name: "index", alias: "i", type: String },
        {
            name: "update",
            alias: "u",
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
    result.help = result.help || false;
    result.force = result.force || false;
    result.ref = result.ref || "main";
    result.update = result.update || [];
    return result;
}
