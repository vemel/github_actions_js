import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { HELP_WORKFLOW_NAMES, WORKFLOW_NAMES } from "./constants";

export interface Namespace {
    help: boolean;
    update: Array<string>;
    ref: string;
    force: boolean;
    check: boolean;
    language: "python" | "javascript" | null;
}

export function getHelp(): string {
    return commandLineUsage([
        {
            header: "GitHubActions",
            content:
                "Universal GitHub Actions pack for JavaScript/TypeScript projects\n\n" +
                "Documentation: https://github.com/vemel/github_actions_js"
        },
        {
            header: "Options",
            optionList: [
                {
                    name: "update",
                    alias: "u",
                    typeLabel: "name",
                    multiple: true,
                    description: `Create or update workflow .github/workflows/<name>.yml. Choices: ${HELP_WORKFLOW_NAMES.map(
                        x => `\n- ${x}`
                    ).join("")}`
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
                    name: "language",
                    alias: "l",
                    typeLabel: "lang",
                    description: "Project language: python or javascript",
                    type: String
                }
            ]
        }
    ]);
}

function getWorkflowNames(names: Array<string> | null): Array<string> {
    let result = names || [];
    if (result.includes("all")) result = [...WORKFLOW_NAMES];
    result.forEach(name => {
        if (!WORKFLOW_NAMES.includes(name))
            throw new Error(
                `Unknown workflow name: ${name}, choices are: ${HELP_WORKFLOW_NAMES.map(
                    x => `\n  ${x}`
                ).join("")}`
            );
    });
    return result;
}

export function parseArgs(): Namespace {
    const result = <Namespace>commandLineArgs([
        { name: "help", alias: "h", type: Boolean },
        { name: "force", alias: "f", type: Boolean },
        { name: "check", alias: "c", type: Boolean },
        { name: "language", alias: "l", type: String },
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
    result.update = getWorkflowNames(result.update);
    if (
        result.language &&
        !["python", "javascript"].includes(result.language)
    ) {
        throw new Error(`Unsupported language: ${result.language}`);
    }
    return result;
}
