# Phase 3: CI/CD with GitHub Actions

## Overview
In Phase 3, we implement **Continuous Integration/Continuous Deployment (CI/CD)** using GitHub Actions. This automates testing, building, and pushing Docker images to Docker Hub every time you push code to the `main` branch.

## What is CI/CD?

| Concept | Meaning |
|---------|---------|
| **CI (Continuous Integration)** | Automatically test every code change you push |
| **CD (Continuous Deployment)** | Automatically build and push Docker images to a registry |
| **GitHub Actions** | GitHub's built-in tool for automating workflows |

## The Complete Workflow (main.yaml)

Our workflow has **2 jobs** that run in sequence:

### Job 1: Testing (`test` job)
Runs BEFORE build-and-push, acts as a gatekeeper:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run unit tests for Sender
      run: |
        cd ./app/sender && npm install && npm test
    - name: Run unit tests for Listener
      run: |
        cd ./app/listener && npm install && npm test
```

**What it does:**
1. Checks out your code
2. Installs dependencies and runs Sender tests
3. Installs dependencies and runs Listener tests
4. **If any test fails, the entire workflow stops!**
5. **If all tests pass, build-and-push job is allowed to run**

### Job 2: Build and Push (`build-and-push` job)
Runs ONLY if test job passes:

```yaml
build-and-push:
  needs: test  # Only runs if test job PASSES
  runs-on: ubuntu-latest
  strategy:
    matrix:
      app: [sender, listener]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: ./app/${{ matrix.app }}
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/${{ matrix.app }}-app:latest
```

**What it does:**
1. Logs into Docker Hub with your stored credentials
2. **Uses matrix strategy to build Sender AND Listener in PARALLEL**
3. For each app in matrix:
   - Builds Docker image from `./app/{app}/Dockerfile`
   - Pushes to Docker Hub with tag `{username}/{app}-app:latest`

## Understanding the Matrix Strategy

The matrix lets you run the same job multiple times with different variables:

```yaml
strategy:
  matrix:
    app: [sender, listener]
```

This automatically creates **2 parallel jobs**:

```
Job 1:
  matrix.app = "sender"
  context: ./app/sender
  tags: hocky/sender-app:latest

Job 2 (runs in parallel):
  matrix.app = "listener"
  context: ./app/listener
  tags: hocky/listener-app:latest
```

**Why matrix is better:**
- ✓ **Parallel Execution:** Both jobs run simultaneously (saves time!)
- ✓ **Less Code:** Don't need separate steps for each app
- ✓ **Easy to Expand:** Add a third app by changing 1 line: `app: [sender, listener, database]`
- ✓ **DRY Principle:** Don't Repeat Yourself

## Setup Requirements

### 1. Create Docker Hub Personal Access Token

1. Go to [Docker Hub](https://hub.docker.com)
2. Login to your account
3. Click your **profile icon** (top right) → **Account Settings**
4. Click **Security** on the left sidebar
5. Click **New Access Token**
6. Name it: "GitHub Actions"
7. Click **Generate**
8. **Copy the token immediately** (you can't see it again!)

### 2. Add GitHub Secrets

GitHub Secrets are encrypted variables stored safely in your repo. The workflow uses them but can't display them in logs.

1. Go to your GitHub repo
2. Click **Settings** (top right)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** (green button)
5. Add **First Secret:**
   - **Name:** `DOCKERHUB_USERNAME`
   - **Value:** Your Docker Hub username (e.g., `hocky`)
   - Click **Add secret**
6. Add **Second Secret:**
   - **Name:** `DOCKERHUB_TOKEN`
   - **Value:** Paste the token from Step 1
   - Click **Add secret**

Now you have 2 secrets that the workflow can access with:
- `${{ secrets.DOCKERHUB_USERNAME }}`
- `${{ secrets.DOCKERHUB_TOKEN }}`

### 3. (Optional) Pre-create Docker Hub Repositories

If you want to test with private repos, create them first:

1. Go to [Docker Hub](https://hub.docker.com)
2. Click **Create Repository**
3. Create:
   - Name: `sender-app` → Click **Create**
   - Name: `listener-app` → Click **Create**

If you don't create them, Docker Hub will create them automatically on first push (as public repos).

## How the Workflow Executes

### Trigger
You push code to the `main` branch:
```bash
git add .
git commit -m "Add tests and CI/CD"
git push origin main
```

### Execution Flow
```
1. GitHub detects push to main branch
   ↓
2. Runs "test" job
   ├─ Checkout code
   ├─ Run: cd ./app/sender && npm install && npm test
   └─ Run: cd ./app/listener && npm install && npm test
   ↓
3a. If any test fails:
   └─ Workflow stops ❌
   └─ Email notifies you of failure
   └─ "build-and-push" job is skipped
   
3b. If all tests pass ✓:
   ↓
4. Runs "build-and-push" job with matrix strategy:
   ├─ [PARALLEL] matrix.app = sender
   │  ├─ Login to Docker Hub
   │  ├─ Build ./app/sender → Docker image
   │  └─ Push to hocky/sender-app:latest
   │
   └─ [PARALLEL] matrix.app = listener
      ├─ Login to Docker Hub
      ├─ Build ./app/listener → Docker image
      └─ Push to hocky/listener-app:latest
   ↓
5. Success! Both images are now on Docker Hub ✓
```

## Monitor the Workflow

### Option 1: GitHub Web Interface
1. Go to your GitHub repo
2. Click **Actions** tab (top of repo)
3. Click the latest workflow run
4. You'll see:
   - Overall status (passed/failed)
   - Each job's status
   - Detailed logs for each step
   - Timing information

### Option 2: Email Notifications
GitHub automatically emails you when:
- ✓ Workflow succeeds
- ✗ Workflow fails
- The email includes a link to view logs

## Verify Images on Docker Hub

After workflow succeeds:

1. Go to [Docker Hub](https://hub.docker.com)
2. Login
3. Click your username (top right) → **Repositories**
4. You should see:
   - `sender-app` with tag `latest`
   - `listener-app` with tag `latest`
5. Click on each to see:
   - Tags
   - Image details
   - Pull count
   - Last pushed timestamp

Now anyone can pull and run your images:
```bash
docker pull hocky/sender-app:latest
docker run -p 3000:3000 hocky/sender-app:latest
```

## Testing in the Workflow

### Sender Tests (sender.test.js)
Comprehensive test suite that validates:
- ✓ `/health` endpoint returns correct status
- ✓ `/call-listener` reaches listener successfully (with mocked axios)
- ✓ Error handling when listener fails
- ✓ Timeout scenarios
- ✓ Integration: complete communication flow
- ✓ Endpoint separation and isolation

### Listener Tests (listener.test.js)
Comprehensive test suite that validates:
- ✓ `/receive` endpoint returns correct response structure
- ✓ Timestamp format is valid
- ✓ Handles multiple concurrent requests
- ✓ Returns proper JSON content type
- ✓ Rejects non-existent routes with 404

### Run Tests Locally
```bash
# Test Sender
cd app/sender
npm install
npm test

# Test Listener
cd ../listener
npm install
npm test
```

Tests must pass locally before pushing, otherwise GitHub Actions will also fail.

## File Structure

```
Project1_CICD/
├── .github/
│   └── workflows/
│       └── main.yaml                    # CI/CD workflow definition
├── app/
│   ├── sender/
│   │   ├── Dockerfile                   # Sender container config
│   │   ├── sender.js                    # Sender app (exports { app, server })
│   │   ├── package.json                 # Dependencies + test script
│   │   ├── jest.config.js               # Test configuration
│   │   └── test/
│   │       └── sender.test.js           # Sender unit tests
│   └── listener/
│       ├── Dockerfile                   # Listener container config
│       ├── listener.js                  # Listener app (exports { app, server })
│       ├── package.json                 # Dependencies + test script
│       ├── jest.config.js               # Test configuration
│       └── test/
│           └── listener.test.js         # Listener unit tests
├── docker-compose.yaml                  # Local multi-container testing
├── Phase1.md                            # Docker fundamentals
├── Phase2.md                            # Docker Compose
└── Phase3.md                            # CI/CD (this file)
```

## Key Concepts Explained

### GitHub Secrets
Encrypted variables stored in your GitHub repo settings:
- Never displayed in logs
- Never committed to git
- Only accessible in workflows you define
- Used for: API keys, tokens, passwords, credentials

Access with: `${{ secrets.SECRET_NAME }}`

### Workflow Triggers
```yaml
on:
  push:
    branches: [ "main" ]  # Runs every time you push to main
```

Other common triggers:
- `pull_request` - Run on PR creation
- `schedule` - Run on a schedule (e.g., daily)
- `workflow_dispatch` - Run manually from GitHub UI

### Job Dependencies
```yaml
build-and-push:
  needs: test  # This job waits for "test" job to complete
```

If "test" fails, "build-and-push" is skipped.

### Matrix Variables
```yaml
strategy:
  matrix:
    app: [sender, listener]
```

Accessible in steps with: `${{ matrix.app }}`

Each value creates a parallel job.

## Troubleshooting

### Problem: "denied: requested access to the resource is denied"

**Cause:** Using placeholder `your-username` instead of actual username or secret

**Solution:**
```yaml
# ❌ WRONG
tags: your-username/sender-app:latest

# ✓ CORRECT
tags: ${{ secrets.DOCKERHUB_USERNAME }}/sender-app:latest
```

### Problem: "Error: No secret named DOCKERHUB_USERNAME"

**Cause:** Secrets not added to GitHub repo

**Solution:**
1. Go to repo → Settings → Secrets and variables → Actions
2. Add `DOCKERHUB_USERNAME` with your Docker Hub username
3. Add `DOCKERHUB_TOKEN` with your access token

### Problem: Tests fail in GitHub but pass locally

**Cause:** Environment differences or path issues

**Solutions:**
1. Check that paths use `./app/sender` and `./app/listener`
2. Verify `beforeEach()` and `afterAll()` hooks in tests
3. Check npm scripts in package.json: `"test": "jest"`
4. Look at GitHub Actions logs for specific errors

### Problem: Builds run sequentially instead of parallel

**Cause:** Matrix strategy not properly configured

**Solution:** Verify indentation in main.yaml:
```yaml
build-and-push:
  needs: test
  runs-on: ubuntu-latest
  strategy:              # Indented under job
    matrix:             # Indented under strategy
      app: [sender, listener]
```

### Problem: "Jest did not exit one second after the test run has completed"

**Cause:** Express server not properly closed

**Solution:** Make sure tests have:
```javascript
const { app, server } = require('../sender');

afterAll((done) => {
  server.close(done);  // Properly closes server
});
```

## Next Steps: Extending the Pipeline

After Phase 3 works, you can add:

1. **Code Quality:**
   - Run linters (ESLint)
   - Check code formatting (Prettier)
   - Code coverage reports

2. **Security:**
   - Scan for vulnerabilities (npm audit)
   - Container security scanning
   - SAST (Static Application Security Testing)

3. **Performance:**
   - Run load tests
   - Check image sizes
   - Performance benchmarks

4. **Deployment:**
   - Deploy to Kubernetes
   - Deploy to cloud (AWS, GCP, Azure)
   - Blue-green deployments

5. **Monitoring:**
   - Notify Slack on success/failure
   - Email notifications
   - Webhook calls to other systems

## Summary

**Phase 3 demonstrates:**
- ✓ Setting up CI/CD with GitHub Actions
- ✓ Automated testing before deployment
- ✓ Conditional job execution (build only if tests pass)
- ✓ Matrix strategy for efficient parallel builds
- ✓ Securely storing and using credentials
- ✓ Complete pipeline from code push to Docker Hub

**What you now have:**

| Phase | What it does |
|-------|---|
| Phase 1 | Build and run single Docker container |
| Phase 2 | Orchestrate multiple containers with Docker Compose |
| Phase 3 | Automate testing and image deployment with CI/CD |

Every time you push code to `main` branch:
1. GitHub Actions automatically tests your code
2. If tests pass, builds Docker images
3. Pushes images to Docker Hub
4. You're notified of success or failure

**Phase 3 Complete! 🎉**

Your project now has professional-grade CI/CD automation!
