import React from 'react';
import { View } from '../types';
import { LayoutDashboard, MessageSquare, Users, Settings, LogOut, Moon, Sun, BookUser, Hash, Megaphone, Truck, Ticket, Globe, Activity, Shield } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  badges?: Record<string, number>;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isDarkMode, toggleDarkMode, badges, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chats Clientes', icon: MessageSquare },
    { id: 'visits', label: 'Mantenimiento', icon: Truck },
    { id: 'campaigns', label: 'Marketing', icon: Megaphone },
    { id: 'team-chat', label: 'Sala Agentes/Técnicos', icon: Hash },
    { id: 'tickets', label: 'Módulo de Tickets', icon: Ticket },
    { id: 'contacts', label: 'Contactos', icon: BookUser },
    { id: 'contact-groups', label: 'Grupos de Contactos', icon: Users },
    { id: 'agents', label: 'Agentes/Técnicos', icon: Users },
    { id: 'monitoring', label: 'Monitor de Red ISP', icon: Activity },
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'privacy', label: 'Políticas de Privacidad', icon: Shield },
  ];

  return (
    <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-full transition-all duration-300 shadow-xl z-20">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-700">
        <div className="w-8 h-8 flex items-center justify-center text-blue-400 shrink-0">
          <Globe size={28} />
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="font-bold text-lg leading-none tracking-tight">INFISTEL</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider">Atención al Cliente</span>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const badgeCount = badges ? badges[item.id] : 0;

          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as View)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors relative group ${isActive
                ? 'bg-green-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <div className="relative">
                <Icon size={20} />
                {badgeCount > 0 && (
                  <span className="lg:hidden absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-slate-900">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block font-medium">{item.label}</span>
              {badgeCount > 0 && (
                <span className="hidden lg:flex ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="hidden lg:block font-medium">
            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="hidden lg:block font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;