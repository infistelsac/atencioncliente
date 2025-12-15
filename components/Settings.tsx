import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Lock, HelpCircle, LogOut, RefreshCw, CheckCircle, QrCode, Monitor, MessageCircle, Mail, Instagram, Facebook, Cloud, Users } from 'lucide-react';

const Settings: React.FC = () => {
  const [qrState, setQrState] = useState<'loading' | 'ready' | 'linked'>('loading');
  
  useEffect(() => {
    // Simulate loading QR code
    const timer = setTimeout(() => {
      setQrState('ready');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSimulateScan = () => {
      setQrState('loading');
      setTimeout(() => setQrState('linked'), 1000);
  };

  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuración</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Administra tu cuenta y vincula tus dispositivos.</p>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Column: Accounts & General Settings */}
        <div className="flex-1 space-y-6">
            
            {/* NEW: Accounts Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-purple-600 dark:text-purple-400" />
                    Cuentas Vinculadas
                </h3>
                
                <div className="space-y-3">
                    {/* WhatsApp Business (Connected) */}
                    <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">WhatsApp Business API</p>
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Conectado (+52 55...)
                                </p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            Gestionar
                        </button>
                    </div>

                    {/* Google (Connected) */}
                    <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">Google Contacts</p>
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Sincronizado
                                </p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            Configurar
                        </button>
                    </div>

                    {/* Instagram (Disconnected) */}
                    <div className="flex items-center justify-between p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3 opacity-75">
                            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center">
                                <Instagram size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">Instagram Direct</p>
                                <p className="text-xs text-gray-400">No conectado</p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Conectar
                        </button>
                    </div>

                     {/* Facebook (Disconnected) */}
                     <div className="flex items-center justify-between p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3 opacity-75">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                                <Facebook size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">Facebook Messenger</p>
                                <p className="text-xs text-gray-400">No conectado</p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Conectar
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Monitor size={20} className="text-blue-500" />
                    Preferencias Generales
                </h3>
                <div className="space-y-1">
                    <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                                <Bell size={18} />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Notificaciones</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">Sonidos, alertas de escritorio</span>
                            </div>
                        </div>
                        <div className="w-9 h-5 bg-green-500 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </button>

                    <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                                <Lock size={18} />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Privacidad y Seguridad</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">Bloqueo de pantalla, mensajes temporales</span>
                            </div>
                        </div>
                        <span className="text-gray-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </span>
                    </button>

                    <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                                <HelpCircle size={18} />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Ayuda</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">Centro de ayuda, contáctanos</span>
                            </div>
                        </div>
                         <span className="text-gray-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </span>
                    </button>
                </div>
            </div>
            
             <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-100 dark:border-red-900/30">
                <h3 className="text-red-800 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                    <LogOut size={20} />
                    Zona de Peligro
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                    Estas acciones no se pueden deshacer.
                </p>
                <button className="px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors">
                    Eliminar cuenta empresarial
                </button>
             </div>
        </div>

        {/* Right Column: Device Linking */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
            
            <div className="mb-6">
                <h2 className="text-2xl font-light text-gray-800 dark:text-white mb-2">Vincular Dispositivo</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                    Usa WhatsApp en tu teléfono para escanear el código QR y conectar tu cuenta empresarial.
                </p>
            </div>

            {qrState === 'linked' ? (
                <div className="w-64 h-64 bg-green-50 dark:bg-green-900/20 rounded-2xl flex flex-col items-center justify-center border-2 border-green-500 dark:border-green-400 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-green-500/30">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Dispositivo Vinculado!</h3>
                    <p className="text-green-600 dark:text-green-400 font-medium text-sm mt-1">Sincronizando chats...</p>
                    <button 
                        onClick={() => setQrState('ready')}
                        className="mt-6 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                    >
                        Desvincular
                    </button>
                </div>
            ) : (
                <div className="relative group cursor-pointer" onClick={handleSimulateScan}>
                    <div className={`w-64 h-64 bg-white dark:bg-white p-4 rounded-xl shadow-inner border border-gray-200 flex items-center justify-center relative overflow-hidden transition-all ${qrState === 'loading' ? 'opacity-50' : 'opacity-100'}`}>
                        {qrState === 'loading' ? (
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="animate-spin text-green-600" size={32} />
                                <span className="text-xs font-semibold text-gray-500">Generando QR...</span>
                            </div>
                        ) : (
                             // Generic QR Code SVG
                            <img 
                                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SoportePro-Auth-Token-12345" 
                                alt="Scan QR Code" 
                                className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        )}
                        
                        {/* Logo overlay */}
                         {qrState === 'ready' && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 bg-white rounded-full p-1 shadow-sm">
                                    <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                                        <Smartphone size={20} className="text-white" />
                                    </div>
                                </div>
                             </div>
                         )}
                    </div>
                     {qrState === 'ready' && (
                         <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-400 dark:text-gray-500 animate-pulse">
                             Haz click en el QR para simular escaneo
                         </div>
                     )}
                </div>
            )}

            <div className="mt-8 w-full max-w-sm text-left">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Instrucciones:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>Abre <strong className="text-gray-800 dark:text-gray-200">WhatsApp</strong> en tu teléfono.</li>
                    <li>Toca <strong className="text-gray-800 dark:text-gray-200">Menú</strong> (Android) o <strong className="text-gray-800 dark:text-gray-200">Configuración</strong> (iOS).</li>
                    <li>Selecciona <strong className="text-gray-800 dark:text-gray-200">Dispositivos vinculados</strong>.</li>
                    <li>Toca en <strong className="text-gray-800 dark:text-gray-200">Vincular un dispositivo</strong>.</li>
                    <li>Apunta tu teléfono hacia esta pantalla para escanear el código.</li>
                </ol>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;