# Phase 2: Docker Compose - Linking Multiple Services

## Overview
In Phase 2, we learned how to use Docker Compose to orchestrate multiple containers that communicate with each other. Instead of managing individual containers manually, Compose lets us define all services in one file and manage them together.

## Key Concepts

### What is Docker Compose?
Docker Compose is a tool that defines and runs multi-container Docker applications. You write a YAML file that describes all your services, and then run a single command to start everything.

### Service Communication
When services are in the same Docker Compose network, they can communicate using the **service name as the hostname**:
- `sender-service` can reach `listener-service` at `http://listener-service:4000`
- No need for IP addresses - Docker's internal DNS handles it

### docker-compose.yaml Structure

```yaml
version: '3.8'                    # Compose file version

services:                         # Define all your services
  sender-service:
    build: ./app/sender           # Build from this Dockerfile
    ports:
      - "3000:3000"              # Map host:container port
    networks:
      - app-network              # Connect to network

  listener-service:
    build: ./app/listener
    ports:
      - "4000:4000"
    networks:
      - app-network

networks:                         # Define custom networks
  app-network:
    driver: bridge               # Bridge driver connects containers
```

## How It Works

1. **Sender Container** (Port 3000)
   - Runs `sender.js` which starts an Express server
   - Has endpoint `/call-listener` that makes HTTP requests to the listener
   - Uses `axios` to call `http://listener-service:4000/receive`

2. **Listener Container** (Port 4000)
   - Runs `listener.js` which starts an Express server
   - Has endpoint `/receive` that accepts requests from sender
   - Returns a JSON response with timestamp

3. **Network Communication**
   - Both containers are on the `app-network`
   - They can call each other using service names
   - Docker's internal DNS resolves `listener-service` to the container's IP

## Running Phase 2

### Prerequisites
Make sure you have the fixed Dockerfiles:
- `COPY . ./` (NOT `COPY ../` or `COPY . ./listener`)
- Both `package.json` files include necessary dependencies (express, axios)

### Step 1: Build and Start Containers
```bash
docker-compose up --build
```

This will:
- Build the sender image from `./app/sender`
- Build the listener image from `./app/listener`
- Create the `app-network` bridge network
- Start both containers and attach them to the network
- Show logs from both services

### Step 2: Test the Services
Open a new terminal and test the endpoints:

```bash
# Test sender health
curl http://localhost:3000/health

# Test sender calling listener (cross-container communication)
curl http://localhost:3000/call-listener
```

### Expected Response
When you hit `/call-listener`, you should see:
```json
{
  "sender_status": "Successfully reached listener!",
  "listener_said": {
    "reply": "Hello Sender! This is the Listener on port 4000.",
    "timestamp": "2026-01-22T10:35:00.000Z"
  }
}
```

### Step 3: Stop Containers
```bash
docker-compose down
```

This removes all containers and networks created by Compose.

## Key Files

- `docker-compose.yaml` - Orchestration configuration (at project root)
- `app/sender/Dockerfile` - Sender container definition
- `app/sender/sender.js` - Sender application
- `app/sender/package.json` - Sender dependencies
- `app/listener/Dockerfile` - Listener container definition
- `app/listener/listener.js` - Listener application
- `app/listener/package.json` - Listener dependencies

## Summary
Phase 2 demonstrates:
- ✓ Using Docker Compose to manage multiple containers
- ✓ Service-to-service communication via network
- ✓ Port mapping and networking
- ✓ Container orchestration with a single YAML file

Phase 2 Complete! 🎉 