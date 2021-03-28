export const HEADER = [
    "# This workflow provided by GitHubActions project",
    "# Documentation: https://github.com/vemel/github_actions_js",
    "#",
    "# --- How to modify this workflow and still get updates ---",
    "# - Set 'github-actions-managed' to false on manual edit to prevent step overwrite on update",
    "# - User-added steps survive update as well",
    "# - Deleted steps are restored on update, so make them empty instead of removing",
    "# - Do not add multiple jobs, only one job is supported",
    "# - Comments in yaml are removed on update, sorry :("
].join("\n");

export const LOCAL_WORKFLOWS_PATH = "./.github/workflows";
export const UTF8 = "utf-8";

export const WORKFLOW_NAMES = [
    "on_demand_create_release_draft",
    "on_pull_merged",
    "on_pull_opened_or_edited",
    "on_push_check",
    "on_release_published",
    "on_release_pull_merged"
];
export const HELP_WORKFLOW_NAMES = [
    "all (all workflows below)",
    ...WORKFLOW_NAMES
];
export const REPO_URL =
    "https://raw.githubusercontent.com/vemel/github_actions_js";
