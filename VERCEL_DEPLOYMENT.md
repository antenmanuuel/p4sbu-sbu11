# Vercel Deployment Guide for P4SBU Parking System

This guide will help you deploy the P4SBU parking permit system to Vercel, migrating from Heroku.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Atlas**: Database should already be set up (same as Heroku setup)
4. **Stripe Account**: Payment processing setup (same as Heroku setup)

## Project Structure

The project is a full-stack application with:
- **Frontend**: React client built with Vite (`client/` directory)
- **Backend**: Node.js/Express server (`server/` directory)
- **Database**: MongoDB Atlas (external)

## Environment Variables

Set these environment variables in your Vercel project dashboard:

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/p4sbu-parking

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_or_sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password

# Gemini AI (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Application Settings
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Setting Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its corresponding value
4. Make sure to set the environment to "Production"

## Deployment Steps

### 1. Connect Repository to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it as a Node.js project

### 2. Configure Build Settings

Vercel should automatically detect the configuration from `vercel.json`, but verify:

- **Framework Preset**: Other
- **Root Directory**: `.` (root)
- **Build Command**: `npm run build` (from root package.json)
- **Output Directory**: `client/dist`

### 3. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. The deployment includes:
   - Building the React client
   - Setting up the serverless function for the API
   - Configuring routing

### 4. Configure Custom Domain (Optional)

1. In your project settings, go to **Domains**
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS

## Post-Deployment Configuration

### 1. Update Stripe Webhook URL

1. Log in to your Stripe Dashboard
2. Go to **Developers** → **Webhooks**
3. Update the endpoint URL to: `https://your-vercel-app.vercel.app/webhook/stripe`
4. Ensure the webhook is set to send `payment_intent.succeeded` and `payment_intent.payment_failed` events

### 2. Update CORS Origins

The application is configured to accept requests from the Vercel domain. If you use a custom domain, update the CORS configuration in `server/server.js`:

```javascript
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-custom-domain.com',
    'https://your-vercel-app.vercel.app'
];
```

### 3. Test the Deployment

1. **Frontend**: Visit your Vercel URL to ensure the React app loads
2. **API**: Test API endpoints at `https://your-vercel-app.vercel.app/api/health`
3. **Database**: Try logging in to verify database connectivity
4. **Payments**: Test the reservation flow with Stripe

## Key Differences from Heroku

### Architecture Changes

1. **Serverless Functions**: The Express server runs as a serverless function instead of a persistent server
2. **Static Hosting**: The React client is served as static files
3. **No Port Binding**: Vercel handles routing automatically

### File Changes Made

1. **vercel.json**: New configuration file for Vercel deployment
2. **server/server.js**: Modified to export the Express app for serverless deployment
3. **package.json**: Updated build scripts
4. **Procfile**: Removed (Heroku-specific)

### Benefits of Vercel

1. **Automatic Deployments**: Deploys on every push to main branch
2. **Global CDN**: Faster static asset delivery
3. **Serverless Scaling**: Automatic scaling based on demand
4. **Built-in Analytics**: Performance monitoring included
5. **Preview Deployments**: Automatic preview URLs for PRs

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Verify all required environment variables are set in Vercel dashboard
   - Check that NODE_ENV is set to "production"

2. **Database Connection Issues**
   - Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
   - Verify MONGODB_URI is correct

3. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are listed in package.json

4. **API Routes Not Working**
   - Verify vercel.json routing configuration
   - Check that API routes start with `/api/`

5. **Static Files Not Loading**
   - Ensure client build completed successfully
   - Check that files are in `client/dist` directory

### Monitoring and Logs

1. **Function Logs**: Available in Vercel dashboard under "Functions"
2. **Analytics**: Built-in performance monitoring
3. **Error Tracking**: Set up external service like Sentry if needed

## Migration Checklist

- [ ] Repository connected to Vercel
- [ ] All environment variables configured
- [ ] Successful deployment
- [ ] Stripe webhook URL updated
- [ ] Database connectivity verified
- [ ] Payment processing tested
- [ ] Email functionality tested
- [ ] Custom domain configured (if applicable)
- [ ] DNS updated (if using custom domain)
- [ ] Old Heroku app can be safely removed

## Support

For deployment issues:
1. Check Vercel documentation
2. Review function logs in Vercel dashboard
3. Test API endpoints individually
4. Verify environment variable configuration

The application is now ready for production use on Vercel! 