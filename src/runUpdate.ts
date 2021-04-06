import chalk from "chalk";

import { logDiff } from "./differ";
import { getCheckResult, runCheck } from "./runCheck";
import { Check } from "./workflow/check";
import { Merger } from "./workflow/merger";
import { WorkflowResource } from "./workflow/resource";

export function logUpdate(
    check: Check,
    forceUpdate = false,
    showDiff = false
): void {
    if (check.action === "equal") return;
    if (!forceUpdate && check.force) {
        return console.log(chalk.grey(`  ${check.noForceMessage}`));
    }
    console.log(check.color(`  ${check.updateMessage}`));
    if (showDiff) logDiff(check.oldValue, check.newValue);
}

export async function runUpdate(
    workflowItem: WorkflowResource,
    forceUpdate: boolean,
    removeMarker: boolean
): Promise<void> {
    const remoteWorkflow = await workflowItem.getRemote();
    if (!workflowItem.existsLocally()) {
        remoteWorkflow.job.steps.forEach(step => step.makeManaged());
        await workflowItem.setLocal(remoteWorkflow.render());
        return;
    }

    const localWorkflow = await workflowItem.getLocal();
    const newWorkflow = new Merger(forceUpdate).merge(
        localWorkflow,
        remoteWorkflow
    );
    if (removeMarker) {
        newWorkflow.job.steps.forEach(step => step.makeNonManaged());
    }
    await workflowItem.setLocal(newWorkflow.render());
}

export async function runUpdateAll(
    resources: Array<WorkflowResource>,
    forceUpdate: boolean,
    showDiff: boolean,
    removeMarker: boolean
): Promise<void> {
    const checkLists = await Promise.all(
        resources.map(resource => runCheck(resource, forceUpdate, removeMarker))
    );

    resources.forEach((resource, index) => {
        console.log(resource.getTitle());
        const checks = checkLists[index];
        checks.forEach(check => logUpdate(check, forceUpdate, showDiff));
        logUpdate(getCheckResult(resource, checks, forceUpdate), false, false);
    });

    const updatedItems = resources.filter((resource, index) => {
        if (!resource.existsLocally()) return true;
        const checks = checkLists[index];
        const applyChecks = checks.filter(check =>
            check.isApplied(forceUpdate)
        );
        return applyChecks.length > 0;
    });
    if (updatedItems.length)
        await Promise.all(
            updatedItems.map(resource =>
                runUpdate(resource, forceUpdate, removeMarker)
            )
        );
}
