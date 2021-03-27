import chalk from "chalk";
import equal from "deep-equal";

import { getWorkflowData, renderWorkflow, updateWorkflow } from "./manager";
import { mergesToSteps, mergeWorkflows } from "./sanitizer";
import { decapitalize } from "./utils";

export default function runUpdate(
    name: string,
    localContent: string | null,
    remoteContent: string | null,
    forceUpdate: boolean
): boolean {
    if (!remoteContent) {
        console.warn(chalk.red("  ✗  download failed, skipping update"));
        return false;
    }
    const remoteWorkflow = getWorkflowData(remoteContent);
    const workflowPurpose = chalk.bold(decapitalize(remoteWorkflow.name));
    if (!localContent) {
        updateWorkflow(name, remoteContent);
        console.info(chalk.green(`  ✓  added to ${workflowPurpose}`));
        return true;
    }
    const localWorkflow = getWorkflowData(localContent);
    if (equal(localWorkflow, remoteWorkflow)) {
        const cleanContent = renderWorkflow(localWorkflow);
        if (cleanContent === localContent) {
            console.log(
                chalk.grey(`  ✓  up to date and ready to ${workflowPurpose}`)
            );
            return false;
        }
        updateWorkflow(name, cleanContent);
        console.log(
            chalk.green(`  ✎  reformatted and ready to ${workflowPurpose}`)
        );
        return false;
    }

    if (localWorkflow.name !== remoteWorkflow.name) {
        if (forceUpdate) {
            console.log(chalk.green("  ↻  Workflow name updated"));
            localWorkflow.name = remoteWorkflow.name;
        } else {
            console.log(
                "  ✎  Workflow name is different from remote, use --force flag to update"
            );
        }
    }
    if (!equal(localWorkflow.on, remoteWorkflow.on)) {
        if (forceUpdate) {
            console.log(chalk.green("  ↻  Workflow triggers updated"));
            localWorkflow.on = remoteWorkflow.on;
        } else {
            console.log(
                "  ✎  Workflow triggers are different from remote, use --force flag to update"
            );
        }
    }
    const stepMerges = mergeWorkflows(localWorkflow, remoteWorkflow);
    stepMerges.forEach(stepMerge => {
        if (stepMerge.action === "add") {
            console.log(
                chalk.green(`  ✓  Step ${chalk.bold(stepMerge.stepName)} added`)
            );
        }
        if (stepMerge.action === "update") {
            console.log(
                chalk.green(
                    `  ↻  Step ${chalk.bold(stepMerge.stepName)} updated`
                )
            );
        }
        if (stepMerge.action === "delete") {
            console.log(
                chalk.yellow(
                    `  🗑  Step ${chalk.bold(stepMerge.stepName)} deleted`
                )
            );
        }
    });
    localWorkflow.jobs = localWorkflow.jobs || remoteWorkflow.jobs || {};
    const workflowJob = Object.values(localWorkflow.jobs || {})[0];
    workflowJob.steps = mergesToSteps(stepMerges);
    const renderedWorkflow = renderWorkflow(localWorkflow);
    updateWorkflow(name, renderedWorkflow);
    console.info(
        chalk.green(`  ✓  safely updated to ${chalk.bold(workflowPurpose)}`)
    );
    return true;
}
