import chalk from "chalk";

import { logDiff } from "./differ";
import { Check } from "./workflow/check";
import { Checker } from "./workflow/checker";
import { Merger } from "./workflow/merger";
import { WorkflowResource } from "./workflow/resource";
import { Workflow } from "./workflow/workflow";

export function logCheck(
    check: Check,
    forceUpdate = false,
    showDiff = false
): void {
    if (check.action === "equal") return;
    if (!forceUpdate && check.force) {
        return console.log(chalk.grey(`  ${check.noForceMessage}`));
    }
    console.log(check.color(`  ${check.checkMessage}`));
    if (showDiff) logDiff(check.oldValue, check.newValue);
}

export function getCheckResult(
    resource: WorkflowResource,
    checks: Array<Check>,
    forceUpdate: boolean
): Check {
    const errorChecks = checks.filter(check => check.isError());
    if (errorChecks.length)
        return new Check("error", "error", false, "has errors");

    if (!resource.existsLocally()) return new Check("workflow", "added");
    const applyChecks = checks.filter(check => check.isApplied(forceUpdate));
    if (applyChecks.length) return new Check("workflow", "updated");

    return new Check("workflow", "up to date");
}

export async function runCheck(
    workflowItem: WorkflowResource,
    forceUpdate: boolean,
    removeMarker: boolean
): Promise<Array<Check>> {
    if (!workflowItem.existsLocally()) {
        return [];
    }
    const localWorkflow = await workflowItem.getLocal();
    let remoteWorkflow: Workflow;
    try {
        remoteWorkflow = await workflowItem.getRemote();
    } catch (e) {
        return [new Check("error", "error", false, `${e}`)];
    }
    const checker = new Checker(forceUpdate, localWorkflow);

    const newWorkflow = new Merger(true).merge(localWorkflow, remoteWorkflow);
    if (removeMarker) {
        newWorkflow.jobs.forEach(job =>
            job.steps.forEach(step => step.makeNonManaged())
        );
    }
    return checker.getChecks(newWorkflow);
}

export async function runCheckAll(
    resources: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean,
    removeMarker: boolean
): Promise<boolean> {
    const checkLists = await Promise.all(
        resources.map(resource => runCheck(resource, forceUpdate, removeMarker))
    );
    const errorChecks: Array<Check> = [];
    resources.forEach((resource, index) => {
        console.log(resource.getTitle());
        const checks = checkLists[index];
        errorChecks.push(...checks.filter(check => check.isError()));
        checks.forEach(check => logCheck(check, forceUpdate, showDiff));
        logCheck(getCheckResult(resource, checks, forceUpdate), false, false);
    });
    return errorChecks.length === 0;
}
