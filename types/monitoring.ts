
export enum DeviceType {
  CORE_ROUTER = 'CORE_ROUTER',
  SWITCH = 'SWITCH',
  OLT = 'OLT',
  ODF = 'ODF',
  TPLINK = 'TPLINK',
  GATEWAY = 'GATEWAY',
  SPLITTER = 'SPLITTER'
}

export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  WARNING = 'WARNING',
  SUSPENDED = 'SUSPENDED',
  NON_PAYMENT = 'NON_PAYMENT',
  FAULT = 'FAULT',
  CANCELLED = 'CANCELLED'
}

export enum PortStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  FAULT = 'FAULT'
}

export interface PortTemplate {
  count: number;
  type: string; // e.g. 'ether', 'sfp', 'wlan'
  prefix: string; // e.g. 'eth', 'sfp-sfpplus', 'wlan'
  speed?: string;
}

export interface DeviceTemplate {
  model: string;
  vendor: 'Mikrotik' | 'TP-Link' | 'Generic';
  type: DeviceType;
  ports: PortTemplate[];
  description?: string;
}

export interface NetworkPort {
  id: string;
  name: string; // e.g., 'eth1', 'sfp-sfpplus1'
  status: PortStatus;
  connectedToDeviceId?: string;
  connectedToPortName?: string;
  speed?: string; // e.g., '1Gbps', '10Gbps'
  lastChange?: number;
}

export interface ConnectionCredentials {
  apiPort: number;
  username: string;
  password?: string;
  useSsl: boolean;
  lastSync?: string;
}

export interface NetworkSite {
  id: string;
  name: string;
  parentId?: string; // Para sub-nodos
  latitude?: number;
  longitude?: number;
}

export interface NetworkDevice {
  id: string;
  name: string;
  model: string;
  ip: string;
  mac: string;
  type: DeviceType;
  status: ConnectionStatus;
  latency: number;
  uptime: string;
  statusChangedAt: number;
  trafficIn: number;
  trafficOut: number;
  // Nuevos campos comerciales y de consumo
  contractedIn?: number;  // Mbps contratados Bajada
  contractedOut?: number; // Mbps contratados Subida
  consumedIn?: number;    // MB consumidos Bajada
  consumedOut?: number;   // MB consumidos Subida
  cpuLoad?: number;
  memoryUsage?: number;
  links: string[]; // Se sincroniza automáticamente con port.connectedToDeviceId
  firmware: string;
  siteId: string;
  siteName: string;
  isReal?: boolean;
  credentials?: ConnectionCredentials;
  ports?: NetworkPort[];
  // Splitter Specific
  splitterRatio?: string; // e.g. "1:8"
  splitterLevel?: number; // e.g. 1, 2
  latitude?: number;
  longitude?: number;
  linkRoutes?: Record<string, { lat: number; lng: number }[]>; // Key: targetId, Value: Waypoints (poles)
}

export interface NetworkStats {
  totalNodes: number;
  activeClients: number;
  totalBandwidth: number;
  criticalAlerts: number;
}
