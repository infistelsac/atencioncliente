import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import {
  Activity, Search, AlertTriangle, CheckCircle, Clock, FileText, Wifi, User, MapPin,
  Settings, Phone, PauseCircle, XCircle, ArrowRightLeft, Info, Users, ShieldAlert,
  Save, Globe, Camera, Paperclip, X, RefreshCw, History, Mail, Map,
  MessageCircle, Send, PlusCircle, Calendar, Filter
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = (window as any).__firebase_config ? JSON.parse((window as any).__firebase_config) : null;

let app = null;
let auth = null;
let db = null;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'infistel-app';

// --- CONFIGURACIÓN DE NEGOCIO ---
const CENTRAL_EMAIL = 'internet@infistel.pe';

// --- TIPOS ---
type TicketStatus = 'pendiente' | 'en_proceso' | 'programacion' | 'resuelto' | 'cerrado';
type TicketType = 'averia' | 'lentitud' | 'facturacion' | 'traslado' | 'suspension' | 'migracion' | 'titularidad' | 'baja' | 'otro';

export interface Ticket {
  id: string;
  createdBy?: string;
  ticketNumber: string;
  customerName: string;
  dni: string;
  phone: string;
  email?: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  serviceId: string;
  type: TicketType;
  description: string;
  status: TicketStatus;
  createdAt: any;
  history: Array<{ status: TicketStatus; date: any; note?: string }>;
  priority?: 'alta' | 'media' | 'baja';
}

// --- CONSTANTES ---
const STATUS_STEPS = [
  { id: 'pendiente', label: '1. Registrado', icon: FileText, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-200 dark:border-gray-600' },
  { id: 'en_proceso', label: '2. En Atención', icon: Settings, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'programacion', label: '3. Programado', icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
  { id: 'resuelto', label: '4. Resuelto', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800' },
  { id: 'cerrado', label: '5. Cerrado', icon: XCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700', border: 'border-slate-200 dark:border-slate-600' }
];

const TICKET_TYPES = [
  { id: 'averia', label: 'Avería (Sin internet)', icon: AlertTriangle, category: 'Tecnico', slaDays: 1 },
  { id: 'lentitud', label: 'Lentitud / Intermitencia', icon: Wifi, category: 'Tecnico', slaDays: 3 },
  { id: 'facturacion', label: 'Reclamo de Facturación', icon: FileText, category: 'Comercial', slaDays: 15 },
  { id: 'traslado', label: 'Traslado de Servicio', icon: MapPin, category: 'Tramite', slaDays: 5 },
  { id: 'suspension', label: 'Suspensión Temporal', icon: PauseCircle, category: 'Tramite', slaDays: 5 },
  { id: 'migracion', label: 'Migración de Plan', icon: ArrowRightLeft, category: 'Tramite', slaDays: 3 },
  { id: 'titularidad', label: 'Cambio de Titularidad', icon: User, category: 'Tramite', slaDays: 10 },
  { id: 'baja', label: 'Baja del Servicio', icon: XCircle, category: 'Tramite', slaDays: 5 },
];

// --- MOCKS ---
// Datos de ejemplo para poblar la vista si no hay datos reales
export const ADMIN_MOCK_TICKETS: Ticket[] = [
  {
    id: 'mock-1',
    ticketNumber: 'TR-882910',
    customerName: 'Maria Rodriguez',
    dni: '10293847',
    phone: '999888777',
    email: 'maria.rod@email.com',
    address: 'Av. Arequipa 1234, Lince',
    serviceId: '102030',
    type: 'traslado',
    description: 'Solicito traslado por mudanza a San Isidro.',
    status: 'pendiente',
    createdAt: { seconds: Date.now() / 1000 - 86400 * 2 },
    history: [{ status: 'pendiente', date: new Date(Date.now() - 86400 * 2000).toISOString(), note: 'Solicitud ingresada por App' }],
    priority: 'media'
  },
  {
    id: 'mock-2',
    ticketNumber: 'AV-445566',
    customerName: 'Empresas SAC',
    dni: '20100100101',
    phone: '987654321',
    address: 'Jr. Unión 555, Lima',
    coordinates: { lat: -12.046374, lng: -77.042793 },
    serviceId: '405060',
    type: 'averia',
    description: 'Corte total del servicio de fibra óptica corporativa.',
    status: 'en_proceso',
    createdAt: { seconds: Date.now() / 1000 - 3600 * 4 },
    history: [
      { status: 'pendiente', date: new Date(Date.now() - 14400000).toISOString(), note: 'Reporte automático de nodo' },
      { status: 'en_proceso', date: new Date(Date.now() - 7200000).toISOString(), note: 'Técnico asignado: J. Pérez' }
    ],
    priority: 'alta'
  }
];

export default function TicketsModule({ onTicketCreated, onSendTicketToChat, onViewChat, contacts = [], onAddContact }: { onTicketCreated?: (ticket: Ticket) => void, onSendTicketToChat?: (ticket: Ticket) => void, onViewChat?: (ticket: Ticket) => void, contacts?: Contact[], onAddContact?: (contact: Contact) => void }) {
  // Estado General
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Filtro y Gestión
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'atencion' | 'criticos'>('todos');
  const [adminNote, setAdminNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<TicketStatus | ''>('');
  const [attachments, setAttachments] = useState<{ name: string, type: 'image' | 'file' }[]>([]);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<Ticket | null>(null);

  const handleContactSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    setSelectedContactId(contactId);
    if (contactId && contacts) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setFormData(prev => ({
          ...prev,
          customerName: contact.name,
          phone: contact.phone,
          email: contact.email,
          dni: contact.idDocument || '',
          serviceId: contact.clientCode || '',
          clientCode: contact.clientCode || '',
          address: contact.location || ''
        }));
      }
    }
  };

  // Formulario de Creación
  const [formData, setFormData] = useState({
    customerName: '', dni: '', phone: '', email: '', address: '', serviceId: '', clientCode: '',
    type: 'averia' as TicketType, description: ''
  });

  // --- 1. AUTENTICACIÓN ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if ((window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 2. CARGA DE DATOS (Misma colección pública que el cliente) ---
  useEffect(() => {
    // Si no hay configuración de Firebase/Auth, usamos los mocks
    if (!firebaseConfig?.apiKey || !db) {
      const combined = [...ADMIN_MOCK_TICKETS];
      combined.sort((a, b) => {
        const timeA = a.createdAt?.seconds ?? (a.createdAt === null ? Date.now() / 1000 : 0);
        const timeB = b.createdAt?.seconds ?? (b.createdAt === null ? Date.now() / 1000 : 0);
        return timeB - timeA;
      });
      setTickets(combined);
      setLoading(false);
      return;
    }

    if (!user) return;

    // Conectamos a la colección pública donde los clientes dejan sus tickets
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'tickets');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[];

      // Combinamos con Mocks para la demo
      const combined = [...realTickets, ...ADMIN_MOCK_TICKETS];
      combined.sort((a, b) => {
        const timeA = a.createdAt?.seconds ?? (a.createdAt === null ? Date.now() / 1000 : 0);
        const timeB = b.createdAt?.seconds ?? (b.createdAt === null ? Date.now() / 1000 : 0);
        return timeB - timeA;
      });

      setTickets(combined);
      setLoading(false);
    }, (error) => {
      // Fallback a mocks si hay error (ej: permisos)
      console.error("Error loaded tickets, checking permissions", error);
      setTickets(ADMIN_MOCK_TICKETS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sincronizar ticket seleccionado con actualizaciones
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated && updated !== selectedTicket) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets, selectedTicket?.id]);

  // Resetear formulario de gestión al cambiar de ticket
  useEffect(() => {
    if (selectedTicket) {
      setTargetStatus(selectedTicket.status);
      setAdminNote('');
      setAttachments([]);
    }
  }, [selectedTicket]);

  // --- HELPERS ---
  const getSlaStatus = (ticket: Ticket) => {
    const typeInfo = TICKET_TYPES.find(t => t.id === ticket.type);
    if (!typeInfo || !ticket.createdAt) return { label: 'En plazo', color: 'text-green-600', bg: 'bg-green-100', daysLeft: 99 };

    const seconds = ticket.createdAt?.seconds || Date.now() / 1000;
    const created = new Date(seconds * 1000);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = typeInfo.slaDays - diffDays;

    if (ticket.status === 'resuelto' || ticket.status === 'cerrado') return { label: 'Completado', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', daysLeft: 0 };
    if (daysLeft < 0) return { label: `Vencido (${Math.abs(daysLeft)}d)`, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', daysLeft };
    if (daysLeft <= 1) return { label: 'Vence Pronto', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', daysLeft };
    return { label: `${daysLeft} días`, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700', daysLeft };
  };

  const getStatusColor = (status: string) => STATUS_STEPS.find(s => s.id === status)?.color || 'text-gray-600';

  // --- ACCIONES ---
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !targetStatus) return;

    let noteContent = adminNote || `Actualización a ${targetStatus}`;
    if (attachments.length > 0) {
      noteContent += '\n\nAdjuntos:\n' + attachments.map(a => `- [${a.type === 'image' ? '📷' : '📎'}] ${a.name}`).join('\n');
    }

    const updatedHistory = [...selectedTicket.history, { status: targetStatus as TicketStatus, date: new Date().toISOString(), note: noteContent }];
    const updatedTicket = { ...selectedTicket, status: targetStatus as TicketStatus, history: updatedHistory };

    // Optimistic UI Update
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);

    // Firebase Update
    if (!selectedTicket.id.startsWith('mock-') && db) {
      try {
        const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'tickets', selectedTicket.id);
        await updateDoc(ticketRef, { status: targetStatus as TicketStatus, history: updatedHistory });
      } catch (err) { console.error("Error updating:", err); }
    }
    setAdminNote('');
    setAttachments([]);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si no auth, usar mock para demo visual
    const uid = user ? user.uid : 'anon-user';

    const codePrefix = formData.type === 'averia' || formData.type === 'lentitud' ? 'AV' : 'TR';
    const ticketNum = `${codePrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: any = {
      ...formData,
      ticketNumber: ticketNum,
      createdBy: uid,
      status: 'pendiente',
      createdAt: serverTimestamp(),
      history: [{ status: 'pendiente', date: new Date().toISOString(), note: 'Generado desde Antigravity (Mesa de Ayuda)' }]
    };

    // Auto-add contact if new and handler provided
    if (customerMode === 'new' && onAddContact) {
      const newContact: Contact = {
        id: Date.now().toString(),
        name: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        location: formData.address,
        tags: ['Nuevo', 'Ticket'],
        source: 'manual',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.customerName)}&background=random`,
        idDocument: formData.dni,
        clientCode: formData.serviceId
      };
      onAddContact(newContact);
    }

    // Optimistic UI for Create
    if (!user || !firebaseConfig?.apiKey || !db) {
      const mockT: Ticket = { ...newTicket, id: `mock-new-${Date.now()}`, createdAt: { seconds: Date.now() / 1000 } };
      setTickets([mockT, ...tickets]);
      setFormData({ customerName: '', dni: '', phone: '', email: '', address: '', serviceId: '', clientCode: '', type: 'averia', description: '' });
      setShowCreateModal(false);
      setShowShareModal(mockT);
      if (onTicketCreated) onTicketCreated(mockT);
      return;
    }

    try {
      if (db) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets'), newTicket);
      }
      setFormData({ customerName: '', dni: '', phone: '', email: '', address: '', serviceId: '', clientCode: '', type: 'averia', description: '' });
      setShowCreateModal(false);
      setShowShareModal(newTicket as Ticket); // Mostrar opciones de compartir inmediatamente
      if (onTicketCreated) onTicketCreated(newTicket as Ticket);
    } catch (error) { console.error("Error creating:", error); }
  };

  const handleAddAttachment = (type: 'image' | 'file') => {
    setAttachments([...attachments, { name: type === 'image' ? `Foto_${Date.now()}.jpg` : `Doc_${Date.now()}.pdf`, type }]);
  };

  // --- GENERADORES DE ENLACES ---
  const generateWhatsAppLink = (ticket: Ticket) => {
    const cleanPhone = ticket.phone.replace(/\D/g, '');
    const prefix = cleanPhone.length === 9 ? '51' : '';
    const message = `Hola ${ticket.customerName}, su ticket *${ticket.ticketNumber}* ha sido registrado exitosamente.\n\nTipo: ${TICKET_TYPES.find(t => t.id === ticket.type)?.label}\nEstado: Registrado\n\nPuede realizar el seguimiento en nuestro portal.`;
    return `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const generateEmailLink = (ticket: Ticket) => {
    if (!ticket.email) return '#';
    const subject = `Registro de Ticket ${ticket.ticketNumber} - INFISTEL`;
    const body = `Estimado(a) ${ticket.customerName},\n\nLe confirmamos el registro de su solicitud.\n\nN° Ticket: ${ticket.ticketNumber}\nTipo: ${TICKET_TYPES.find(t => t.id === ticket.type)?.label}\nEstado: Registrado\n\nAtentamente,\nEquipo INFISTEL`;
    return `mailto:${ticket.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const generateCentralReportLink = (ticket: Ticket) => {
    const subject = `[NUEVO TICKET] ${ticket.ticketNumber} - ${TICKET_TYPES.find(t => t.id === ticket.type)?.label}`;
    const body = `REPORTE DE INCIDENCIA - ANTIGRAVITY\n\n` +
      `ID TICKET: ${ticket.ticketNumber}\n` +
      `FECHA: ${new Date().toLocaleString()}\n` +
      `----------------------------------------\n` +
      `CLIENTE: ${ticket.customerName}\n` +
      `DNI/RUC: ${ticket.dni}\n` +
      `TELÉFONO: ${ticket.phone}\n` +
      `EMAIL: ${ticket.email || 'No registrado'}\n` +
      `CÓDIGO SERVICIO: ${ticket.serviceId}\n` +
      `DIRECCIÓN: ${ticket.address}\n` +
      `COORDENADAS: ${ticket.coordinates ? `${ticket.coordinates.lat}, ${ticket.coordinates.lng}` : 'No registradas'}\n` +
      `----------------------------------------\n` +
      `DETALLE:\n${ticket.description}\n\n` +
      `Estado: ${ticket.status.toUpperCase()}`;
    return `mailto:${CENTRAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'todos') return true;
    if (filter === 'pendiente') return t.status === 'pendiente';
    if (filter === 'atencion') return t.status === 'en_proceso' || t.status === 'programacion';
    if (filter === 'criticos') return getSlaStatus(t).daysLeft <= 1 && t.status !== 'resuelto' && t.status !== 'cerrado';
    return true;
  });

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-slate-900"><RefreshCw className="h-10 w-10 animate-spin text-cyan-500" /></div>;

  return (
    <div className="h-full bg-slate-100 dark:bg-gray-900 font-sans flex flex-col overflow-hidden transition-colors duration-200">

      {/* HEADER TIPO DASHBOARD */}
      <header className="bg-slate-900 dark:bg-gray-950 border-b border-slate-700 dark:border-gray-800 z-30 shrink-0">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border border-white/10">
              <Globe className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">INFISTEL</h1>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Atención al Cliente</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-400 items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> Sistema Online
            </div>
            <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-indigo-500/50">
              AG
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col max-w-[1920px] mx-auto w-full">

        {/* KPI BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Por Atender</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{tickets.filter(t => t.status === 'pendiente').length}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 p-2.5 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform"><Clock size={22} /></div>
            <div className="absolute right-0 bottom-0 opacity-5 text-orange-500 transform translate-x-2 translate-y-2"><Clock size={64} /></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">En Gestión</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{tickets.filter(t => t.status === 'en_proceso' || t.status === 'programacion').length}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"><Settings size={22} /></div>
            <div className="absolute right-0 bottom-0 opacity-5 text-blue-500 transform translate-x-2 translate-y-2"><Settings size={64} /></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">SLA Riesgo</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{tickets.filter(t => getSlaStatus(t).daysLeft <= 1 && t.status !== 'resuelto' && t.status !== 'cerrado').length}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-2.5 rounded-lg text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform"><AlertTriangle size={22} /></div>
            <div className="absolute right-0 bottom-0 opacity-5 text-red-500 transform translate-x-2 translate-y-2"><AlertTriangle size={64} /></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Casos</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{tickets.length}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-lg text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform"><Users size={22} /></div>
            <div className="absolute right-0 bottom-0 opacity-5 text-slate-500 transform translate-x-2 translate-y-2"><Users size={64} /></div>
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex gap-6 overflow-hidden">

          {/* COL 1: LIST & FILTER */}
          <div className="w-1/3 min-w-[320px] max-w-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
            {/* Actions Header */}
            <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex flex-col gap-3 bg-slate-50/50 dark:bg-gray-900/50">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Filter size={16} className="text-indigo-600 dark:text-indigo-400" /> Bandeja de Entrada
                </h3>
                <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors shadow-sm" title="Crear Nuevo Ticket">
                  <PlusCircle size={18} />
                </button>
              </div>
              <div className="flex p-1 bg-slate-200/50 dark:bg-gray-700/50 rounded-lg">
                {['todos', 'pendiente', 'atencion', 'criticos'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${filter === f ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {filteredTickets.map(ticket => {
                const sla = getSlaStatus(ticket);
                const TicketTypeInfo = TICKET_TYPES.find(t => t.id === ticket.type);
                const TicketIcon = TicketTypeInfo?.icon || FileText;
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`
                            p-4 border-b border-slate-100 dark:border-gray-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-gray-700 relative group
                            ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600 dark:border-l-indigo-500' : 'border-l-4 border-l-transparent'}
                        `}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 px-1.5 py-0.5 rounded group-hover:border-indigo-200 transition-colors">{ticket.ticketNumber}</span>
                        {ticket.priority === 'alta' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-sm shadow-red-200" title="Prioridad Alta"></span>}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sla.bg} ${sla.color} border-transparent`}>{sla.label}</span>
                    </div>

                    <h4 className={`text-sm font-bold mb-1 line-clamp-1 ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-gray-200'}`}>{ticket.customerName}</h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 mb-2">
                      <TicketIcon size={12} className={isSelected ? 'text-indigo-500 dark:text-indigo-300' : 'text-slate-400 dark:text-gray-500'} />
                      <span className="uppercase font-medium text-[10px] tracking-wide">{TicketTypeInfo?.label}</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <p className="text-[10px] text-slate-400 dark:text-gray-500">
                        {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Hoy'}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${STATUS_STEPS.find(s => s.id === ticket.status)?.bg} ${STATUS_STEPS.find(s => s.id === ticket.status)?.color} border-transparent`}>
                        {STATUS_STEPS.find(s => s.id === ticket.status)?.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COL 2 & 3: WORKSPACE */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden relative">
            {selectedTicket ? (
              <>
                {/* Ticket Toolbar */}
                <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedTicket.ticketNumber}</h2>
                    <div className="h-6 w-px bg-slate-200 dark:bg-gray-700"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">Estado Actual</span>
                      <span className={`text-xs font-bold uppercase ${STATUS_STEPS.find(s => s.id === selectedTicket.status)?.color}`}>{STATUS_STEPS.find(s => s.id === selectedTicket.status)?.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={generateCentralReportLink(selectedTicket)} className="p-2 text-slate-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-slate-200 dark:border-gray-700" title="Reportar a Central"><Send size={18} /></a>
                    <div className="w-px bg-slate-200 dark:bg-gray-700 mx-1"></div>
                    <a href={generateWhatsAppLink(selectedTicket)} target="_blank" rel="noreferrer" className="p-2 text-slate-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-slate-200 dark:border-gray-700" title="WhatsApp Cliente"><MessageCircle size={18} /></a>
                    <a href={generateEmailLink(selectedTicket)} className="p-2 text-slate-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-slate-200 dark:border-gray-700" title="Email Cliente"><Mail size={18} /></a>
                    <div className="w-px bg-slate-200 dark:bg-gray-700 mx-1"></div>
                    <button
                      onClick={() => onSendTicketToChat && selectedTicket && onSendTicketToChat(selectedTicket)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200 dark:border-indigo-800"
                      title="Enviar detalles al chat del cliente"
                    >
                      <MessageCircle size={16} />
                      <span className="hidden xl:inline">Enviar al Chat</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                  {/* INFO SCROLLABLE */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-gray-700">
                    {/* Datos Cliente */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1 p-4 bg-slate-50/50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase mb-3 flex items-center gap-2"><User size={14} /> Cliente</h4>
                        <div className="space-y-2">
                          <div><p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase">Nombre</p><p className="font-bold text-slate-800 dark:text-white text-sm">{selectedTicket.customerName}</p></div>
                          <div><p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase">DNI / RUC</p><p className="font-medium text-slate-700 dark:text-gray-300 text-sm">{selectedTicket.dni}</p></div>
                          <div><p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase">Contacto</p><p className="font-medium text-slate-700 dark:text-gray-300 text-sm">{selectedTicket.phone}</p></div>
                          {selectedTicket.email && <div><p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase">Email</p><p className="font-medium text-slate-700 dark:text-gray-300 text-sm">{selectedTicket.email}</p></div>}
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-1 p-4 bg-slate-50/50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase mb-3 flex items-center gap-2"><MapPin size={14} /> Servicio</h4>
                        <div className="space-y-2">
                          <div><p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase">Código</p><p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{selectedTicket.serviceId}</p></div>
                          <div><p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase">Dirección</p><p className="font-medium text-slate-700 dark:text-gray-300 text-sm leading-snug">{selectedTicket.address}</p></div>
                          {selectedTicket.coordinates && (
                            <div className="pt-2">
                              <a href={`https://www.google.com/maps?q=${selectedTicket.coordinates.lat},${selectedTicket.coordinates.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:border-blue-300 transition-colors">
                                <Map size={12} /> Ver Geolocalización
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase mb-2 flex items-center gap-2"><Info size={14} /> Detalle del Caso</h4>
                      <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-xl text-sm text-slate-800 dark:text-gray-200 leading-relaxed shadow-sm">
                        {selectedTicket.description}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="pb-6">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase mb-4 flex items-center gap-2"><History size={14} /> Historial</h4>
                      <div className="relative pl-4 border-l-2 border-slate-100 dark:border-gray-700 space-y-6">
                        {selectedTicket.history?.map((event, idx) => (
                          <div key={idx} className="relative">
                            <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${idx === selectedTicket.history.length - 1 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-gray-600'}`}></div>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${STATUS_STEPS.find(s => s.id === event.status)?.bg} ${STATUS_STEPS.find(s => s.id === event.status)?.color} border-transparent`}>
                                {STATUS_STEPS.find(s => s.id === event.status)?.label}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">{new Date(event.date).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-slate-100 dark:border-gray-700 shadow-sm">{event.note || 'Sin notas adicionales.'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ACTION SIDEBAR */}
                  <div className="w-full lg:w-[320px] bg-slate-50 dark:bg-gray-800/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-gray-700 flex flex-col p-4">
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1"><Settings size={16} className="text-indigo-600 dark:text-indigo-400" /> Gestión</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-500">Actualizar estado y notificar.</p>
                    </div>

                    <form onSubmit={handleUpdateStatus} className="flex-1 flex flex-col gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">Cambiar Estado a:</label>
                        <div className="grid grid-cols-1 gap-2">
                          {STATUS_STEPS.map(step => (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => setTargetStatus(step.id as TicketStatus)}
                              className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold border transition-all text-left
                                                ${targetStatus === step.id
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                  : 'bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 hover:border-slate-300'}
                                            `}
                            >
                              <step.icon size={14} className={targetStatus === step.id ? 'text-white' : step.color.replace('text-', 'text-')} />
                              {step.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">Nota de Atención</label>
                        <textarea
                          required
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Escriba los detalles de la gestión..."
                          className="w-full h-full min-h-[120px] p-3 text-sm rounded-lg border border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleAddAttachment('image')} className="flex-1 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 flex justify-center gap-1"><Camera size={14} /> Foto</button>
                        <button type="button" onClick={() => handleAddAttachment('file')} className="flex-1 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 flex justify-center gap-1"><Paperclip size={14} /> Archivo</button>
                      </div>
                      {attachments.length > 0 && <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{attachments.length} adjunto(s) listo(s).</div>}

                      <button
                        type="submit"
                        disabled={!targetStatus || targetStatus === selectedTicket.status}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 mt-auto"
                      >
                        <Save size={18} /> Guardar Cambios
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 bg-slate-50/50 dark:bg-gray-900/50 p-8 text-center">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-full shadow-sm mb-4"><Activity size={48} className="text-indigo-200 dark:text-indigo-400/30" /></div>
                <h3 className="text-lg font-bold text-slate-600 dark:text-gray-300">Bienvenido a Antigravity</h3>
                <p className="text-sm max-w-xs">Seleccione un caso de la lista para ver detalles y gestionar la atención.</p>
              </div>
            )}
          </div>
        </div>

        {/* CREATE MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-gray-700">
              <div className="bg-slate-900 dark:bg-gray-950 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2"><PlusCircle size={20} /> Registrar Nuevo Caso</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateTicket} className="p-6 overflow-y-auto max-h-[80vh]">
                <div className="space-y-5">
                  {/* Section: Cliente */}
                  <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-lg border border-slate-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1"><User size={12} /> Cliente</label>
                      <div className="flex bg-slate-200 dark:bg-gray-700 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setCustomerMode('existing')}
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${customerMode === 'existing' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                        >
                          Buscar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCustomerMode('new'); setSelectedContactId(''); }}
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${customerMode === 'new' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                        >
                          Nuevo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {customerMode === 'existing' && (
                        <div className="col-span-2">
                          <select
                            className="w-full border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                            value={selectedContactId}
                            onChange={handleContactSelect}
                          >
                            <option value="">-- Seleccionar Contacto --</option>
                            {contacts && contacts.map(c => (
                              <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* input for customer name */}
                      <input required className="col-span-2 border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Nombre Completo" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} disabled={customerMode === 'existing'} />

                      {/* New: Client Code & DNI */}
                      <input className="border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Cód. Cliente" value={formData.clientCode || ''} onChange={e => setFormData({ ...formData, clientCode: e.target.value })} disabled={customerMode === 'existing'} />
                      <input required className="border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="DNI / RUC" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} disabled={customerMode === 'existing'} />

                      <input required className="border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={customerMode === 'existing'} />
                      <input className="col-span-2 border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Email (Opcional)" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={customerMode === 'existing'} />
                    </div>
                  </div>

                  {/* Section: Servicio */}
                  <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-lg border border-slate-200 dark:border-gray-700">
                    <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase block mb-3 flex items-center gap-1"><MapPin size={12} /> Servicio</label>
                    <div className="grid grid-cols-3 gap-3">
                      <input className="col-span-1 border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Cód. Servicio" value={formData.serviceId} onChange={e => setFormData({ ...formData, serviceId: e.target.value })} />
                      <input required className="col-span-2 border dark:border-gray-600 p-2 rounded text-sm outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Dirección Exacta" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>

                  {/* Section: Detalle */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase block mb-1">Tipo & Descripción</label>
                    <select className="border dark:border-gray-600 p-2.5 rounded text-sm w-full mb-2 outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as TicketType })}>
                      {TICKET_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <textarea required className="border dark:border-gray-600 p-3 rounded text-sm w-full h-24 outline-none focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" placeholder="Describa el problema o solicitud detalladamente..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg font-medium text-sm">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold text-sm shadow-md">Registrar Ticket</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SHARE SUCCESS MODAL */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm text-center p-6 animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400 shadow-sm">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Ticket Registrado</h3>
              <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm">Código generado: <strong className="text-slate-900 dark:text-gray-200 bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded border border-slate-200 dark:border-gray-600">{showShareModal.ticketNumber}</strong></p>

              <div className="space-y-3">
                {/* Reporte Central */}
                <a
                  href={generateCentralReportLink(showShareModal)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-[0.98]"
                >
                  <Send size={18} /> Reportar a Central
                </a>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-gray-700"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-2 text-slate-400 dark:text-gray-500 font-bold">Notificar Cliente</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onViewChat && onViewChat(showShareModal)}
                    className="flex flex-col items-center justify-center gap-1 py-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold transition-all"
                  >
                    <MessageCircle size={20} /> <span className="text-xs">Chats Clientes</span>
                  </button>
                  <a href={generateEmailLink(showShareModal)} className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl font-bold transition-all">
                    <Mail size={20} /> <span className="text-xs">Email</span>
                  </a>
                </div>
              </div>

              <button onClick={() => setShowShareModal(null)} className="mt-6 text-xs font-bold text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 uppercase tracking-wider">Cerrar Ventana</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
