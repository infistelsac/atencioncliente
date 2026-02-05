import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import AgentManager from './components/AgentManager';
import Settings from './components/Settings';
import ContactList from './components/ContactList';
import TeamChat from './components/TeamChat';
import CampaignManager from './components/CampaignManager';
import VisitScheduler from './components/VisitScheduler';
import TicketsModule, { Ticket, ADMIN_MOCK_TICKETS } from './components/TicketsModule';
import MonitoringDashboard from './components/monitoring/MonitoringDashboard';
import Login from './components/Login';
import PrivacyPolicy from './components/PrivacyPolicy';
import { View, Agent, AgentStatus, DashboardStats, Conversation, MessageType, Contact, Group } from './types';
import { GroupManager } from './components/GroupManager';
import { Phone, Video, Mic, MicOff, VideoOff, X } from 'lucide-react';
import { databaseService } from './services/databaseService';
import { db } from './services/firebase';

// --- MOCK DATA RESTORATION ---

const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Ana García', email: 'ana@soporte.com', role: 'admin', status: AgentStatus.ONLINE, avatar: 'https://ui-avatars.com/api/?name=Ana+Garcia&background=0D8ABC&color=fff', assignedChats: 12, rating: 4.8 },
  { id: '2', name: 'Carlos Ruiz', email: 'carlos@soporte.com', role: 'agent', status: AgentStatus.BUSY, avatar: 'https://ui-avatars.com/api/?name=Carlos+Ruiz&background=27AE60&color=fff', assignedChats: 8, rating: 4.5 },
  { id: '3', name: 'Laura M.', email: 'laura@soporte.com', role: 'agent', status: AgentStatus.OFFLINE, avatar: 'https://ui-avatars.com/api/?name=Laura+M&background=E74C3C&color=fff', assignedChats: 5, rating: 4.9 },
  { id: '4', name: 'Pedro Tech', email: 'pedro@soporte.com', role: 'technician', status: AgentStatus.ONLINE, avatar: 'https://ui-avatars.com/api/?name=Pedro+Tech&background=F39C12&color=fff', assignedChats: 2, rating: 4.7 },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customerName: 'Juan Pérez',
    customerAvatar: 'https://ui-avatars.com/api/?name=Juan+Perez',
    customerPhone: '+52 55 1234 5678',
    unreadCount: 2,
    lastMessageTime: new Date(),
    messages: [
      { id: '1', text: 'Hola, tengo un problema con mi pedido', senderId: 'customer', timestamp: new Date(Date.now() - 3600000), type: MessageType.TEXT },
      { id: '2', text: 'Claro, ¿me puedes dar tu número de orden?', senderId: 'agent', timestamp: new Date(Date.now() - 3500000), type: MessageType.TEXT },
      { id: '3', text: 'Es el #12345', senderId: 'customer', timestamp: new Date(Date.now() - 3400000), type: MessageType.TEXT },
    ]
  },
  {
    id: '2',
    customerName: 'María López',
    customerAvatar: 'https://ui-avatars.com/api/?name=Maria+Lopez',
    customerPhone: '+57 300 987 6543',
    unreadCount: 0,
    lastMessageTime: new Date(Date.now() - 86400000),
    messages: [
      { id: '1', text: 'Gracias por la ayuda', senderId: 'customer', timestamp: new Date(Date.now() - 86400000), type: MessageType.TEXT }
    ]
  }
];

const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    phone: '+52 55 1234 5678',
    email: 'juan.perez@email.com',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Perez',
    company: 'Tech Solutions',
    location: 'CDMX, México',
    coordinates: { lat: 19.4326, lng: -99.1332 },
    tags: ['VIP', 'Soporte'],
    source: 'manual'
  },
  {
    id: '2',
    name: 'María López',
    phone: '+57 300 987 6543',
    email: 'maria.lopez@email.com',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Lopez',
    company: 'Freelance',
    location: 'Bogotá, Colombia',
    coordinates: { lat: 4.7110, lng: -74.0721 },
    tags: ['Nuevo', 'Ventas'],
    source: 'manual'
  }
];

const MOCK_STATS: DashboardStats = {
  totalMessages: 1250,
  avgResponseTime: '2m 30s',
  resolvedTickets: 85,
  activeAgents: 3
};

// --- CALL OVERLAY COMPONENT ---
const CallOverlay: React.FC<{
  isActive: boolean;
  name: string;
  avatar: string;
  type: 'audio' | 'video';
  onEndCall: () => void;
}> = ({ isActive, name, avatar, type, onEndCall }) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <img src={avatar} alt={name} className="w-32 h-32 rounded-full border-4 border-white/20 shadow-2xl" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75"></div>
        </div>
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-2">{name}</h2>
          <p className="text-lg text-white/70 animate-pulse">
            {type === 'video' ? 'Videollamada entrante...' : 'Llamando...'}
          </p>
        </div>
      </div>

      <div className="mt-16 flex items-center gap-8">
        <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-all">
          <MicOff size={32} />
        </button>
        {type === 'video' && (
          <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-all">
            <VideoOff size={32} />
          </button>
        )}
        <button
          onClick={onEndCall}
          className="p-6 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-110 transition-all"
        >
          <Phone size={40} className="rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [groups, setGroups] = useState<Group[]>([]);
  const [badges, setBadges] = useState<Record<string, number>>({});

  // Firestore Listeners & Local Storage Initial Load
  useEffect(() => {
    // Load from LocalStorage first (Immediate)
    const savedContacts = localStorage.getItem('infistel_contacts');
    if (savedContacts) setContacts(JSON.parse(savedContacts));

    const savedAgents = localStorage.getItem('infistel_agents');
    if (savedAgents) setAgents(JSON.parse(savedAgents));

    const savedGroups = localStorage.getItem('infistel_groups');
    if (savedGroups) setGroups(JSON.parse(savedGroups));

    if (!db) return;

    // Listen to Firestore updates if available
    const unsubContacts = databaseService.listen('contacts', (data) => {
      if (data.length > 0) {
        setContacts(data);
        localStorage.setItem('infistel_contacts', JSON.stringify(data));
      }
    });

    const unsubAgents = databaseService.listen('agents', (data) => {
      if (data.length > 0) {
        setAgents(data);
        localStorage.setItem('infistel_agents', JSON.stringify(data));
      }
    });

    const unsubConversations = databaseService.listen('conversations', (data) => {
      if (data.length > 0) setConversations(data);
    });

    return () => {
      unsubContacts();
      unsubAgents();
      unsubConversations();
    };
  }, []);

  // Persistence Handlers
  const handleUpdateContacts = async (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem('infistel_contacts', JSON.stringify(newContacts));

    if (db) {
      // Find what changed and sync to DB (Simple approach for now: sync local to DB)
      // In a real app we'd call databaseService.add/update for the specific item
      console.log("Syncing contacts to Firestore...");
    }
  };

  const handleUpdateAgents = async (newAgents: Agent[]) => {
    setAgents(newAgents);
    localStorage.setItem('infistel_agents', JSON.stringify(newAgents));
  };

  const handleUpdateGroups = async (newGroups: Group[]) => {
    setGroups(newGroups);
    localStorage.setItem('infistel_groups', JSON.stringify(newGroups));
  };

  const handleAddContact = (newContact: Contact) => {
    const updated = [newContact, ...contacts];
    handleUpdateContacts(updated);
    if (db) databaseService.add('contacts', newContact);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    const updated = contacts.map(c => c.id === updatedContact.id ? updatedContact : c);
    handleUpdateContacts(updated);
    if (db) databaseService.update('contacts', updatedContact.id, updatedContact);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    handleUpdateContacts(updated);
    if (db) databaseService.delete('contacts', id);
  };

  const handleAddAgent = (newAgent: Agent) => {
    const updated = [...agents, newAgent];
    handleUpdateAgents(updated);
    if (db) databaseService.add('agents', newAgent);
  };

  const handleDeleteAgent = (id: string) => {
    const updated = agents.filter(a => a.id !== id);
    handleUpdateAgents(updated);
    if (db) databaseService.delete('agents', id);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    const updated = agents.map(a => a.id === updatedAgent.id ? updatedAgent : a);
    handleUpdateAgents(updated);
    if (db) databaseService.update('agents', updatedAgent.id, updatedAgent);
  };

  // Auth Check
  useEffect(() => {
    const token = localStorage.getItem('infistel_auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('infistel_auth_token', 'demo-token-' + Date.now());
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('infistel_auth_token');
    setIsAuthenticated(false);
    setCurrentView('dashboard'); // Reset view on logout
  };

  const handleViewPrivacy = () => {
    setCurrentView('privacy');
  };

  // Badge Logic
  useEffect(() => {
    const updateBadge = (pendingCount: number) => {
      setBadges(prev => ({ ...prev, tickets: pendingCount }));
    };

    if (!db) {
      const pendingCount = ADMIN_MOCK_TICKETS.filter(t => t.status === 'pendiente').length;
      updateBadge(pendingCount);
      return;
    }

    const unsubscribe = databaseService.listen('tickets', (data) => {
      const combined = [...data, ...ADMIN_MOCK_TICKETS];
      const pending = combined.filter((t: any) => t.status === 'pendiente').length;
      updateBadge(pending);
    });

    return () => unsubscribe();
  }, []);

  // Chat Badges Logic
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    setBadges(prev => ({ ...prev, chat: totalUnread }));
  }, [conversations]);

  // Call State
  const [callState, setCallState] = useState<{ active: boolean, name: string, avatar: string, type: 'audio' | 'video' }>({
    active: false, name: '', avatar: '', type: 'audio'
  });



  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('infistel_dark_mode', String(newMode));
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('infistel_dark_mode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSendMessage = (conversationId: string, text: string, type: MessageType = MessageType.TEXT) => {
    const newMessage: any = {
      id: Date.now().toString(),
      text,
      senderId: 'agent',
      timestamp: new Date(),
      type,
      status: 'sent'
    };

    setConversations(conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessageTime: new Date()
        };
      }
      return conv;
    }));
  };

  const handleEditMessage = (conversationId: string, messageId: string, newText: string) => {
    setConversations(conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
          )
        };
      }
      return conv;
    }));
  };

  const handleStartCall = (name: string, avatar: string, type: 'audio' | 'video') => {
    setCallState({ active: true, name, avatar, type });
  };

  const handleTicketCreated = (ticket: Ticket) => {
    // 1. Check if conversation already exists by customer name or phone (mock logic usually relies on ID, but here phone is safer)
    let conversation = conversations.find(c => c.customerPhone === ticket.phone || c.customerName === ticket.customerName);
    let conversationId = conversation ? conversation.id : Date.now().toString();

    const newMessage: any = {
      id: Date.now().toString(),
      text: `🎫 Nuevo Ticket Registrado: ${ticket.ticketNumber}\n\nHola ${ticket.customerName}, hemos registrado su solicitud de tipo *${ticket.type.toUpperCase()}*.\n\nDetalle: ${ticket.description}\n\nUn asesor revisará su caso a la brevedad.`,
      senderId: 'agent', // System or automatic message
      timestamp: new Date(),
      type: MessageType.TEXT,
      status: 'sent'
    };

    if (conversation) {
      // Update existing conversation
      setConversations(conversations.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessageTime: new Date(),
            unreadCount: 0 // Agent sent it, so no unread for agent
          };
        }
        return c;
      }));
    } else {
      // Create new conversation
      const newConversation: Conversation = {
        id: conversationId,
        customerName: ticket.customerName,
        customerPhone: ticket.phone,
        customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.customerName)}&background=random`,
        unreadCount: 0,
        lastMessageTime: new Date(),
        messages: [newMessage],
        status: 'open'
      };
      setConversations([...conversations, newConversation]);
    }

    // Optional: Switch view to chat to show the new message?
    // setCurrentView('chat'); 
    // setActiveConversationId(conversationId);
    // User requested "enviar mediante Chat", usually implies just sending it, but staying in Tickets is better for workflow.
  };

  const handleSendTicketToChat = (ticket: Ticket) => {
    // Reuse logic or share function. For now, duplication with slight modification (view switch).
    let conversation = conversations.find(c => c.customerPhone === ticket.phone || c.customerName === ticket.customerName);
    let conversationId = conversation ? conversation.id : Date.now().toString();

    const newMessage: any = {
      id: Date.now().toString(),
      text: `🎫 Detalles del Ticket: ${ticket.ticketNumber}\n\nHola ${ticket.customerName}, le compartimos los detalles de su solicitud de tipo *${ticket.type.toUpperCase()}*.\n\nDescripción: ${ticket.description}\n\nEstado Actual: ${ticket.status.toUpperCase()}\n\nSeguimos atendiendo su caso.`,
      senderId: 'agent',
      timestamp: new Date(),
      type: MessageType.TEXT,
      status: 'sent'
    };

    if (conversation) {
      setConversations(conversations.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessageTime: new Date(),
            unreadCount: 0
          };
        }
        return c;
      }));
    } else {
      const newConversation: Conversation = {
        id: conversationId,
        customerName: ticket.customerName,
        customerPhone: ticket.phone || '555-0000', // Fallback if no phone
        customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.customerName)}&background=random`,
        unreadCount: 0,
        lastMessageTime: new Date(),
        messages: [newMessage],
        status: 'open'
      };
      setConversations([...conversations, newConversation]);
    }

    // Switch to Chat View and open conversation
    setCurrentView('chat');
    setActiveConversationId(conversationId);
  };

  const handleViewChat = (ticket: Ticket) => {
    // Just navigate to the chat, don't send message (assuming onTicketCreated already did)
    let conversation = conversations.find(c => c.customerPhone === ticket.phone || c.customerName === ticket.customerName);
    if (conversation) {
      setCurrentView('chat');
      setActiveConversationId(conversation.id);
    } else {
      // Should not happen if created via TicketsModule, but safe fallback
      setCurrentView('chat');
    }
  };



  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard stats={MOCK_STATS} />;
      case 'chat':
        return (
          <ChatInterface
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onSendMessage={handleSendMessage}
            onStartCall={handleStartCall}
            onEditMessage={handleEditMessage}
          />
        );
      case 'contact-groups':
        return (
          <GroupManager
            contacts={contacts}
            groups={groups}
            onUpdateGroups={handleUpdateGroups}
          />
        );
      case 'contacts':
        return (
          <ContactList
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onStartCall={handleStartCall}
          />
        );
      case 'team-chat':
        return <TeamChat agents={agents} currentAgentId="1" />;
      case 'tickets':
        return (
          <TicketsModule
            onTicketCreated={handleTicketCreated}
            onSendTicketToChat={handleSendTicketToChat}
            onViewChat={handleViewChat}
            contacts={contacts}
            onAddContact={handleAddContact}
          />
        );
      case 'agents':
        return (
          <AgentManager
            agents={agents}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
            onAddAgent={handleAddAgent}
          />
        );
      case 'visits':
        return (
          <VisitScheduler
            agents={agents}
          />
        );
      case 'campaigns':
        return <CampaignManager />;
      case 'settings':
        return <Settings />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'privacy':
        return <PrivacyPolicy onBack={() => {
          if (isAuthenticated) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('dashboard'); // Case handled by auth logic returning Login
          }
        }} />;
      default:
        return <Dashboard stats={MOCK_STATS} />;
    }
  };

  if (!isAuthenticated && currentView !== 'privacy') {
    return <Login onLogin={handleLogin} onViewPrivacy={handleViewPrivacy} />;
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-gray-900 transition-colors duration-200 font-sans`}>
      <CallOverlay
        isActive={callState.active}
        name={callState.name}
        avatar={callState.avatar}
        type={callState.type}
        onEndCall={() => setCallState(prev => ({ ...prev, active: false }))}
      />

      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        badges={badges}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-full overflow-hidden relative">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
