# Resend Email Setup for PipeTrak

## ✅ Configuration Complete

Your Resend email service is configured with:
- **API Key**: Set in `.env.local`
- **Provider**: Resend is now the active mail provider
- **From Email**: `noreply@pipetrak.co`
- **App Name**: PipeTrak
- **Production Domain**: `pipetrak.co` (hosting on Vercel)

## ⚠️ IMPORTANT: Domain Verification Required

Before emails can be sent, you MUST verify your domain in Resend:

### Steps to Verify Domain:

1. **Go to Resend Dashboard**
   - Visit [https://resend.com/domains](https://resend.com/domains)
   - Log in with your account

2. **Add Your Domain**
   - Click "Add Domain"
   - Enter: `pipetrak.co`
   - Click "Add"

3. **Add DNS Records**
   Resend will provide DNS records that you need to add to your domain:
   
   **SPF Record (TXT):**
   - Name: `@` or blank
   - Value: `v=spf1 include:amazonses.com ~all`
   
   **DKIM Records (CNAME):**
   - You'll receive 3 CNAME records like:
     - `resend._domainkey` → `resend._domainkey.pipetrak.co.dkim.resend.com`
     - (2 more similar records)

4. **Add Records to Your DNS Provider**
   - Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Navigate to DNS management
   - Add all the records provided by Resend
   - Save changes

5. **Verify in Resend**
   - Go back to Resend dashboard
   - Click "Verify DNS Records"
   - Wait for verification (can take up to 72 hours, usually faster)

## Testing Email Functionality

Once domain is verified, test email sending:

### Preview Email Templates
```bash
pnpm --filter @repo/mail preview
```
This opens React Email preview at http://localhost:3005

### Test Email Sending
The app will send emails for:
- Magic link authentication
- User invitations
- Password resets
- Two-factor authentication

### Troubleshooting

**Email not sending?**
1. Check domain verification status in Resend dashboard
2. Verify API key is correct in `.env.local`
3. Check Resend dashboard for API logs
4. Ensure from email matches verified domain

**Domain verification pending?**
- DNS propagation can take up to 72 hours
- Check DNS records are correctly added
- Use DNS checker tools to verify propagation

## Alternative: Use Resend's Test Domain

For immediate testing without domain verification:
1. Change the from email in `config/index.ts` to:
   ```typescript
   from: "onboarding@resend.dev"
   ```
2. This allows sending test emails immediately
3. Switch back to your domain once verified

## Resend Features Available

- **Transactional Emails**: Authentication, notifications
- **Email Templates**: React-based templates with preview
- **Analytics**: Track opens, clicks, bounces in Resend dashboard
- **API Logs**: Debug email sending issues
- **Webhooks**: Get notified of email events (optional)

## Next Steps

1. Verify your domain in Resend
2. Test email sending with magic link authentication
3. Customize email templates in `packages/mail/emails/`
4. Monitor email analytics in Resend dashboard

## Support

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)