# Heroku Environment Variables Setup

After deploying to Heroku, you need to set the following environment variables in your Heroku app:

```bash
# Core Configuration
heroku config:set NODE_ENV="production"
heroku config:set PORT="8080" # Heroku will override this, but it's good to set

# Database
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"

# Security
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set JWT_EXPIRE="24h" # or whatever value you use
heroku config:set JWT_COOKIE_EXPIRE="24" # or whatever value you use

# API URL (this should be your Heroku app URL)
heroku config:set VITE_API_URL="https://your-app-name.herokuapp.com/api"
heroku config:set VITE_REACT_APP_API_URL="https://your-app-name.herokuapp.com/api"

# Stripe Integration
heroku config:set STRIPE_SECRET_KEY="your_stripe_secret_key"
heroku config:set STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
heroku config:set VITE_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"

# Mapbox API
heroku config:set VITE_REACT_APP_MAPBOX_TOKEN="your_mapbox_token"
heroku config:set VITE_MAPBOX_STYLE="mapbox://styles/mapbox/streets-v11" # optional

# Firebase Configuration
heroku config:set VITE_FIREBASE_API_KEY="your_firebase_api_key"
heroku config:set VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
heroku config:set VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
heroku config:set VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
heroku config:set VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
heroku config:set VITE_FIREBASE_APP_ID="your_firebase_app_id"
heroku config:set VITE_FIREBASE_MEASUREMENT_ID="your_firebase_measurement_id"

# Client URL
heroku config:set CLIENT_URL="https://your-app-name.herokuapp.com"
```

To set them all at once, you can:

1. Create a `.env.production` file with all the above variables (without the `heroku config:set` part)
2. Use the Heroku CLI plugin for .env files:

```bash
heroku plugins:install heroku-config
heroku config:push -f .env.production
```

**IMPORTANT:** Never commit your `.env.production` file to Git for security reasons.

## Checking Configuration

To verify all environment variables are set correctly:

```bash
heroku config
``` 