export type View = 'dashboard' | 'chat' | 'visits' | 'campaigns' | 'team-chat' | 'tickets' | 'contacts' | 'contact-groups' | 'agents' | 'settings' | 'monitoring';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  type: MessageType;
  status?: 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerAvatar: string;
  customerPhone: string;
  unreadCount: number;
  lastMessageTime: Date;
  messages: Message[];
  tags?: string[];
  status?: 'open' | 'closed' | 'pending';
}

export enum AgentStatus {
  ONLINE = 'online',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'admin' | 'technician';
  status: AgentStatus;
  avatar: string;
  assignedChats: number;
  rating: number;
}

export interface DashboardStats {
  totalMessages: number | string;
  avgResponseTime: string;
  resolvedTickets: number | string;
  activeAgents: number | string;
}

export interface Group {
  id: string;
  name: string;
  // List of contact IDs that belong to this group
  contactIds: string[];
}
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  company?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  tags: string[];
  idDocument?: string;
  clientCode?: string;
  source: 'manual' | 'google';
}


export interface Campaign {
  id: string;
  name: string;
  message: string;
  audience: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  sentCount: number;
  totalCount: number;
  readCount: number;
  createdAt: Date;
  scheduledFor?: Date;
}

export interface Maintenance {
  id: string;
  type: 'node' | 'central' | 'fiber_trunk';
  pointIdentifier: string; // Name or ID of the node/central/trunk
  address: string;
  coordinates?: { lat: number; lng: number };
  date: Date;
  technicianId: string;
  technicianName: string;
  reason: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
}