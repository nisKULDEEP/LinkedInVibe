require('dotenv').config();
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./src/routes/api');
const webhookRoutes = require('./src/routes/webhooks');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Mount Webhooks first (needs raw body)
app.use('/webhook', webhookRoutes);

// JSON body parser for API
app.use(express.json());

// Mount API Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: "OK", version: "2.0.0" });
});

app.listen(port, () => {
    console.log(`Backend Server running on port ${port}`);
});
