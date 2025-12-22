
export enum DeviceType {
  CORE_ROUTER = 'CORE_ROUTER',
  SWITCH = 'SWITCH',
  OLT = 'OLT',
  ODF = 'ODF',
  TPLINK = 'TPLINK',
  GATEWAY = 'GATEWAY'
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
  links: string[];
  firmware: string;
  siteId: string;
  siteName: string;
  isReal?: boolean;
  credentials?: ConnectionCredentials;
  ports?: NetworkPort[];
}

export interface NetworkStats {
  totalNodes: number;
  activeClients: number;
  totalBandwidth: number;
  criticalAlerts: number;
}
