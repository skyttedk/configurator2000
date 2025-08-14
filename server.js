const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/demo-hello', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo-hello.html'));
});

app.get('/demo-json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo-json.html'));
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
