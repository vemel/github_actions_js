import chalk from "chalk";

import { getLocalPath, getWorkflowData, updateWorkflow } from "./manager";
import { decapitalize } from "./utils";

export default function runUpdate(
    name: string,
    localContent: string | null,
    remoteContent: string | null,
    updateExisting: boolean
): boolean {
    const localPath = getLocalPath(name);
    const workflowPrefix = `Workflow ${chalk.bold(localPath)}`;
    if (!remoteContent) {
        console.warn(
            chalk.red(`✗  ${workflowPrefix} download failed, skipping`)
        );
        return false;
    }
    const workflowPurpose = chalk.bold(
        decapitalize(getWorkflowData(remoteContent).name)
    );
    if (!localContent) {
        updateWorkflow(name, remoteContent);
        console.info(
            chalk.green(
                `✓  Workflow ${chalk.bold(
                    localPath
                )} added to ${workflowPurpose}`
            )
        );
        return true;
    }
    if (localContent === remoteContent) {
        console.log(
            chalk.grey(
                `✓  ${workflowPrefix} is up to date and ready to ${workflowPurpose}`
            )
        );
        return false;
    }
    if (!updateExisting) {
        console.info(
            chalk.yellow(
                `↻  ${workflowPrefix} can ${workflowPurpose} better, add ${chalk.bold(
                    "-f"
                )} CLI flag to update`
            )
        );
        return false;
    }
    updateWorkflow(name, remoteContent);
    console.info(
        chalk.green(`✓  ${workflowPrefix} updated, cross-check changes`)
    );
    return true;
}
