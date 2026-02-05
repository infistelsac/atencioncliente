import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, MessageSquare, MoreHorizontal, MapPin, Tag, X, User, Briefcase, Globe, Video, CreditCard, Hash, RefreshCw, Trash2, Edit, Map as MapIcon } from 'lucide-react';
import { Contact } from '../types';

interface ContactListProps {
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onStartCall?: (name: string, avatar: string, type: 'audio' | 'video') => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onAddContact, onUpdateContact, onDeleteContact, onStartCall }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // UI State for dropdowns
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const [newTags, setNewTags] = useState('');

  // New Fields
  const [newIdDocument, setNewIdDocument] = useState('');
  const [newClientCode, setNewClientCode] = useState('');

  // Map Modal State
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.clientCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setEditingId(null);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewCompany('');
    setNewLocation('');
    setNewCoordinates(undefined);
    setNewTags('');
    setNewIdDocument('');
    setNewClientCode('');
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation(); // Prevent closing menu immediately
    setEditingId(contact.id);
    setNewName(contact.name);
    setNewPhone(contact.phone);
    setNewEmail(contact.email);
    setNewCompany(contact.company || '');
    setNewLocation(contact.location);
    setNewCoordinates(contact.coordinates);
    setNewTags(contact.tags.join(', '));
    setNewIdDocument(contact.idDocument || '');
    setNewClientCode(contact.clientCode || '');
    setShowModal(true);
    setActiveMenuId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar este contacto?')) {
      onDeleteContact(id);
    }
    setActiveMenuId(null);
  };

  const handleSyncGoogle = () => {
    setIsSyncing(true);
    // Simulate API call
    setTimeout(() => {
      const googleContacts: Contact[] = [
        {
          id: `g-${Date.now()}`,
          name: 'Google User Demo',
          phone: '+1 555 000 9999',
          email: 'demo.user@gmail.com',
          avatar: 'https://lh3.googleusercontent.com/a/default-user',
          company: 'Alphabet Inc.',
          location: 'Mountain View, CA',
          tags: ['Importado', 'Google'],
          source: 'google'
        },
        {
          id: `g-${Date.now() + 1}`,
          name: 'Soporte Google',
          phone: '+1 800 555 1212',
          email: 'support@google.com',
          avatar: 'https://lh3.googleusercontent.com/a/default-user',
          company: 'Google Services',
          location: 'Palo Alto, CA',
          tags: ['Importado'],
          source: 'google'
        }
      ];
      googleContacts.forEach(onAddContact);
      setIsSyncing(false);
      alert('¡Sincronización completada! Se han añadido 2 contactos de Google.');
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const contactData: Contact = {
      id: editingId || Date.now().toString(),
      name: newName,
      phone: newPhone,
      email: newEmail,
      company: newCompany || 'Particular',
      location: newLocation || 'Desconocido',
      coordinates: newCoordinates,
      tags: newTags ? newTags.split(',').map(tag => tag.trim()) : ['Nuevo'],
      avatar: editingId
        ? contacts.find(c => c.id === editingId)?.avatar || `https://ui-avatars.com/api/?name=${newName.replace(' ', '+')}&background=random`
        : `https://ui-avatars.com/api/?name=${newName.replace(' ', '+')}&background=random`,
      idDocument: newIdDocument,
      clientCode: newClientCode,
      source: 'manual'
    };

    if (editingId) {
      onUpdateContact(contactData);
    } else {
      onAddContact(contactData);
    }

    setShowModal(false);
    resetForm();
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Mock converting pixels to Lat/Lng for demo purposes
    // Center (approx Mexico City): 19.4326, -99.1332
    const lat = 19.4326 + (0.5 - y / rect.height) * 0.1;
    const lng = -99.1332 + (x / rect.width - 0.5) * 0.1;

    setNewCoordinates({ lat, lng });
    setNewLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)} (Seleccionado en mapa)`);
  };

  const openGoogleMaps = (coords: { lat: number, lng: number }) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank');
  };

  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contactos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Directorio de clientes y empresas.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin text-blue-500" : "text-blue-500"} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button
            onClick={handleOpenModal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} />
            Nuevo Contacto
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, email o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group relative">

            {/* Header / Avatar */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={contact.avatar} alt={contact.name} className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-gray-600" />
                  {contact.source === 'google' && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-0.5 rounded-full">
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{contact.name}</h3>
                  {contact.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{contact.company}</p>
                  )}
                </div>
              </div>

              {/* Context Menu Trigger */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contact.id ? null : contact.id); }}
                  className={`p-1 rounded-full transition-colors ${activeMenuId === contact.id ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <MoreHorizontal size={20} />
                </button>

                {/* Dropdown Menu */}
                {activeMenuId === contact.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={(e) => handleEditClick(e, contact)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Edit size={16} /> Editar
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, contact.id)}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-3 mb-6">
              {/* ID and Code Section */}
              {(contact.clientCode || contact.idDocument) && (
                <div className="flex gap-4 mb-2 pb-2 border-b border-gray-50 dark:border-gray-700/50">
                  {contact.clientCode && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                      <Hash size={12} />
                      {contact.clientCode}
                    </div>
                  )}
                  {contact.idDocument && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      <CreditCard size={12} />
                      {contact.idDocument}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Phone size={16} className="text-gray-400" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail size={16} className="text-gray-400" />
                <span className="truncate">{contact.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <MapPin size={16} className="text-gray-400" />
                <span className="truncate">{contact.location}</span>
                {contact.coordinates && (
                  <button
                    onClick={() => openGoogleMaps(contact.coordinates!)}
                    className="text-blue-500 hover:text-blue-600 ml-auto"
                    title="Ver en Google Maps"
                  >
                    <Globe size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {contact.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <MessageSquare size={16} />
                Chat
              </button>
              {onStartCall && (
                <>
                  <button
                    onClick={() => onStartCall(contact.name, contact.avatar, 'audio')}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title="Llamar"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => onStartCall(contact.name, contact.avatar, 'video')}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title="Videollamada"
                  >
                    <Video size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No se encontraron contactos</h3>
          <p className="text-gray-500 dark:text-gray-400">Intenta con otros términos de búsqueda.</p>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Contacto' : 'Añadir Nuevo Contacto'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Column 1: Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Información Personal</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="+52 55 1234 5678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUC / DNI / Cédula</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={newIdDocument}
                        onChange={(e) => setNewIdDocument(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="Ej. 12345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Business Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Información Comercial</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="Ej. Empresa S.A."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de Cliente</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={newClientCode}
                        onChange={(e) => setNewClientCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="Ej. C-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación / Dirección</label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                          placeholder="Ciudad, País"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                        title="Seleccionar en Mapa"
                      >
                        <MapPin size={20} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiquetas</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                        placeholder="Ventas, VIP, Pendiente"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MapIcon className="text-blue-600" size={24} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Seleccionar Ubicación</h2>
              </div>
              <button
                onClick={() => setShowMapPicker(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Map Simulation Container */}
            <div className="flex-1 relative bg-blue-50 cursor-crosshair overflow-hidden group" onClick={handleMapClick}>
              {/* Static Map Image Background */}
              <div className="absolute inset-0 opacity-80" style={{
                backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Map_of_Mexico_City_delegaciones.svg/1200px-Map_of_Mexico_City_delegaciones.svg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <span className="text-4xl font-bold text-gray-600 uppercase -rotate-12 select-none">Simulación de Mapa</span>
              </div>

              {/* Pin */}
              {newCoordinates && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                  style={{
                    // This is an approximation since we don't have real map projection in this static image
                    // In a real app, the marker is handled by the map library.
                    left: '50%', // Centered for demo visual, in reality coordinates drive position
                    top: '50%'
                  }}
                >
                  <MapPin size={48} className="text-red-600 drop-shadow-lg fill-red-600" />
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {newCoordinates
                    ? `Coordenadas: ${newCoordinates.lat.toFixed(6)}, ${newCoordinates.lng.toFixed(6)}`
                    : "Haz clic en el mapa para colocar un marcador"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Al confirmar, se guardará la dirección aproximada.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800 rounded-b-2xl">
              <button
                onClick={() => setShowMapPicker(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowMapPicker(false)}
                disabled={!newCoordinates}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Ubicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;