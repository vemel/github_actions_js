import chalk from "chalk";
import Configstore from "configstore";
import inquirer from "inquirer";
import inquirerSelectDirectory from "inquirer-select-directory";
import { pathToFileURL } from "url";

import { getIndexResource, getShortcut, INDEXES } from "./indexes.js";
import { highlightURL, replaceRef } from "./urlUtils.js";
import { WorkflowResource } from "./workflow/resource.js";
import { WorkflowIndex } from "./workflow/workflowIndex.js";

export async function chooseIndex(
    url: string | undefined,
    ref: string,
    workflowsPath: string
): Promise<WorkflowIndex> {
    if (url) {
        return WorkflowIndex.fromURL(replaceRef(url, ref), workflowsPath);
    }
    const defaultIndexes = INDEXES.map(index => index.url) as Array<string>;
    const config = new Configstore("github-actions", {
        indexes: defaultIndexes
    });
    const indexes: Array<string> = config.get("indexes");
    indexes.push(...defaultIndexes.filter(index => !indexes.includes(index)));
    const titlePad = 15;
    return inquirer
        .prompt([
            {
                name: "url",
                type: "list",
                message:
                    "Select project type or choose any repository with workflows",
                pageSize: 30,
                choices: [
                    ...indexes.map(url => {
                        const index = getIndexResource(url);
                        const title = index
                            ? `${index.title.padEnd(titlePad)} ${highlightURL(
                                replaceRef(url, ref)
                            )}`
                            : `${"Recently used".padEnd(
                                titlePad
                            )} ${highlightURL(replaceRef(url, ref))}`;
                        return {
                            name: title,
                            value: url
                        };
                    }),
                    {
                        name: `${"From GitHub URL".padEnd(
                            titlePad
                        )} ${chalk.grey(
                            "https://github.com/<owner>/<repo>/tree/main/.github/workflows"
                        )}`,
                        value: "github"
                    },
                    {
                        name: `${"From directory".padEnd(
                            titlePad
                        )} ${chalk.grey("other/project/.github/workflows")}`,
                        value: "path"
                    }
                ]
            }
        ])
        .then(async ({ url }) => {
            if (url === "github") {
                url = await inputGitHubURL(ref);
            }
            if (url === "path") {
                let currentPath = ".";
                while (true) {
                    currentPath = await inputLocalPath(currentPath);
                    url = pathToFileURL(currentPath).href;
                    const index = await WorkflowIndex.fromFileURL(
                        url,
                        workflowsPath
                    );
                    if (!index.names.length) {
                        console.log(
                            chalk.red(
                                `✗  Path ${chalk.bold(
                                    currentPath
                                )} does not have workflows, choose ${chalk.bold(
                                    ".github/workflows"
                                )} directory`
                            )
                        );
                        continue;
                    }
                    break;
                }
            }
            const result = await WorkflowIndex.fromURL(
                replaceRef(url, ref),
                workflowsPath
            );
            console.log(
                `\nNext time you can run me with ${chalk.blue(
                    `-i ${getShortcut(url) || replaceRef(url, ref)}`
                )}\n`
            );
            const newIndexes = [
                url,
                ...indexes.filter(index => index !== url)
            ] as Array<string>;
            config.set("indexes", newIndexes.slice(0, 30));
            return result;
        });
}

async function inputGitHubURL(ref: string): Promise<string> {
    return inquirer
        .prompt([
            {
                name: "input",
                type: "input",
                message: `Paste URL to ${chalk.bold(
                    "<github_repo>/.github/workflows"
                )} ${chalk.grey(
                    "e.g. https://github.com/psf/black/tree/master/.github/workflows"
                )}\n : `,
                validate: async value => {
                    const index = await WorkflowIndex.fromURL(
                        replaceRef(value, ref),
                        ""
                    );
                    if (index.names.length) return true;
                    return `Path ${value} does not have workflows`;
                }
            }
        ])
        .then(({ input }) => input);
}

async function inputLocalPath(basePath: string): Promise<string> {
    inquirer.registerPrompt("directory", inquirerSelectDirectory);
    return inquirer
        .prompt([
            {
                name: "input",
                type: "directory",
                basePath: basePath,
                message: `Select path to ${chalk.bold(".github/workflows")}`,
                options: {
                    displayHidden: true
                }
            }
        ])
        .then(({ input }) => input);
}

export async function createWorkflowsDir(path: string): Promise<boolean> {
    return inquirer
        .prompt([
            {
                name: "answer",
                type: "confirm",
                message: `It looks like we do not have ${chalk.blue(
                    path
                )} directory to store workflows. Create it?`
            }
        ])
        .then(({ answer }) => answer);
}

export async function selectWorkflows(
    workflowIndex: WorkflowIndex
): Promise<Array<WorkflowResource>> {
    const hasInstalled = workflowIndex.getInstalledWorkflows().length > 0;
    const names = [
        ...(hasInstalled ? ["installed"] : []),
        "all",
        ...workflowIndex.names
    ];
    const workflows = workflowIndex.getAllWorkflows();
    await Promise.all(
        workflows.filter(w => w.existsLocally()).map(w => w.getLocal())
    );
    const choices = [
        ...(hasInstalled
            ? [
                ` Installed workflows ${chalk.green(
                    "(green ones)"
                )} ${chalk.grey("installed")}`
            ]
            : []),
        ` All workflows below ${chalk.grey("all")}`,
        ...workflows.map(w => {
            const title = w.getTitle(
                w.existsLocally() ? "is installed to" : "can be installed to",
                w.existsLocally() ? chalk.green : chalk.white
            );
            return ` ${title}`;
        })
    ];
    const message = hasInstalled
        ? "Select workflows to install or update"
        : "Select workflows to install";
    return inquirer
        .prompt([
            {
                name: "names",
                type: "checkbox",
                default: hasInstalled ? ["installed"] : [],
                message: message,
                validate: result => {
                    if (result.length) return true;
                    return "Select at least one workflow";
                },
                pageSize: 30,
                choices: choices.map(choice => ({
                    name: choice,
                    value: names[choices.indexOf(choice)]
                }))
            }
        ])
        .then(({ names }) => {
            return workflowIndex.getWorkflows(names);
        });
}

export async function confirmApply(): Promise<boolean> {
    return inquirer
        .prompt([
            {
                name: "confirm",
                type: "confirm",
                message: `Apply updates?`
            }
        ])
        .then(({ confirm }) => confirm);
}

type TConfirmResult =
    | "apply"
    | "rerun_noforce"
    | "rerun_force"
    | "rerun_nodiff"
    | "rerun_diff"
    | "discard";
interface IConfirmChoice {
    name: string;
    value: TConfirmResult;
}

export async function confirmRerunApply(
    forceUpdate: boolean,
    showDiff: boolean,
    hasChanges: boolean,
    hasForceChanges: boolean
): Promise<TConfirmResult> {
    if (!hasForceChanges) return "apply";
    const choices: Array<IConfirmChoice> = [];
    if (hasChanges) {
        choices.push({
            name: `${chalk.green("Apply")} listed changes and exit`,
            value: "apply"
        });
    } else {
        choices.push({
            name: `Exit, as everything is ${chalk.green("up to date")}`,
            value: "apply"
        });
    }
    if (forceUpdate) {
        choices.push({
            name: `Remove ${chalk.blue(
                "--force"
            )} flag to keep user-edited parts untouched`,
            value: "rerun_noforce"
        });
    } else {
        choices.push({
            name: `Add ${chalk.blue(
                "--force"
            )} flag to update user-edited parts`,
            value: "rerun_force"
        });
    }
    if (showDiff) {
        choices.push({
            name: `Hide changed lines, disable ${chalk.blue("--diff")} flag`,
            value: "rerun_nodiff"
        });
    } else {
        choices.push({
            name: `Show changed lines with ${chalk.blue("--diff")} flag`,
            value: "rerun_diff"
        });
    }
    if (hasChanges) {
        choices.push({ name: "Discard changes and exit", value: "discard" });
    }
    return inquirer
        .prompt([
            {
                name: "result",
                type: "list",
                message: "What do we do next?",
                choices: choices
            }
        ])
        .then(({ result }) => result);
}
