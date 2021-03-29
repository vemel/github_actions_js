import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { DOCS_URL } from "./constants";

export interface Namespace {
    help: boolean;
    update: Array<string>;
    ref: string;
    force: boolean;
    check: boolean;
    list: boolean;
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
                    description: `Create or update action .github/workflows/<name>.yml, or {bold all} to update all`
                },
                {
                    name: "ref",
                    alias: "r",
                    typeLabel: "version",
                    description: "Update actions to a specific tag/version"
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
                        "Check if actions are are update-friendly, does not update actions",
                    type: Boolean
                },
                {
                    name: "index",
                    alias: "i",
                    typeLabel: "URL",
                    description:
                        "Link to actions index YAML file. Supports {bold ref} placeholder.",
                    type: String
                },
                {
                    name: "list",
                    alias: "l",
                    description: "List available actions.",
                    type: Boolean
                }
            ]
        }
    ]);
}

export function parseArgs(): Namespace {
    const result = <Namespace>commandLineArgs([
        { name: "list", alias: "l", type: Boolean },
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
