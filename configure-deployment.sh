#!/bin/bash

# Configuration
PERSONAL_REPO="samaluk/super-tracker"
HACKATHON_REPO="platanus-hack/platanus-hack-25-team-28"

echo "🚀 Configuring deployment from $HACKATHON_REPO to $PERSONAL_REPO"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ You are not logged in to GitHub CLI."
    echo "👉 Run 'gh auth login' first."
    exit 1
fi

echo "🔑 We need a Personal Access Token (PAT) with 'repo' scope."
echo "   You can generate one here: https://github.com/settings/tokens/new?scopes=repo&description=Vercel+Deployment+Sync"
echo ""
read -p "Paste your PAT here: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token cannot be empty."
    exit 1
fi

echo ""
echo "⚙️  Setting secrets in $HACKATHON_REPO..."

# Set PERSONAL_REPO_PATH
gh secret set PERSONAL_REPO_PATH -b "$PERSONAL_REPO" --repo "$HACKATHON_REPO"
echo "✅ Set PERSONAL_REPO_PATH = $PERSONAL_REPO"

# Set PERSONAL_REPO_TOKEN
gh secret set PERSONAL_REPO_TOKEN -b "$TOKEN" --repo "$HACKATHON_REPO"
echo "✅ Set PERSONAL_REPO_TOKEN"

echo ""
echo "🎉 Configuration complete!"
echo "   The workflow will now work correctly on the next push to 'production'."

