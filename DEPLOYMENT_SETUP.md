# Deployment Guide

We use a manual deployment process to sync changes from the hackathon repo to the personal repo (connected to Vercel).

## Prerequisites

- You must have write access to `samaluk/super-tracker`.
- You must have Git configured locally.

## Vercel Configuration (Critical)

Since we deploy from the `production` branch, you must configure Vercel to recognize it as the production environment:

1.  Go to your Vercel Project Dashboard.
2.  Navigate to **Settings** -> **Git**.
3.  Under **Production Branch**, change the value from `main` to `production`.
4.  Click **Save**.

**Why?**
If this is not set, Vercel treats `production` branch deploys as "Preview" environments. However, your `CONVEX_DEPLOY_KEY` is for production. Convex blocks production keys in preview environments to prevent data accidents.

## How to Deploy

1. **Merge your changes** to the `production` branch in the hackathon repo (via PR).
2. **Run the deployment script** locally:

   Using npm:

   ```bash
   npm run deploy
   ```

   Or using pnpm:

   ```bash
   pnpm deploy
   ```

   This script will:
   - Fetch the latest `production` code from the hackathon repo.
   - Push it to the `production` branch of your personal repo (`samaluk/super-tracker`).
   - Vercel will automatically trigger a deployment.

## Troubleshooting

- **Permission denied**: Ensure your local Git is authenticated and has access to the personal repo.
- **Convex Error (Non-production build environment)**: This means Vercel thinks it's a Preview deployment. Check the "Vercel Configuration" section above.
