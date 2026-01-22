const express = require('express');
const axios = require('axios'); // You'll need to run 'npm install axios'
const app = express();
const port = 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// NEW: This endpoint calls the other container
app.get('/call-listener', async (req, res) => {
  try {
    // We use 'listener-service' because that will be the name in our Docker Compose
    const response = await axios.get('http://listener-service:4000/receive');
    res.json({
      sender_status: "Successfully reached listener!",
      listener_said: response.data
    });
  } catch (error) {
    res.status(500).json({ error: "Could not reach listener", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Sender running on port ${port}`);
});