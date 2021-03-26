import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

export interface Namespace {
    help: boolean;
    update: Array<string>;
    ref: string;
    force: boolean;
}

const WORKFLOW_NAMES = [
    "on_demand_create_release_draft",
    "on_pull_merged",
    "on_pull_opened_or_edited",
    "on_push_check",
    "on_release_published",
    "on_release_pull_merged"
];
const ALL_WORKFLOW_NAMES = ["all (all workflows below)", ...WORKFLOW_NAMES];

export function getHelp(): string {
    return commandLineUsage([
        {
            header: "Easy CI/CD ",
            content:
                "GitHub Actions manager for automated JavaScript/TypeScript projects\n\n" +
                "Documentation: https://github.com/vemel/easycicd_js"
        },
        {
            header: "Options",
            optionList: [
                {
                    name: "update",
                    alias: "u",
                    typeLabel: "name",
                    multiple: true,
                    description: `Create or update workflow .github/workflows/<name>.yml. Choices: ${ALL_WORKFLOW_NAMES.map(
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
                    description: "Force update workflow even if it exists",
                    type: Boolean
                },
                {
                    name: "help",
                    alias: "h",
                    description: "Print this usage guide",
                    type: Boolean
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
                `Unknown workflow name: ${name}, choices are: ${ALL_WORKFLOW_NAMES.map(
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
    return result;
}
