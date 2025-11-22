# Deployment Setup

This workflow syncs the `production` branch from this hackathon repo to your personal repo `samaluk/super-tracker`.

## Quick Setup

1. **Install GitHub CLI** (if not installed):
   ```bash
   brew install gh
   ```

2. **Log in**:
   ```bash
   gh auth login
   ```

3. **Run the configuration script**:
   ```bash
   ./configure-deployment.sh
   ```
   It will ask for a Personal Access Token (PAT). Create one [here](https://github.com/settings/tokens/new?scopes=repo&description=Vercel+Deployment+Sync) with `repo` scope.

## Manual Setup (Alternative)

If you can't use the script, set these secrets in the hackathon repo:

- **`PERSONAL_REPO_PATH`**: `samaluk/super-tracker`
- **`PERSONAL_REPO_TOKEN`**: Your PAT with `repo` scope

## Deployment Flow

1. Create a PR to the `production` branch.
2. Merge the PR.
3. The workflow will automatically sync code to your personal repo.
4. Vercel (connected to your personal repo) will deploy.

