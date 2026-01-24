const express = require('express');
const axios = require('axios'); // You'll need to run 'npm install axios'
const app = express();
const port = 3000;
const path = require('path');

// Load environment-specific .env file
const environment = process.env.NODE_ENV || 'local';
console.log(`Loading config for environment: ${environment}`);
require('dotenv').config({ path: path.resolve(__dirname, `.env.${environment}`) });

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// NEW: This endpoint calls the other container
app.get('/call-listener', async (req, res) => {
  try {
    // Use environment variable for the listener URL, fallback to default for local dev
    const listenerUrl = process.env.LISTENER_SERVICE_URL || 'http://listener-service:4000/receive';
    const response = await axios.get(listenerUrl);
    res.json({
      sender_status: "Successfully reached listener!",
      listener_said: response.data
    });
  } catch (error) {
    res.status(500).json({ error: "Could not reach listener", details: error.message });
  }
});

// Only start the server if this file is run directly (e.g., node sender.js)
// This prevents the server from starting when imported by a FaaS wrapper
if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Sender running on port ${port}`);
  });
}

module.exports = app;