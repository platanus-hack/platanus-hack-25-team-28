# Deployment Sync Setup

This workflow automatically syncs your hackathon repo to a personal repo's `production` branch, which Vercel can deploy from.

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
- **`PERSONAL_REPO_PATH`**: Your personal repo path in format `username/repo-name` (e.g., `yourusername/super-tracker`)

### 3. Configure the Workflow

The workflow is configured to trigger on version tags matching the pattern `v*` (e.g., `v1.0.0`, `v2.1.3`).

### 4. Set Up Vercel

1. In Vercel, connect your **personal repository** (not the hackathon one)
2. Set the production branch to `production`
3. Configure your build settings as needed

### 5. Create a Release

To trigger a release, create and push a version tag:

```bash
# Create a version tag
git tag v1.0.0

# Push the tag to trigger the workflow
git push origin v1.0.0
```

Or create an annotated tag with a message:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 6. Verify the Release

1. Check the Actions tab in your hackathon repo to see the workflow run
2. Verify the `production` branch in your personal repo was updated
3. Verify the tag was pushed to your personal repo
4. Vercel should automatically deploy from the personal repo

## How It Works

1. When you create and push a version tag (e.g., `v1.0.0`) in the hackathon repo, the workflow triggers
2. It checks out the hackathon repo code at that tag
3. Adds your personal repo as a remote
4. Force pushes the tagged commit to the `production` branch in your personal repo
5. Also pushes the tag to your personal repo for version tracking
6. Vercel detects the change and deploys

## Troubleshooting

- **Workflow fails**: Check that your PAT has the correct permissions
- **Vercel not deploying**: Verify the branch name matches in Vercel settings
- **Permission denied**: Ensure the PAT has access to the personal repo
