# Deployment Guide

We use a manual deployment process to sync changes from the hackathon repo to the personal repo (connected to Vercel).

## Prerequisites

- You must have write access to `samaluk/super-tracker`.
- You must have Git configured locally.

## How to Deploy

1. **Merge your changes** to the `production` branch in the hackathon repo (via PR).
2. **Run the deployment script** locally:

   ```bash
   ./deploy-manual.sh
   ```

   This script will:
   - Fetch the latest `production` code from the hackathon repo.
   - Push it to the `production` branch of your personal repo (`samaluk/super-tracker`).
   - Vercel will automatically trigger a deployment.

## Troubleshooting

- **Permission denied**: Ensure your local Git is authenticated and has access to the personal repo.
