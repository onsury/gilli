const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

// Middleware
router.use(bodyParser.json());

// GET method for webhook verification
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if the token matches the one you sent
    if (mode && token) {
        if (mode === 'subscribe' && token === 'your_verify_token') { // Replace with your verify token
            console.log('Webhook verified');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403); // Forbidden
        }
    }
});

// POST method for receiving messages
router.post('/', (req, res) => {
    const message = req.body;
    console.log('Received message:', message);
    res.sendStatus(200); // Respond to acknowledge receipt
});

module.exports = router;