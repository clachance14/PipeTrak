# Vercel Deployment Guide for PipeTrak

## Prerequisites
- Vercel account (create at [vercel.com](https://vercel.com))
- Domain `pipetrak.co` ready to configure
- GitHub repository for your PipeTrak project

## Step 1: Connect to Vercel

1. Push your code to GitHub:
```bash
git add .
git commit -m "Configure PipeTrak for Vercel deployment"
git push origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Select the PipeTrak repository

## Step 2: Configure Environment Variables

In Vercel project settings, add ALL environment variables from `.env.local`:

### Required Environment Variables:

```env
# Database
DATABASE_URL=[your-supabase-pooler-url]
DIRECT_URL=[your-supabase-direct-url]

# Site URL (Vercel will auto-set this, but you can override)
NEXT_PUBLIC_SITE_URL=https://pipetrak.co

# Authentication
BETTER_AUTH_SECRET=[your-secret]

# Email
RESEND_API_KEY=[your-resend-key]

# Storage
S3_ACCESS_KEY_ID=[your-s3-access-key]
S3_SECRET_ACCESS_KEY=[your-s3-secret-key]
S3_ENDPOINT=[your-supabase-storage-endpoint]
S3_REGION=us-east-1
NEXT_PUBLIC_AVATARS_BUCKET_NAME=avatars

# OAuth (if configured)
GITHUB_CLIENT_ID=[if-using-github-auth]
GITHUB_CLIENT_SECRET=[if-using-github-auth]
GOOGLE_CLIENT_ID=[if-using-google-auth]
GOOGLE_CLIENT_SECRET=[if-using-google-auth]

# Payments (if configured)
STRIPE_SECRET_KEY=[if-using-stripe]
STRIPE_WEBHOOK_SECRET=[if-using-stripe]
# ... other payment providers

# Analytics (if configured)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=[if-using-ga]
# ... other analytics providers
```

## Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next`

## Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Vercel will provide a preview URL

## Step 5: Configure Custom Domain

1. In Vercel project settings, go to "Domains"
2. Add `pipetrak.co`
3. Choose your configuration:
   - Add both `pipetrak.co` and `www.pipetrak.co`
   - Set redirect from www to apex domain

4. Update your domain's DNS:
   - **For apex domain** (`pipetrak.co`):
     - A Record: `76.76.21.21`
   - **For www subdomain** (`www.pipetrak.co`):
     - CNAME: `cname.vercel-dns.com`

## Step 6: Update OAuth Redirect URLs

For production, update OAuth providers with production URLs:

### GitHub OAuth
- Authorization callback URL: `https://pipetrak.co/api/auth/callback/github`

### Google OAuth
- Authorized redirect URI: `https://pipetrak.co/api/auth/callback/google`

## Step 7: Configure Webhooks (if using payments)

### Stripe
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://pipetrak.co/api/webhooks/stripe`
3. Select events to listen for
4. Copy webhook secret to Vercel env vars

### Other Payment Providers
Follow similar process for LemonSqueezy, Polar, etc.

## Step 8: Verify Email Domain

Ensure `pipetrak.co` is verified in Resend:
1. Add DNS records provided by Resend
2. Verify domain in Resend dashboard
3. Test email sending from production

## Environment-Specific Settings

### Development vs Production
- Development: `http://localhost:3000`
- Staging: `https://pipetrak-staging.vercel.app`
- Production: `https://pipetrak.co`

### Database Connections
- Ensure Supabase allows connections from Vercel IPs
- Connection pooling is already configured for serverless

## Monitoring & Analytics

### Vercel Analytics
- Enable Web Analytics in Vercel dashboard
- Enable Speed Insights for performance monitoring

### Application Monitoring
- Check Vercel Functions logs for API errors
- Monitor build times and deployment status

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Domain DNS configured correctly
- [ ] SSL certificate active (automatic with Vercel)
- [ ] OAuth redirect URLs updated for production
- [ ] Email domain verified in Resend
- [ ] Payment webhooks configured (if applicable)
- [ ] Database accepting connections from Vercel
- [ ] Build succeeds without errors
- [ ] Application accessible at pipetrak.co

## Useful Commands

### Force Rebuild
```bash
vercel --prod --force
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Environment Variables Not Working
- Redeploy after adding new env vars
- Check for typos in variable names
- Ensure no trailing spaces in values

### Domain Not Working
- DNS propagation can take up to 48 hours
- Verify DNS records are correct
- Check SSL certificate status in Vercel

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Support](https://vercel.com/support)