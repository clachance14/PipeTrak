# Email System (Resend)

**✅ STATUS: Email system is fully configured and operational.**

## Overview
Supastarter uses React Email for template creation with Resend as the email service provider. Templates are built as React components with Tailwind CSS styling support.

## Resend Configuration

### API Key
Already configured in `.env.local`:
```bash
RESEND_API_KEY="re_WBFBYVuA_6VvhAFJmcb6nZhGEypDRhYcH"
```

### Provider Activation
Resend is activated in `packages/mail/src/provider/index.ts`:
```typescript
export * from "./resend";
```

### Sender Configuration
Configure sender email in `config/index.ts`:
```typescript
mails: {
  // IMPORTANT: This email domain must be verified in your Resend dashboard
  from: "noreply@pipetrak.co",
}
```

## Email Templates

### Template Structure
Email templates are React components located in `packages/mail/templates/`:

```typescript
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Link, 
  Preview, 
  Text 
} from "@react-email/components";
import { createTranslator } from "@repo/i18n/lib/server";

interface EmailTemplateProps {
  name: string;
  actionUrl?: string;
  locale?: string;
}

export function EmailTemplate({ 
  name, 
  actionUrl, 
  locale = "en" 
}: EmailTemplateProps) {
  const t = await createTranslator({ locale });
  
  return (
    <Html>
      <Head />
      <Preview>{t("email.preview")}</Preview>
      <Body>
        <Container>
          <Heading>{t("email.greeting", { name })}</Heading>
          <Text>{t("email.body")}</Text>
          {actionUrl && (
            <Link href={actionUrl}>
              {t("email.action")}
            </Link>
          )}
        </Container>
      </Body>
    </Html>
  );
}
```

### Registering Templates
Register new templates in `packages/mail/lib/templates.ts`:

```typescript
import { EmailTemplate } from "../templates/email-template";

export const templates = {
  emailTemplate: EmailTemplate,
  // ... other templates
};
```

## Sending Emails

### Basic Usage
```typescript
import { sendMail } from "@repo/mail";

await sendMail({
  to: "user@example.com",
  template: "emailTemplate",
  context: {
    name: "John Doe",
    actionUrl: "https://pipetrak.co/verify",
  },
});
```

### With Multiple Recipients
```typescript
await sendMail({
  to: ["user1@example.com", "user2@example.com"],
  template: "notification",
  context: {
    message: "System update completed",
  },
});
```

### With Custom Subject
```typescript
await sendMail({
  to: "admin@pipetrak.co",
  subject: "Custom Subject Line",
  template: "alert",
  context: {
    alertType: "warning",
    details: "Resource usage high",
  },
});
```

## Built-in Email Templates

Supastarter includes pre-built templates for:
- **Welcome Email** - Sent after user signup
- **Password Reset** - Password recovery flow
- **Email Verification** - Confirm email address
- **Magic Link** - Passwordless authentication
- **Organization Invitation** - Invite users to organizations
- **Contact Form** - Contact form submissions

## Previewing Templates

Run the email preview server:
```bash
pnpm --filter mail preview
```

This opens a browser interface to preview all email templates with sample data.

## Internationalization

Email templates support multiple languages:

```typescript
// In template component
const t = await createTranslator({ locale });

// In translation files (packages/i18n/messages/[locale].json)
{
  "email": {
    "greeting": "Hello {{name}}",
    "welcome": "Welcome to PipeTrak",
    "verify": "Please verify your email"
  }
}
```

## Contact Form Configuration

Configure contact form in `config/index.ts`:

```typescript
contactForm: {
  enabled: true,
  to: "hello@pipetrak.co", // Where to send contact form emails
  subject: "PipeTrak Contact Form Submission",
}
```

## Testing Emails

### Development
- Emails are logged to console in development mode
- Use the preview server to test template rendering
- Check Resend dashboard for email logs

### Production
- Verify domain in Resend dashboard
- Monitor email delivery in Resend analytics
- Set up webhook notifications for bounces/complaints

## Production Setup

### Email (Resend)
- [x] Verify domain (pipetrak.co) in [Resend Dashboard](https://resend.com/domains)
- [x] Update sender email from `noreply@pipetrak.co` if needed
- [x] Configure production email provider (Resend)
- [x] Update email templates with production URLs
- [x] Test email delivery (signup, password reset, etc.)
- [x] Set up webhook for bounces and complaints
- [x] Update contact form recipient email in config

## Key Files
- Email provider: `packages/mail/src/provider/index.ts`
- Email templates: `packages/mail/templates/`
- Template registry: `packages/mail/lib/templates.ts`
- Send function: `packages/mail/lib/send.ts`
- Configuration: `config/index.ts` (mails section)

## Documentation Links
- [Mailing Overview](https://supastarter.dev/docs/nextjs/mailing/overview)
- [Resend Provider](https://supastarter.dev/docs/nextjs/mailing/resend)
- [React Email](https://react.email)
- [Resend Dashboard](https://resend.com/emails)