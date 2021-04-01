import chalk from "chalk";
import inquirer from "inquirer";

import { INDEXES } from "./indexes";
import { WorkflowResource } from "./workflow/resource";
import { WorkflowIndex } from "./workflow/workflowIndex";

export async function chooseIndex(localPath: string): Promise<string> {
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
                            name = `${name} (looks like you have ${index.markerFilePath})`;
                        return {
                            name: name,
                            value: index.url
                        };
                    }),
                    { name: "Enter URL manually", value: "" }
                ]
            }
        ])
        .then(async ({ index }) => {
            if (!index) return await inputIndex();
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
                )} directory to store workflows. Do you want me to create it?`,
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
        ` All listed workflows ${chalk.grey("all")}`,
        ...workflowIndex.getAllWorkflows().map(w => {
            if (w.existsLocally())
                return ` ${chalk.green(w.title)} ${chalk.grey(w.name)}`;
            return ` ${w.title} ${chalk.grey(w.name)}`;
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
                message: message,
                pageSize: 30,
                choices: choices.map(choice => ({
                    name: choice,
                    value: names[choices.indexOf(choice)]
                }))
            }
        ])
        .then(({ names }) => {
            const workflows = workflowIndex.getWorkflows(names);
            return workflows;
        });
}

export async function confirmProceed(): Promise<boolean> {
    return inquirer
        .prompt([
            {
                name: "confirm",
                type: "confirm",
                message: `Do you want to proceed?`
            }
        ])
        .then(({ confirm }) => confirm);
}
