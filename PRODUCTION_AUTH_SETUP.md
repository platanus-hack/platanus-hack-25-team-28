# Production Auth Setup Guide

This guide covers setting up WorkOS AuthKit with Convex for production deployment.

## Prerequisites

- ✅ Development setup is working
- ✅ You have a production WorkOS account
- ✅ You have a production Convex deployment

## Step 1: Create Production WorkOS Application

1. **Log in to WorkOS Dashboard** (production account)
2. **Navigate to Authentication → AuthKit**
3. **Create a new application** (or use existing production app)
4. **Configure AuthKit**:
   - Set up authentication methods (password, social login, etc.)
   - **Add Redirect URI**: `https://your-production-domain.com/callback`
   - Note your **Client ID** (format: `client_01...`)
   - Note your **API Key** (format: `sk_live_...`)

## Step 2: Configure WorkOS CORS

1. In WorkOS Dashboard, go to **Authentication → Sessions → Cross-Origin Resource Sharing (CORS)**
2. Click **Manage**
3. Add your production domain: `https://your-production-domain.com`
4. Save changes

## Step 3: Configure Convex Production Deployment

1. **Switch to Production Deployment** in Convex Dashboard
2. **Set Environment Variables**:
   - Go to **Settings → Environment Variables**
   - Add `WORKOS_CLIENT_ID` with your **production** WorkOS Client ID
   - Format: `client_01XXXXXXXXXXXXXXXXXXXXXXXX`
3. **Deploy Convex Functions**:
   ```bash
   npx convex deploy --prod
   ```
   This will sync your `auth.config.ts` with the production `WORKOS_CLIENT_ID`

## Step 4: Configure Vercel (or your hosting platform)

### Environment Variables

Add these to your Vercel project **Production** environment:

```bash
# WorkOS Production Credentials
WORKOS_CLIENT_ID=client_01XXXXXXXXXXXXXXXXXXXXXXXX  # Production Client ID
WORKOS_API_KEY=sk_live_...                          # Production API Key
WORKOS_COOKIE_PASSWORD=your_secure_password_here_must_be_at_least_32_characters_long

# WorkOS Redirect URI (must match WorkOS Dashboard)
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://your-production-domain.com/callback

# Convex Production URL
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### How to Add in Vercel:

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. For each variable:
   - **Key**: Variable name (e.g., `WORKOS_CLIENT_ID`)
   - **Value**: Your production value
   - **Environment**: Select **Production** (and optionally Preview if you want)
   - Click **Save**

## Step 5: Verify Configuration

### Checklist:

- [ ] Production WorkOS Client ID set in Convex Dashboard
- [ ] Production WorkOS Client ID set in Vercel environment variables
- [ ] Production WorkOS API Key set in Vercel
- [ ] `NEXT_PUBLIC_WORKOS_REDIRECT_URI` matches WorkOS Dashboard redirect URI
- [ ] CORS configured in WorkOS Dashboard for production domain
- [ ] Convex functions deployed to production (`npx convex deploy --prod`)
- [ ] Vercel production branch configured (should be `production` per your setup)

## Step 6: Test Production Flow

1. **Deploy to Vercel** (should happen automatically when you push to `production` branch)
2. **Visit your production site**
3. **Test sign-in flow**:
   - Click "Iniciar sesión" → Should redirect to WorkOS
   - Complete authentication
   - Should redirect back to `/callback` → Then to your app
4. **Verify authentication**:
   - Check that `useConvexAuth()` returns `isAuthenticated: true`
   - Test a protected Convex query that uses `ctx.auth.getUserIdentity()`

## Troubleshooting

### Issue: "Invalid redirect URI"

- **Solution**: Ensure `NEXT_PUBLIC_WORKOS_REDIRECT_URI` in Vercel exactly matches the redirect URI in WorkOS Dashboard

### Issue: "Authentication fails after redirect"

- **Check**:
  - `WORKOS_CLIENT_ID` in Convex Dashboard matches production Client ID
  - Convex functions are deployed (`npx convex deploy --prod`)
  - CORS is configured in WorkOS Dashboard

### Issue: "CORS error"

- **Solution**: Add your production domain to WorkOS Dashboard → Authentication → Sessions → CORS

### Issue: "Token validation fails"

- **Check**:
  - `WORKOS_CLIENT_ID` in Convex matches the Client ID used in WorkOS
  - `auth.config.ts` is using `process.env.WORKOS_CLIENT_ID` (which Convex will inject)

## Environment Variable Summary

### Development (.env.local)

```bash
WORKOS_CLIENT_ID=client_01...  # Dev Client ID
WORKOS_API_KEY=sk_test_...     # Dev API Key
WORKOS_COOKIE_PASSWORD=...     # Dev cookie password
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210  # Local Convex
```

### Production (Vercel Environment Variables)

```bash
WORKOS_CLIENT_ID=client_01...  # Production Client ID
WORKOS_API_KEY=sk_live_...      # Production API Key
WORKOS_COOKIE_PASSWORD=...     # Production cookie password (can be same or different)
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://your-domain.com/callback
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud  # Production Convex
```

### Convex Dashboard (Production Deployment)

```bash
WORKOS_CLIENT_ID=client_01...  # Production Client ID (must match Vercel)
```

## Important Notes

1. **Never commit production credentials** to git
2. **Use different Client IDs** for dev and prod (recommended)
3. **Cookie Password** can be the same or different between environments
4. **Redirect URI** must be configured in both:
   - WorkOS Dashboard (for the application)
   - Vercel environment variables (`NEXT_PUBLIC_WORKOS_REDIRECT_URI`)
5. **Convex auth.config.ts** automatically uses the `WORKOS_CLIENT_ID` from the Convex environment, so it will use production values when deployed to production

## Quick Reference Commands

```bash
# Deploy Convex to production
npx convex deploy --prod

# Check Convex environment variables
npx convex env ls --prod

# Set Convex environment variable
npx convex env set WORKOS_CLIENT_ID client_01... --prod
```
