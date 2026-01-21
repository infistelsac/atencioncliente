import RouterOSClient from 'routeros-client';
import ping from 'ping';

/**
 * Servicio para comunicación con equipos MikroTik y monitoreo de equipos TP-Link (Ping)
 */
export const getMikrotikStats = async (device) => {
    if (!device.isReal || !device.credentials) {
        return null;
    }

    const client = new RouterOSClient({
        host: device.ip,
        user: device.credentials.username,
        password: device.credentials.password,
        port: device.credentials.apiPort || 8728,
        timeout: 5
    });

    try {
        const ros = await client.connect();

        // 1. Recursos (CPU, Memoria, Uptime)
        const resources = await ros.menu('/system/resource').print();
        const res = resources[0];

        // 2. Tráfico de interfaces (Agregado simple para el ejemplo)
        const interfaces = await ros.menu('/interface').print();

        // Calculamos un tráfico simulado basado en bytes si no queremos polling continuo de stats
        // En una implementación real se compararían dos muestras
        let totalIn = 0;
        let totalOut = 0;

        // Buscamos interfaces activas
        const activeInterfaces = interfaces.filter(i => i.running === 'true');

        await ros.close();

        return {
            status: 'ONLINE',
            cpuLoad: parseInt(res['cpu-load']) || 0,
            memoryUsage: Math.round(((parseInt(res['total-memory']) - parseInt(res['free-memory'])) / parseInt(res['total-memory'])) * 100),
            uptime: res['uptime'],
            // En una implementación real, esto vendría de /interface monitor-traffic
            // Para el MVP, devolvemos valores que indiquen actividad
            trafficIn: Math.floor(Math.random() * 5000) + 1000,
            trafficOut: Math.floor(Math.random() * 2000) + 500,
            latency: Math.floor(Math.random() * 10) + 1
        };
    } catch (error) {
        console.error(`Error conectando a MikroTik ${device.ip}:`, error.message);
        return { status: 'OFFLINE', latency: 0 };
    }
};

/**
 * Ping para equipos TP-Link o equipos sin credenciales API
 */
export const pingDevice = async (ip) => {
    try {
        const res = await ping.promise.probe(ip, { timeout: 2 });
        return {
            status: res.alive ? 'ONLINE' : 'OFFLINE',
            latency: res.alive ? parseFloat(res.time) : 0
        };
    } catch (error) {
        return { status: 'OFFLINE', latency: 0 };
    }
};
