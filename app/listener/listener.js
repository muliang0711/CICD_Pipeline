const express = require('express');
const app = express();
const port = 4000;

app.get('/receive', (req, res) => {
  console.log("Received a request from the Sender!");
  res.json({ 
    reply: "Hello Sender! This is the Listener on port 4000.",
    timestamp: new Date()
  });
});

const server = app.listen(port, () => {
  console.log(`Listener app listening at http://localhost:${port}`);
});

module.exports = app;