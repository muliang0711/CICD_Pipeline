const express = require('express'); 

const app = express();
const port = process.env.PORT || 3000;

// first api endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// second api endpoint
app.get("/message", (req, res) => {
  res.json({ message: "deployed vcia CICD" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

