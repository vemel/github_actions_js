import chalk from "chalk";
import inquirer from "inquirer";

import { INDEXES } from "./indexes";
import IndexResource from "./workflow/indexResource";
import { WorkflowResource } from "./workflow/resource";
import { WorkflowIndex } from "./workflow/workflowIndex";

export async function chooseIndex(localPath: string): Promise<IndexResource> {
    const defaultIndex = INDEXES.find(index =>
        index.markerFileExists(localPath)
    );
    return inquirer
        .prompt([
            {
                name: "index",
                type: "list",
                default: defaultIndex?.url,
                message: "What Workflows should we use here?",
                choices: [
                    ...INDEXES.map(index => {
                        let name = `${index.name} ${chalk.grey(index.id)}`;
                        if (index === defaultIndex)
                            name = `${name} (looks like you have ${chalk.bold(
                                index.markerFilePath
                            )})`;
                        return {
                            name: name,
                            value: index
                        };
                    }),
                    { name: "Enter URL manually", value: null }
                ]
            }
        ])
        .then(async ({ index }) => {
            if (!index) {
                const url = await inputIndex();
                return new IndexResource(url, url, url);
            }
            return index;
        });
}

async function inputIndex(): Promise<string> {
    return inquirer
        .prompt([
            {
                name: "input",
                type: "input",
                message: `Enter full URL to ${chalk.bold("index.yml")}`
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
                )} directory to store workflows. Create it?`,
                choices: INDEXES.map(index => index.name)
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
    const choices = [
        ...(hasInstalled
            ? [
                  ` Installed workflows ${chalk.green(
                      "(green ones)"
                  )} ${chalk.grey("installed")}`
              ]
            : []),
        ` All workflows below ${chalk.grey("all")}`,
        ...workflowIndex.getAllWorkflows().map(w => {
            if (w.existsLocally()) {
                return ` ${chalk.green(w.title)} ${chalk.grey(
                    ` in ${w.path}`
                )}`;
            }
            return ` ${w.title} ${chalk.grey(` in ${w.path}`)}`;
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
    hasChanges: boolean
): Promise<TConfirmResult> {
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
            name: `Run again without ${chalk.blue("--force")} flag`,
            value: "rerun_noforce"
        });
    } else {
        choices.push({
            name: `Run again with ${chalk.blue("--force")} flag`,
            value: "rerun_force"
        });
    }
    if (showDiff) {
        choices.push({
            name: `Run again and hide changed lines, disable ${chalk.blue(
                "--diff"
            )} flag`,
            value: "rerun_nodiff"
        });
    } else {
        choices.push({
            name: `Run again and show changed lines with ${chalk.blue(
                "--diff"
            )} flag`,
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
