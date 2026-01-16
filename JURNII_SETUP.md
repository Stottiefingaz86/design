# Jurnii Integration Setup

## Overview

The Design Request App can automatically extract UX reports from Jurnii using authentication credentials. This allows you to add Jurnii reports to the knowledge base without manual data entry.

## Security Warning

⚠️ **IMPORTANT**: Never commit Jurnii credentials to git. Always use environment variables.

## Setup Instructions

### 1. Get Your Jurnii Credentials

You'll need:
- Jurnii account email
- Jurnii account password

### 2. Add Credentials to Environment Variables

#### For Local Development:

Add to your `.env.local` file:
```bash
JURNII_EMAIL=your-email@example.com
JURNII_PASSWORD=your-password
```

**Note:** `.env.local` is already in `.gitignore` and will not be committed.

#### For Vercel Production:

1. Go to your Vercel project dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Add two variables:
   - **Name:** `JURNII_EMAIL`
     - **Value:** Your Jurnii email
     - **Environment:** Production, Preview, Development
   - **Name:** `JURNII_PASSWORD`
     - **Value:** Your Jurnii password
     - **Environment:** Production, Preview, Development
4. Click **Save**
5. **Redeploy** your project

### 3. Using the Integration

Once credentials are set, you can add Jurnii reports via the API:

```bash
POST /api/ux-report
Content-Type: application/json

{
  "url": "https://app.jurnii.io/user-reports/competitor/2c5eb20f-b28e-404c-a75f-515f22d9c004"
}
```

The system will:
1. Authenticate with Jurnii using your credentials
2. Fetch the report page
3. Extract structured data (using AI parsing if needed)
4. Add it to the knowledge base automatically

## How It Works

1. **Authentication**: 
   - Fetches the Jurnii login page to get session cookies
   - POSTs credentials to `/api/auth/login`
   - Stores authentication cookies for subsequent requests
2. **Scraping**: Fetches the report HTML using authenticated session
3. **AI Parsing**: Uses OpenAI to extract structured data from the HTML
4. **Storage**: Adds the structured report to the knowledge base

**Note**: The authentication endpoint may need adjustment based on Jurnii's actual API structure. If authentication fails, check the server logs for the exact error.

## AI-Powered Parsing

If the HTML structure is complex, the system uses OpenAI to:
- Extract findings and issues
- Determine severity levels
- Identify affected areas
- Generate recommendations

This requires `OPENAI_API_KEY` to be set (which you already have for the chat feature).

## Troubleshooting

### "Credentials not configured"

- Make sure `JURNII_EMAIL` and `JURNII_PASSWORD` are set in environment variables
- For local: Check `.env.local` file
- For Vercel: Check Settings → Environment Variables
- Redeploy after adding variables

### "Authentication failed"

- Verify your Jurnii credentials are correct
- Check if Jurnii requires 2FA (may need additional handling)
- Check Vercel logs for detailed error messages

### "Failed to extract data"

- The HTML structure may have changed
- Try using manual input instead
- Check Vercel logs for parsing errors

### "AI parsing failed"

- Make sure `OPENAI_API_KEY` is set
- Check OpenAI API quota/limits
- Try manual input as fallback

## Security Best Practices

1. **Never commit credentials**
   - Already in `.gitignore`
   - Use environment variables only

2. **Rotate credentials periodically**
   - Change passwords regularly
   - Update environment variables when changed

3. **Use different credentials for different environments** (optional)
   - Production vs. Development
   - Separate accounts if possible

4. **Monitor access**
   - Check Jurnii account activity
   - Review Vercel logs for authentication attempts

## Alternative: Manual Input

If automatic extraction doesn't work, you can always use manual input:

```bash
POST /api/ux-report
{
  "manual": true,
  "reportData": {
    "id": "jurnii-001",
    "source": "Jurnii",
    "sourceUrl": "https://app.jurnii.io/...",
    "title": "UX Report",
    "findings": [...]
  }
}
```

See `UX_REPORT_SETUP.md` for manual input details.
