# Heroku Deployment Guide

## Prerequisites

1. [Heroku account](https://signup.heroku.com/)
2. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
3. [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) for database
4. Git installed and initialized in your project

## Steps to Deploy

### 1. Prepare MongoDB Atlas

1. Create a new cluster in MongoDB Atlas (free tier is sufficient to start)
2. Create a database user with a secure password
3. Whitelist IP addresses (use `0.0.0.0/0` to allow connections from anywhere)
4. Get your connection string: Click "Connect" > "Connect your application" and copy the connection string

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create a Heroku App

```bash
# Navigate to your project root directory
cd "C:\Users\amanuuel\Desktop\CSE 416\p4sbu-sbu11"

# Create a new Heroku app
heroku create p4sbu-parking-app
```

### 4. Set Environment Variables

See the `HEROKU_ENV_SETUP.md` file for a complete list of environment variables to set.

**Option 1: Use the helper script (recommended)**
```bash
# Run the script to generate Heroku config commands from your .env files
node generate-heroku-env.js

# Then copy and paste the output commands or use the .env.production file
heroku plugins:install heroku-config
heroku config:push -f .env.production
```

**Option 2: Set manually**
```bash
# Core environment variables
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
heroku config:set NODE_ENV="production"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set STRIPE_SECRET_KEY="your_stripe_secret_key"
# ... and all other variables from HEROKU_ENV_SETUP.md
```

### 5. Deploy to Heroku

```bash
# Add files to git
git add .

# Commit changes
git commit -m "Prepare for Heroku deployment"

# Push to Heroku
git push heroku main
```

If your branch is not named `main`, use:

```bash
git push heroku your-branch-name:main
```

### 6. Scale the App

```bash
heroku ps:scale web=1
```

### 7. Open the App

```bash
heroku open
```

### 8. Check Logs

If you encounter any issues:

```bash
heroku logs --tail
```

## Updating Your Deployed App

To update your app after making changes:

```bash
git add .
git commit -m "Description of changes"
git push heroku main
```

## Common Issues

1. **Failing to build**: Check logs with `heroku logs --tail`
2. **Database connection issues**: Verify your MongoDB Atlas connection string and whitelist settings
3. **Missing environment variables**: See `HEROKU_ENV_SETUP.md` file
4. **API requests failing**: Ensure your client is using the correct API URL
5. **CORS issues**: Add your Heroku app URL to the allowed origins in `server.js`

## Additional Resources

- [Heroku Node.js Documentation](https://devcenter.heroku.com/articles/nodejs-support)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/) 