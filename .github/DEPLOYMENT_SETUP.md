# Deployment Sync Setup

This workflow automatically syncs your hackathon repo to a personal repo's `production` branch when a PR is merged to the `production` branch in the hackathon repo. Vercel can then deploy from your personal repo.

## Setup Instructions

### 1. Create a Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Vercel Deployment Sync"
4. Select the `repo` scope (full control of private repositories)
5. Generate and copy the token (you won't see it again!)

### 2. Add GitHub Secrets to Hackathon Repo

In your **hackathon repository**, go to Settings → Secrets and variables → Actions, and add:

- **`PERSONAL_REPO_TOKEN`**: The personal access token you just created
- **`PERSONAL_REPO_PATH`**: Your personal repo path in format `username/repo-name` (e.g., `smaluk/super-tracker`)
  - ⚠️ **Important**: Do NOT include `https://github.com/` or `.git` - just the path!
  - ✅ Correct: `smaluk/super-tracker`
  - ❌ Wrong: `https://github.com/smaluk/super-tracker` or `smaluk/super-tracker.git`

### 3. Create a Production Branch

In your hackathon repo, create a `production` branch:

```bash
git checkout -b production
git push origin production
```

### 4. Set Up Vercel

1. In Vercel, connect your **personal repository** (not the hackathon one)
2. Set the production branch to `production`
3. Configure your build settings as needed

### 5. Create a Release

To trigger a release:

1. Make your changes on a feature branch
2. Create a Pull Request targeting the `production` branch in the hackathon repo
3. Merge the PR when ready to deploy

The workflow will automatically:

- Trigger when the PR is merged to `production`
- Sync the merged code to your personal repo's `production` branch
- Vercel will detect the change and deploy

### 6. Verify the Release

1. Check the Actions tab in your hackathon repo to see the workflow run
2. Verify the `production` branch in your personal repo was updated
3. Vercel should automatically deploy from the personal repo

## How It Works

1. When you merge a PR to the `production` branch in the hackathon repo, the workflow triggers
2. It checks out the merged commit from the PR
3. Adds your personal repo as a remote
4. Force pushes the merged commit to the `production` branch in your personal repo
5. Vercel detects the change and deploys

## Troubleshooting

- **Workflow doesn't trigger**: Make sure the PR is merged (not just closed) and targets the `production` branch
- **"repository not found" error**:
  - Verify `PERSONAL_REPO_PATH` is set correctly (format: `username/repo-name`, no `https://` or `.git`)
  - Ensure the repository exists and the PAT has access to it
  - Check that the PAT has the `repo` scope enabled
  - Verify the repository name is spelled correctly (case-sensitive)
- **Workflow fails**: Check that your PAT has the correct permissions (`repo` scope)
- **Vercel not deploying**: Verify the branch name matches in Vercel settings
- **Permission denied**: Ensure the PAT has access to the personal repo and the `repo` scope is enabled
