import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { DOCS_URL } from "./constants";

export interface Namespace {
    help: boolean;
    update: Array<string>;
    ref: string;
    force: boolean;
    check: boolean;
    index?: string;
}

export function getHelp(): string {
    return commandLineUsage([
        {
            header: "GitHubActions",
            content: "GitHub Actions manager\n\n" + `Documentation: ${DOCS_URL}`
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
                    description: "Update workflow user-managed workflow parts",
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
                        "Check if workflows are are update-friendly, does not update workflows",
                    type: Boolean
                },
                {
                    name: "index",
                    alias: "i",
                    typeLabel: "URL",
                    description:
                        "Link to workflows index YAML file. Supports {bold ref} placeholder.",
                    type: String
                }
            ]
        }
    ]);
}

export function parseArgs(): Namespace {
    const result = <Namespace>commandLineArgs([
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
