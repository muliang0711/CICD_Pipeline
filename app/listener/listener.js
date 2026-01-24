const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const path = require('path');

// Load environment-specific .env file
const environment = process.env.NODE_ENV || 'local';
console.log(`Loading config for environment: ${environment}`);
require('dotenv').config({ path: path.resolve(__dirname, `.env.${environment}`) });

app.get('/receive', (req, res) => {
  console.log("Received a request from the Sender!");
  res.json({
    reply: "Hello Sender! This is the Listener on port 4000.",
    timestamp: new Date()
  });
});

// Only start the server if this file is run directly (e.g., node listener.js)
// This prevents the server from starting when imported by a FaaS wrapper
if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Listener app listening at http://localhost:${port}`);
  });
}

module.exports = app;