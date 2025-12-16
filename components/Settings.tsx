import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Lock, HelpCircle, LogOut, RefreshCw, CheckCircle, QrCode, Monitor, MessageCircle, Mail, Instagram, Facebook, Cloud, Users, Sparkles, Bot, Key } from 'lucide-react';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'ai'>('whatsapp');

    // WhatsApp API State
    const [webhookUrl, setWebhookUrl] = useState('https://tu-dominio.com/api/webhook/whatsapp');
    const [verifyToken, setVerifyToken] = useState('infistel_verified_token_123');
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // AI API State
    const [aiApiKey, setAiApiKey] = useState('');
    const [isAiSaved, setIsAiSaved] = useState(false);

    useEffect(() => {
        // Load AI Key from local storage on mount
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setAiApiKey(savedKey);
    }, []);

    const handleSaveWhatsAppConfig = () => {
        // Simulate API call
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        // In a real app, save to backend
        console.log('Saving WhatsApp config:', { webhookUrl, verifyToken, phoneNumberId, wabaId, accessToken });
    };

    const handleSaveAiConfig = () => {
        if (aiApiKey.trim()) {
            localStorage.setItem('gemini_api_key', aiApiKey.trim());
        } else {
            localStorage.removeItem('gemini_api_key');
        }
        setIsAiSaved(true);
        setTimeout(() => setIsAiSaved(false), 3000);
    };

    return (
        <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuración del Sistema</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona las integraciones, IA y preferencias de la plataforma.</p>
                </div>
            </div>

            <div className="flex gap-6 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('whatsapp')}
                    className={`pb-4 px-2 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'whatsapp' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                >
                    <div className="flex items-center gap-2">
                        <MessageCircle size={18} />
                        Integración WhatsApp
                    </div>
                    {activeTab === 'whatsapp' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`pb-4 px-2 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'ai' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} />
                        Inteligencia Artificial
                    </div>
                    {activeTab === 'ai' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'general' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                >
                    <div className="flex items-center gap-2">
                        <Monitor size={18} />
                        General y Cuentas
                    </div>
                    {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                </button>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">

                {activeTab === 'whatsapp' && (
                    <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Left: Configuration Form */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                        <Cloud size={20} />
                                    </div>
                                    Credenciales de API (Meta)
                                </h3>
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded uppercase tracking-wide">Developer Mode</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL <span className="text-gray-400 font-normal">(Solo lectura)</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={webhookUrl}
                                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg p-2.5 font-mono select-all"
                                        />
                                        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Copiar">
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Configura esta URL en el panel de desarrolladores de Meta.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verify Token</label>
                                    <input
                                        type="text"
                                        value={verifyToken}
                                        onChange={(e) => setVerifyToken(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="Escribe un token seguro..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={phoneNumberId}
                                            onChange={(e) => setPhoneNumberId(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            placeholder="Ej: 10593..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Business Account ID</label>
                                        <input
                                            type="text"
                                            value={wabaId}
                                            onChange={(e) => setWabaId(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            placeholder="Ej: 10234..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token (User / System)</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={accessToken}
                                            onChange={(e) => setAccessToken(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono"
                                            placeholder="EAAG..."
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <Lock size={16} />
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                        <HelpCircle size={12} />
                                        Recomendado: Usar un Token de Sistema Permanente.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className={`text-sm font-medium transition-all ${isSaved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
                                        ¡Configuración guardada!
                                    </span>
                                    <button
                                        onClick={handleSaveWhatsAppConfig}
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20 font-medium transition-all transform active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Instructions */}
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                                    <HelpCircle size={20} />
                                    Procedimiento de Integración
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Crear App en Meta Developers</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                Ve a <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a>, crea una nueva app de tipo "Business" y añade el producto "WhatsApp".
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Configurar Webhook</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                En la sección de configuración de WhatsApp de tu app, configura el Webhook usando la <strong>URL</strong> y el <strong>Token</strong> que aparecen a la izquierda. Suscríbete al evento <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700">messages</code>.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Obtener Credenciales</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                Copia el <strong>Phone Number ID</strong> y <strong>WABA ID</strong> de la sección "API Setup". Para producción, crea un Usuario de Sistema y genera un Token permanente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2">¿Necesitas ayuda técnica?</h3>
                                    <p className="text-indigo-100 text-sm mb-4">Revisa la documentación oficial de Infistel o contacta a soporte para una configuración asistida.</p>
                                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-sm font-medium transition-colors">
                                        Ver Documentación
                                    </button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="absolute top-10 -left-10 w-20 h-20 bg-purple-400/30 rounded-full blur-xl"></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                        <Bot size={20} />
                                    </div>
                                    Configuración de IA (Gemini)
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 p-4 rounded-xl mb-4">
                                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1 flex items-center gap-2">
                                        Nota Importante
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        Esta configuración se guarda en tu navegador (Local Storage) y simula las variables de entorno para desarrollo. En producción, esto debe configurarse en el servidor.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gemini API Key</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={aiApiKey}
                                            onChange={(e) => setAiApiKey(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
                                            placeholder="AIzaSy..."
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <Key size={16} />
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Obtén tu API Key gratis en <a href="https://aistudio.google.com/" target="_blank" className="text-purple-600 hover:underline">Google AI Studio</a>.</p>

                                    <div className="mt-2">
                                        <button
                                            onClick={async () => {
                                                const { testConnection } = await import('../services/geminiService');
                                                const result = await testConnection();
                                                alert(result.message);
                                            }}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium underline"
                                        >
                                            Probar conexión con Google Gemini
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className={`text-sm font-medium transition-all ${isAiSaved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
                                        ¡Llave guardada!
                                    </span>
                                    <button
                                        onClick={handleSaveAiConfig}
                                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/20 font-medium transition-all transform active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Guardar Configuración
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                                    <Sparkles size={20} />
                                    Funciones de IA Disponibles
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center mt-0.5">
                                            <CheckCircle size={12} className="text-purple-700 dark:text-purple-300" />
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Respuestas Sugeridas:</strong> Genera opciones rápidas de respuesta basadas en el contexto del chat.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center mt-0.5">
                                            <CheckCircle size={12} className="text-purple-700 dark:text-purple-300" />
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Asistente de Redacción:</strong> Convierte instrucciones simples en mensajes profesionales.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center mt-0.5">
                                            <CheckCircle size={12} className="text-purple-700 dark:text-purple-300" />
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Resumen de Conversaciones:</strong> Obtén un resumen ejecutivo de chats largos.</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col xl:flex-row gap-8 w-full">
                        {/* Reusing existing components for General tab */}
                        <div className="flex-1 space-y-6">
                            {/* NEW: Accounts Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-purple-600 dark:text-purple-400" />
                                    Cuentas Vinculadas
                                </h3>

                                <div className="space-y-3">
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
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            {/* Danger Zone */}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;