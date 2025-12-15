import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Meta Webhook Verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // You can set this in Render Environment Variables
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'infistel_token_secure';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request if parameters are missing
    }
});

// Handle incoming messages (placeholder)
app.post('/webhook', (req, res) => {
    console.log('Webhook Received:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

// Catch-all handler for any request that doesn't match the above
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
