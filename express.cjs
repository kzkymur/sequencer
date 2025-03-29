const express = require('express');
const path = require('path');
const app = express();

app.use('/sequencer', express.static(path.join(__dirname, 'example/dist')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/sequencer`);
});