import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMikrotikStats, pingDevice } from './services/mikrotik.js';

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

// --- MONITOREO MIKROTIK & TP-LINK ---

let monitorDevices = []; // Lista de dispositivos a monitorear
let deviceStats = {};   // Almacén de estadísticas en memoria

// Motor de polling
async function startPolling() {
    console.log('Iniciando motor de monitoreo...');

    const poll = async () => {
        for (const device of monitorDevices) {
            try {
                let stats;
                if (device.type !== 'tp-link' && device.isReal && device.credentials) {
                    stats = await getMikrotikStats(device);
                } else {
                    stats = await pingDevice(device.ip);
                }

                if (stats) {
                    deviceStats[device.id] = {
                        ...stats,
                        lastUpdate: Date.now()
                    };
                }
            } catch (err) {
                console.error(`Error monitoreando ${device.name}:`, err.message);
            }
        }
    };

    // Primera ejecución
    await poll();
    // Loop cada 30 segundos
    setInterval(poll, 30000);
}

// Endpoints de monitoreo
app.get('/api/monitoring/data', (req, res) => {
    res.json(deviceStats);
});

app.post('/api/monitoring/update-devices', (req, res) => {
    monitorDevices = req.body.devices;
    console.log(`Actualizada lista de monitoreo: ${monitorDevices.length} equipos.`);
    res.sendStatus(200);
});

// Iniciamos el motor
startPolling();
// ------------------------------------

// Catch-all handler for any request that doesn't match the above
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
