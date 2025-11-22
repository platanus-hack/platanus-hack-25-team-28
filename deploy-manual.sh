#!/bin/bash

# Configuration
HACKATHON_REPO_URL="https://github.com/platanus-hack/platanus-hack-25-team-28.git"
PERSONAL_REPO_URL="https://github.com/samaluk/super-tracker.git"
DEPLOY_BRANCH="production"

echo "🚀 Starting manual deployment..."

# Ensure we are in the repo
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Run this from the root of your project."
    exit 1
fi

# Fetch latest changes from hackathon repo
echo "📥 Fetching latest production code from hackathon repo..."
git fetch origin $DEPLOY_BRANCH

# Check if personal remote exists, add if not
if ! git remote | grep -q "personal"; then
    echo "🔗 Adding personal remote..."
    git remote add personal $PERSONAL_REPO_URL
fi

# Push to personal repo
echo "📤 Pushing to personal repo ($DEPLOY_BRANCH)..."
if git push personal origin/$DEPLOY_BRANCH:refs/heads/$DEPLOY_BRANCH --force; then
    echo "✅ Successfully deployed to personal repo!"
    echo "   Vercel should trigger a build shortly."
else
    echo "❌ Deployment failed."
    echo "   Check your permissions for $PERSONAL_REPO_URL"
    exit 1
fi

