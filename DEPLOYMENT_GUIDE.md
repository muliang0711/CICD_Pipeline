# FaaS Deployment Guide

Your services (`sender` and `listener`) have been refactored to be "FaaS-ready". They now export their Express apps and use environment variables for service discovery.

Here is what you need to do next to deploy them to a cloud provider.

## Option 1: AWS Lambda (via Serverless Framework)

AWS Lambda requires a small wrapper adapter to translate Lambda events into HTTP requests your Express app understands.

### 1. Install Dependencies
Run this in both `app/sender` and `app/listener` directories:
```bash
npm install serverless-http
```

### 2. Create Handlers
Create a `lambda.js` (or `handler.js`) in each service directory:

**app/listener/lambda.js**:
```javascript
const serverless = require('serverless-http');
const app = require('./listener'); // This imports the app we exported
module.exports.handler = serverless(app);
```

**app/sender/lambda.js**:
```javascript
const serverless = require('serverless-http');
const app = require('./sender');
module.exports.handler = serverless(app);
```

### 3. Configure Serverless
Create a `serverless.yml` in the root of each service or a shared one. Example for `sender`:

```yaml
service: sender-service
provider:
  name: aws
  runtime: nodejs18.x
  environment:
    # URL of your deployed listener lambda
    LISTENER_SERVICE_URL: https://<listener-api-id>.execute-api.us-east-1.amazonaws.com/dev/receive

functions:
  app:
    handler: lambda.handler
    events:
      - http: ANY /
      - http: 'ANY {proxy+}'
```

### 4. Deploy
```bash
serverless deploy
```

---

## Option 2: Google Cloud Functions (2nd Gen)

Google Cloud Functions (GCF) can natively run Express apps without a complex wrapper, as it uses the Functions Framework.

### 1. Prepare for Deployment
Ensure your `package.json` has a `start` script or simply point the deploy command to the entry file.

### 2. Deploy Listener
Deploy the listener first to get its URL.

```bash
cd app/listener
gcloud functions deploy listener-service \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=. \
  --entry-point=app \
  --trigger-http \
  --allow-unauthenticated
```
*Note: `--entry-point=app` works because `listener.js` exports `app`.*

### 3. Deploy Sender
Use the URL from the listener deployment for the environment variable.

```bash
cd app/sender
gcloud functions deploy sender-service \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=. \
  --entry-point=app \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars TO_LISTENER_URL=https://listener-service-url.../receive
```

---

## Summary of Next Steps
1.  **Pick a Provider**: AWS (Lambda) or Google (Cloud Functions).
2.  **Add Adapters** (if AWS): Add `serverless-http` and a handler file.
3.  **Deploy Listener**: Deploy the `listener` service first.
4.  **Get URL**: Copy the HTTP endpoint URL of the deployed listener.
5.  **Deploy Sender**: Deploy `sender` with `LISTENER_SERVICE_URL` environment variable set to the listener's URL.
