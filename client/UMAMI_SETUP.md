# Umami Analytics Setup Guide

This document explains how to set up Umami analytics for the Plannova application.

## What is Umami?

Umami is a simple, fast, privacy-friendly alternative to Google Analytics. It's open-source and focuses on collecting only the metrics you need without invading user privacy.

## Setup Instructions

### 1. Deploy Umami

First, you need to deploy your own instance of Umami. You have several options:

1. **Self-hosted**: Deploy on your own server using the [official installation guide](https://umami.is/docs/install)
2. **Umami Cloud**: Use the hosted version at [cloud.umami.is](https://cloud.umami.is)

### 2. Create a Website in Umami

After deploying Umami:

1. Log into your Umami dashboard
2. Click "Add website"
3. Fill in the website details:
   - Name: Plannova
   - Domain: your-domain.com (or localhost for development)
4. Save the website
5. Note the generated "Website ID" - you'll need this for configuration

### 3. Configure Environment Variables

Add the following environment variables to your application:

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-from-umami
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://your-umami-instance.com/script.js
```

For local development, you can add these to a `.env.local` file in the `client` directory:

```env
# .env.local
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-from-umami
NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://localhost:3000/umami/script.js
```

### 4. Verify Installation

After setting up the environment variables:

1. Start your application
2. Visit your site
3. Check the Umami dashboard - you should start seeing data within a few minutes

## Custom Event Tracking

You can track custom events using the `umami.track()` function:

```javascript
// Track a button click
umami.track('button-click', { buttonId: 'signup-button' });

// Track a custom event with revenue
umami.track('purchase', { revenue: 99.99, currency: 'USD' });
```

You can also track events using HTML data attributes:

```html
<button data-umami-event="signup-button" data-umami-event-location="header">
  Sign Up
</button>
```

## Configuration Options

The Umami script supports several data attributes for customization:

- `data-domains`: Comma-separated list of domains to track
- `data-auto-track`: Set to "false" to disable automatic pageview tracking
- `data-do-not-track`: Set to "true" to respect do-not-track settings
- `data-cache`: Set to "true" to enable caching

Example with additional options:

```jsx
<Script
  async
  src={UMAMI_SCRIPT_URL}
  data-website-id={UMAMI_WEBSITE_ID}
  data-domains="plannova.in,www.plannova.in"
  data-do-not-track="true"
/>
```

## Troubleshooting

If you're not seeing data in your dashboard:

1. Check that the environment variables are set correctly
2. Verify the Website ID matches what's in your Umami dashboard
3. Check the browser's developer console for any JavaScript errors
4. Ensure your Umami instance is running and accessible
5. Confirm that your firewall isn't blocking requests to your Umami instance

## Privacy Considerations

Umami is designed with privacy in mind:
- No cookies are used
- No personal data is collected
- IP addresses are anonymized
- All data is stored on your own server (if self-hosted)

For more information, see the [Umami documentation](https://umami.is/docs).