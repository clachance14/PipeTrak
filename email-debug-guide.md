# Email Delivery Debugging Guide

## Current Configuration Analysis

Based on your current setup:
- **Email Provider**: Resend
- **From Address**: `onboarding@resend.dev` (development domain)
- **API Key**: Configured in `.env.local`
- **Status**: Emails showing in Resend dashboard but not reaching inbox

## Step-by-Step Debugging Process

### 1. Test Email Delivery Directly

Run the debug script I created:

```bash
node debug-email.js your-email@example.com
```

This will:
- Send a test email directly via Resend API
- Show the full API response
- Check delivery status
- Provide debugging information

### 2. Check Resend Dashboard

Visit [Resend Dashboard](https://resend.com/emails) and look for:

#### Email Status Indicators
- ✅ **Delivered**: Email successfully delivered to recipient's server
- 📬 **Queued**: Email is waiting to be sent
- 🔄 **Processing**: Email is being processed
- ❌ **Failed**: Delivery failed (check error message)
- 📧 **Sent**: Email was accepted by Resend but delivery status unknown

#### Key Information to Check
1. **Delivery Status**: Look for "delivered", "bounced", "complained", or "failed"
2. **Bounce Reason**: If bounced, what was the reason?
3. **Spam Complaints**: Any spam reports?
4. **Click/Open Tracking**: Are emails being opened?

### 3. Common Issues and Solutions

#### Issue 1: Emails Going to Spam
**Symptoms**: Emails show as delivered in Resend but not in inbox

**Solutions**:
1. Check spam/junk folder thoroughly
2. Add `onboarding@resend.dev` to safe senders list
3. Consider switching to a verified domain (see Step 7)

#### Issue 2: Email Provider Filtering
**Symptoms**: Works with some email providers but not others

**Test with multiple providers**:
```bash
node debug-email.js test@gmail.com
node debug-email.js test@yahoo.com  
node debug-email.js test@outlook.com
node debug-email.js test@protonmail.com
```

#### Issue 3: Domain Reputation Issues
**Symptoms**: Consistent delivery problems across providers

**Solutions**:
1. Use a verified domain instead of `onboarding@resend.dev`
2. Check Resend domain reputation
3. Implement DKIM/SPF records

### 4. Test Application Email Flow

Test the actual authentication emails:

```bash
# In your app, try these flows:
# 1. Sign up with a new account
# 2. Request password reset
# 3. Magic link login
# 4. Organization invitation
```

Look for console logs and check the network tab in browser dev tools.

### 5. Enable Detailed Logging

Update the email provider to log more details:

```typescript
// In packages/mail/src/provider/resend.ts
export const send: SendEmailHandler = async ({ to, subject, html }) => {
    console.log('🚀 Sending email:', { to, subject, from });
    
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            html,
        }),
    });

    const responseData = await response.json();
    console.log('📧 Resend response:', responseData);

    if (!response.ok) {
        console.error('❌ Email send failed:', responseData);
        logger.error(responseData);
        throw new Error("Could not send email");
    }
    
    console.log('✅ Email sent successfully:', responseData.id);
    return responseData;
};
```

### 6. Check Environment Variables

Verify your configuration:

```bash
# Check if API key is set
echo $RESEND_API_KEY

# Or check in Node.js
node -e "require('dotenv').config({path:'.env.local'}); console.log('API Key exists:', !!process.env.RESEND_API_KEY);"
```

### 7. Production-Ready Email Setup

For production, consider upgrading from `onboarding@resend.dev`:

#### Option A: Use Resend with Custom Domain
1. Add your domain (e.g., `pipetrak.co`) to Resend
2. Verify domain ownership
3. Update config:
```typescript
// In config/index.ts
mails: {
    from: "noreply@pipetrak.co",
},
```

#### Option B: Continue with Development Domain
The `onboarding@resend.dev` domain should work for development, but:
- May have delivery limitations
- Some email providers may be more restrictive
- Not suitable for production use

### 8. Alternative Testing Methods

#### Method 1: Use a Test Email Service
Services like [MailTrap](https://mailtrap.io/) or [MailHog](https://github.com/mailhog/MailHog) can intercept emails for testing.

#### Method 2: Use Email Testing Tools
- [Mail-Tester.com](https://www.mail-tester.com/) - Check spam score
- [MXToolbox](https://mxtoolbox.com/) - DNS and deliverability testing

#### Method 3: Create Multiple Test Accounts
Test with various email providers:
- Gmail (personal and business)
- Outlook/Hotmail
- Yahoo Mail
- Apple iCloud
- ProtonMail

### 9. Monitoring and Alerts

Set up monitoring for email delivery:

```typescript
// Add to your email sending function
const emailResult = await sendEmail({
    to: userEmail,
    templateId: 'emailVerification',
    context: { ... }
});

if (!emailResult) {
    // Log failed email delivery
    console.error('Email delivery failed for:', userEmail);
    // Consider implementing retry logic or alerts
}
```

## Expected Resolution Steps

1. **Run the debug script** to get immediate feedback
2. **Check Resend dashboard** for detailed delivery logs
3. **Test with multiple email providers** to isolate the issue
4. **Check spam folders** thoroughly
5. **Consider domain upgrade** if using development domain in production

## Need Help?

If emails are still not being delivered after following this guide:

1. Share the output from the debug script
2. Share screenshots from Resend dashboard showing email status
3. Confirm which email providers you've tested
4. Check if the issue is consistent across all email types or specific to certain templates

The most common cause is emails being filtered to spam, especially when using development domains like `onboarding@resend.dev`.