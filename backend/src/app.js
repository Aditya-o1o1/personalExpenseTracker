const express = require('express');
const app = express();
const errorMiddleware = require('./middleware/error.middleware');
const routes = require('./routes/index.routes');

app.use(express.json());

app.use('/api', routes);
app.use(errorMiddleware);

module.exports = app;
