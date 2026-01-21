
import { DeviceType, ConnectionStatus, NetworkDevice, PortStatus, DeviceTemplate } from '../../types/monitoring';

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  // MIKROTIK - CORE & INFRA
  {
    model: 'CCR2216-1G-12XS-2XQ',
    vendor: 'Mikrotik',
    type: DeviceType.CORE_ROUTER,
    ports: [
      { count: 1, type: 'ether', prefix: 'ether', speed: '1Gbps' },
      { count: 12, type: 'sfp28', prefix: 'sfp-sfpplus', speed: '25Gbps' },
      { count: 2, type: 'qsfp28', prefix: 'qsfp28-', speed: '100Gbps' }
    ],
    description: 'High performance Core Router with 100G support'
  },
  {
    model: 'CCR2116-12G-4S+',
    vendor: 'Mikrotik',
    type: DeviceType.CORE_ROUTER,
    ports: [
      { count: 13, type: 'ether', prefix: 'ether', speed: '1Gbps' },
      { count: 4, type: 'sfp+', prefix: 'sfp-sfpplus', speed: '10Gbps' }
    ],
    description: 'Powerful Core Router for distribution'
  },
  {
    model: 'CCR2004-16G-2S+',
    vendor: 'Mikrotik',
    type: DeviceType.CORE_ROUTER,
    ports: [
      { count: 16, type: 'ether', prefix: 'ether', speed: '1Gbps' },
      { count: 2, type: 'sfp+', prefix: 'sfp-sfpplus', speed: '10Gbps' }
    ]
  },
  {
    model: 'CRS354-48G-4S+2Q+RM',
    vendor: 'Mikrotik',
    type: DeviceType.SWITCH,
    ports: [
      { count: 48, type: 'ether', prefix: 'ether', speed: '1Gbps' },
      { count: 4, type: 'sfp+', prefix: 'sfp-sfpplus', speed: '10Gbps' },
      { count: 2, type: 'qsfp+', prefix: 'qsfp', speed: '40Gbps' }
    ],
    description: 'High density Switch for distribution'
  },

  // MIKROTIK - CORPORATE CLIENTS
  {
    model: 'RB5009UG+S+IN',
    vendor: 'Mikrotik',
    type: DeviceType.TPLINK, // Using TPLINK type for clients generally, but vendor is Mikrotik
    ports: [
      { count: 7, type: 'ether', prefix: 'ether', speed: '1Gbps' },
      { count: 1, type: 'ether', prefix: 'ether', speed: '2.5Gbps' },
      { count: 1, type: 'sfp+', prefix: 'sfp-sfpplus', speed: '10Gbps' }
    ],
    description: 'Powerful Router for Corporate Clients'
  },
  {
    model: 'hAP ax3',
    vendor: 'Mikrotik',
    type: DeviceType.TPLINK,
    ports: [
      { count: 5, type: 'ether', prefix: 'ether', speed: '1Gbps' } // incl. WAN
    ],
    description: 'High performance WiFi 6 for business'
  },

  // TP-LINK - RESIDENTIAL CLIENTS
  {
    model: 'Archer AX10',
    vendor: 'TP-Link',
    type: DeviceType.TPLINK,
    ports: [
      { count: 1, type: 'wan', prefix: 'WAN', speed: '1Gbps' },
      { count: 4, type: 'lan', prefix: 'LAN', speed: '1Gbps' }
    ],
    description: 'WiFi 6 Budget Friendly'
  },
  {
    model: 'Archer C6',
    vendor: 'TP-Link',
    type: DeviceType.TPLINK,
    ports: [
      { count: 1, type: 'wan', prefix: 'WAN', speed: '1Gbps' },
      { count: 4, type: 'lan', prefix: 'LAN', speed: '1Gbps' }
    ],
    description: 'Reliable WiFi 5 Router'
  },
  {
    model: 'Archer AX50',
    vendor: 'TP-Link',
    type: DeviceType.TPLINK,
    ports: [
      { count: 1, type: 'wan', prefix: 'WAN', speed: '1Gbps' },
      { count: 4, type: 'lan', prefix: 'LAN', speed: '1Gbps' }
    ],
    description: 'High performance WiFi 6'
  },
  {
    model: 'Deco X20',
    vendor: 'TP-Link',
    type: DeviceType.TPLINK,
    ports: [
      { count: 2, type: 'ether', prefix: 'Port', speed: '1Gbps' }
    ],
    description: 'Mesh WiFi System'
  },

  // SPLITTERS - PASSIVE
  {
    model: 'Splitter PLC 1:2',
    vendor: 'Generic',
    type: DeviceType.SPLITTER,
    ports: [
      { count: 1, type: 'fiber', prefix: 'IN', speed: 'Passive' },
      { count: 2, type: 'fiber', prefix: 'OUT', speed: 'Passive' }
    ],
    description: 'Passive Optical Splitter 1:2'
  },
  {
    model: 'Splitter PLC 1:4',
    vendor: 'Generic',
    type: DeviceType.SPLITTER,
    ports: [
      { count: 1, type: 'fiber', prefix: 'IN', speed: 'Passive' },
      { count: 4, type: 'fiber', prefix: 'OUT', speed: 'Passive' }
    ],
    description: 'Passive Optical Splitter 1:4'
  },
  {
    model: 'Splitter PLC 1:8',
    vendor: 'Generic',
    type: DeviceType.SPLITTER,
    ports: [
      { count: 1, type: 'fiber', prefix: 'IN', speed: 'Passive' },
      { count: 8, type: 'fiber', prefix: 'OUT', speed: 'Passive' }
    ],
    description: 'Passive Optical Splitter 1:8'
  },
  {
    model: 'Splitter PLC 1:16',
    vendor: 'Generic',
    type: DeviceType.SPLITTER,
    ports: [
      { count: 1, type: 'fiber', prefix: 'IN', speed: 'Passive' },
      { count: 16, type: 'fiber', prefix: 'OUT', speed: 'Passive' }
    ],
    description: 'Passive Optical Splitter 1:16'
  }
];

const now = Date.now();

export const INITIAL_DEVICES: NetworkDevice[] = [
  {
    id: 's1-router',
    name: 'Core Central',
    model: 'CCR2216-1G-12XS-2XQ',
    ip: '10.0.0.1',
    mac: 'E4:8D:8C:01:01:01',
    type: DeviceType.CORE_ROUTER,
    status: ConnectionStatus.ONLINE,
    latency: 1,
    uptime: '45d 12h',
    statusChangedAt: now - 3931200000,
    trafficIn: 850000,
    trafficOut: 420000,
    cpuLoad: 15,
    memoryUsage: 30,
    links: ['s2-router', 's3-router', 's1-sw'],
    firmware: 'RouterOS 7.14',
    siteId: 'site-1',
    siteName: 'Nodo Central',
    ports: [
      { id: 's1-p1', name: 'eth1', status: PortStatus.CONNECTED, connectedToDeviceId: 's2-router', speed: '10Gbps' },
      { id: 's1-p2', name: 'eth2', status: PortStatus.CONNECTED, connectedToDeviceId: 's3-router', speed: '10Gbps' },
      { id: 's1-p3', name: 'eth3', status: PortStatus.CONNECTED, connectedToDeviceId: 's1-sw', speed: '10Gbps' },
      { id: 's1-p4', name: 'eth4', status: PortStatus.DISCONNECTED },
      { id: 's1-p5', name: 'eth5', status: PortStatus.DISCONNECTED },
    ]
  },
  {
    id: 's1-sw',
    name: 'Switch Dist 01',
    model: 'CRS354-48G-4S+2Q+RM',
    ip: '10.0.0.2',
    mac: 'E4:8D:8C:01:01:02',
    type: DeviceType.SWITCH,
    status: ConnectionStatus.ONLINE,
    latency: 1,
    uptime: '45d 12h',
    statusChangedAt: now - 3931200000,
    trafficIn: 120000,
    trafficOut: 80000,
    cpuLoad: 8,
    links: ['s1-router', 's1-olt'],
    firmware: 'SwitchOS 2.16',
    siteId: 'site-1',
    siteName: 'Nodo Central',
    ports: [
      { id: 's1-sw-p1', name: 'eth1', status: PortStatus.CONNECTED, connectedToDeviceId: 's1-router', speed: '10Gbps' },
      { id: 's1-sw-p2', name: 'eth2', status: PortStatus.CONNECTED, connectedToDeviceId: 's1-olt', speed: '1Gbps' },
      ...Array.from({ length: 46 }, (_, i) => ({
        id: `s1-sw-p${i + 3}`,
        name: `eth${i + 3}`,
        status: PortStatus.DISCONNECTED
      }))
    ]
  },
  {
    id: 's1-olt',
    name: 'OLT Central',
    model: 'GPON OLT 16 Port',
    ip: '10.0.0.3',
    mac: 'E4:8D:8C:01:01:03',
    type: DeviceType.OLT,
    status: ConnectionStatus.ONLINE,
    latency: 2,
    uptime: '45d 12h',
    statusChangedAt: now - 3931200000,
    trafficIn: 95000,
    trafficOut: 45000,
    links: ['s1-sw', 's1-odf'],
    firmware: 'V2.1.0',
    siteId: 'site-1',
    siteName: 'Nodo Central',
    ports: [
      { id: 's1-olt-p1', name: 'uplink1', status: PortStatus.CONNECTED, connectedToDeviceId: 's1-sw', speed: '1Gbps' },
      { id: 's1-olt-p2', name: 'pon1', status: PortStatus.CONNECTED, connectedToDeviceId: 's1-odf' },
      ...Array.from({ length: 14 }, (_, i) => ({
        id: `s1-olt-p${i + 3}`,
        name: `pon${i + 2}`,
        status: PortStatus.DISCONNECTED
      }))
    ]
  },
  {
    id: 's1-odf',
    name: 'ODF Central',
    model: 'Optical Dist Frame 144p',
    ip: 'N/A',
    mac: 'N/A',
    type: DeviceType.ODF,
    status: ConnectionStatus.ONLINE,
    latency: 0,
    uptime: 'N/A',
    statusChangedAt: now - 3931200000,
    trafficIn: 0,
    trafficOut: 0,
    links: ['s1-olt'],
    firmware: 'Passive',
    siteId: 'site-1',
    siteName: 'Nodo Central'
  },
  {
    id: 's2-router',
    name: 'Core North',
    model: 'CCR2216-1G-12XS-2XQ',
    ip: '10.0.0.10',
    mac: 'E4:8D:8C:02:02:01',
    type: DeviceType.CORE_ROUTER,
    status: ConnectionStatus.ONLINE,
    latency: 5,
    uptime: '12d 05h',
    statusChangedAt: now - 1054800000,
    trafficIn: 450000,
    trafficOut: 210000,
    cpuLoad: 22,
    memoryUsage: 35,
    links: ['s1-router', 's3-router', 's2-sw'],
    firmware: 'RouterOS 7.14',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 's2-sw',
    name: 'Switch Dist 02',
    model: 'CRS354-48G-4S+2Q+RM',
    ip: '10.0.0.11',
    mac: 'E4:8D:8C:02:02:02',
    type: DeviceType.SWITCH,
    status: ConnectionStatus.ONLINE,
    latency: 5,
    uptime: '12d 05h',
    statusChangedAt: now - 1054800000,
    trafficIn: 85000,
    trafficOut: 42000,
    links: ['s2-router', 's2-olt'],
    firmware: 'SwitchOS 2.16',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 's2-olt',
    name: 'OLT North',
    model: 'GPON OLT 8 Port',
    ip: '10.0.0.12',
    mac: 'E4:8D:8C:02:02:03',
    type: DeviceType.OLT,
    status: ConnectionStatus.ONLINE,
    latency: 6,
    uptime: '12d 05h',
    statusChangedAt: now - 1054800000,
    trafficIn: 65000,
    trafficOut: 31000,
    links: ['s2-sw', 'splitter-01', 'splitter-02'],
    firmware: 'V2.1.0',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 's2-odf',
    name: 'ODF North',
    model: 'Optical Dist Frame 72p',
    ip: 'N/A',
    mac: 'N/A',
    type: DeviceType.ODF,
    status: ConnectionStatus.ONLINE,
    latency: 0,
    uptime: 'N/A',
    statusChangedAt: now - 1054800000,
    trafficIn: 0,
    trafficOut: 0,
    links: ['s2-olt'],
    firmware: 'Passive',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 'splitter-01',
    name: 'Splitter 1:8 - A',
    model: 'PLC Splitter 1:8',
    ip: 'N/A',
    mac: 'N/A',
    type: DeviceType.SPLITTER,
    status: ConnectionStatus.ONLINE,
    latency: 0,
    uptime: 'N/A',
    statusChangedAt: now,
    trafficIn: 0,
    trafficOut: 0,
    links: ['s2-olt', 'client-01', 'client-fault'],
    firmware: 'Passive',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 'splitter-02',
    name: 'Splitter 1:8 - B',
    model: 'PLC Splitter 1:8',
    ip: 'N/A',
    mac: 'N/A',
    type: DeviceType.SPLITTER,
    status: ConnectionStatus.ONLINE,
    latency: 0,
    uptime: 'N/A',
    statusChangedAt: now,
    trafficIn: 0,
    trafficOut: 0,
    links: ['s2-olt', 'client-suspended', 'client-cancelled-01'],
    firmware: 'Passive',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 'client-01',
    name: 'Client_A (Activo)',
    model: 'Archer C6',
    ip: '192.168.10.50',
    mac: '50:C7:BF:01:02:03',
    type: DeviceType.TPLINK,
    status: ConnectionStatus.ONLINE,
    latency: 12,
    uptime: '12h 30m',
    statusChangedAt: now - 45000000,
    trafficIn: 1200,
    trafficOut: 450,
    contractedIn: 300,
    contractedOut: 150,
    consumedIn: 45800, // 45.8 GB
    consumedOut: 12400, // 12.4 GB
    links: ['splitter-01'],
    firmware: 'TP-Link 1.3.6',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 'client-fault',
    name: 'Client_B (Avería)',
    model: 'WR840N',
    ip: '192.168.10.51',
    mac: 'AC:84:C6:A1:B2:C3',
    type: DeviceType.TPLINK,
    status: ConnectionStatus.FAULT,
    latency: 0,
    uptime: '0m',
    statusChangedAt: now - 3600000,
    trafficIn: 0,
    trafficOut: 0,
    contractedIn: 100,
    contractedOut: 50,
    consumedIn: 2100,
    consumedOut: 800,
    links: ['splitter-01'],
    firmware: 'TP-Link 2.0.1',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 'client-suspended',
    name: 'Client_C (Suspendido)',
    model: 'Archer AX10',
    ip: '192.168.10.55',
    mac: 'B4:EE:B4:AA:BB:CC',
    type: DeviceType.TPLINK,
    status: ConnectionStatus.SUSPENDED,
    latency: 0,
    uptime: '15d',
    statusChangedAt: now - 1296000000,
    trafficIn: 0,
    trafficOut: 0,
    contractedIn: 500,
    contractedOut: 500,
    consumedIn: 89000,
    consumedOut: 45000,
    links: ['splitter-02'],
    firmware: 'TP-Link 1.1.0',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 'client-cancelled-01',
    name: 'Client_E (Baja Definitiva)',
    model: 'Archer C20',
    ip: '192.168.10.99',
    mac: 'C0:C9:E3:11:22:33',
    type: DeviceType.TPLINK,
    status: ConnectionStatus.CANCELLED,
    latency: 0,
    uptime: 'Desactivado',
    statusChangedAt: now - 2592000000,
    trafficIn: 0,
    trafficOut: 0,
    contractedIn: 50,
    contractedOut: 25,
    consumedIn: 0,
    consumedOut: 0,
    links: ['splitter-02'],
    firmware: 'TP-Link 1.0.0',
    siteId: 'site-2',
    siteName: 'Nodo Norte'
  },
  {
    id: 's3-router',
    name: 'Core South',
    model: 'CCR2216-1G-12XS-2XQ',
    ip: '10.0.0.20',
    mac: 'E4:8D:8C:03:03:01',
    type: DeviceType.CORE_ROUTER,
    status: ConnectionStatus.ONLINE,
    latency: 8,
    uptime: '2d 18h',
    statusChangedAt: now - 237600000,
    trafficIn: 320000,
    trafficOut: 110000,
    links: ['s1-router', 's3-sw'],
    firmware: 'RouterOS 7.14',
    siteId: 'site-3',
    siteName: 'Nodo Sur'
  },
  {
    id: 's3-sw',
    name: 'Switch Sur',
    model: 'CRS354-48G',
    ip: '10.0.0.21',
    mac: 'E4:8D:8C:03:03:02',
    type: DeviceType.SWITCH,
    status: ConnectionStatus.ONLINE,
    latency: 9,
    uptime: '2d 18h',
    statusChangedAt: now - 237600000,
    trafficIn: 45000,
    trafficOut: 12000,
    links: ['s3-router', 's3-olt'],
    firmware: 'SwitchOS 2.16',
    siteId: 'site-3',
    siteName: 'Nodo Sur'
  },
  {
    id: 's3-olt',
    name: 'OLT South',
    model: 'GPON OLT 8 Port',
    ip: '10.0.0.22',
    mac: 'E4:8D:8C:03:03:03',
    type: DeviceType.OLT,
    status: ConnectionStatus.ONLINE,
    latency: 10,
    uptime: '2d 18h',
    statusChangedAt: now - 237600000,
    trafficIn: 32000,
    trafficOut: 8000,
    links: ['s3-sw', 'client-nonpayment'],
    firmware: 'V2.1.0',
    siteId: 'site-3',
    siteName: 'Nodo Sur'
  },
  {
    id: 'client-nonpayment',
    name: 'Client_D (Falta Pago)',
    model: 'Archer C6',
    ip: '192.168.20.100',
    mac: 'D8:07:B6:55:44:33',
    type: DeviceType.TPLINK,
    status: ConnectionStatus.NON_PAYMENT,
    latency: 0,
    uptime: '2d',
    statusChangedAt: now - 172800000,
    trafficIn: 0,
    trafficOut: 0,
    contractedIn: 200,
    contractedOut: 100,
    consumedIn: 15400,
    consumedOut: 5200,
    links: ['s3-olt'],
    firmware: 'TP-Link 1.3.6',
    siteId: 'site-3',
    siteName: 'Nodo Sur'
  }
];
