import React, { useState } from 'react';
import { Campaign } from '../types';
import { Megaphone, Plus, Calendar, CheckCircle, Users, BarChart3, Send, Smartphone, X, Search, Filter } from 'lucide-react';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Promo Verano 2025',
    message: 'Hola {{nombre}}, aprovecha nuestro 20% de descuento en todos los servicios este verano. 🌞',
    audience: 'VIP',
    status: 'completed',
    sentCount: 150,
    totalCount: 150,
    readCount: 120,
    createdAt: new Date(Date.now() - 86400000 * 5)
  },
  {
    id: '2',
    name: 'Recordatorio Facturación',
    message: 'Estimado {{nombre}}, recuerda que tu factura vence mañana. Evita recargos.',
    audience: 'Pendiente Pago',
    status: 'completed',
    sentCount: 45,
    totalCount: 50,
    readCount: 30,
    createdAt: new Date(Date.now() - 86400000 * 2)
  },
  {
    id: '3',
    name: 'Lanzamiento Nueva Feature',
    message: '¡Novedades! Ahora puedes gestionar tus citas desde la app. Pruébalo hoy.',
    audience: 'all',
    status: 'scheduled',
    sentCount: 0,
    totalCount: 320,
    readCount: 0,
    createdAt: new Date(),
    scheduledFor: new Date(Date.now() + 86400000)
  }
];

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [showModal, setShowModal] = useState(false);
  
  // New Campaign Form State
  const [newName, setNewName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newAudience, setNewAudience] = useState('all');

  const handleCreateCampaign = (e: React.FormEvent) => {
      e.preventDefault();
      const newCampaign: Campaign = {
          id: Date.now().toString(),
          name: newName,
          message: newMessage,
          audience: newAudience,
          status: 'completed', // Simulating immediate send for demo
          sentCount: 0,
          totalCount: newAudience === 'all' ? 350 : 45, // Mock counts
          readCount: 0,
          createdAt: new Date()
      };
      
      // Simulate sending progress
      setCampaigns([newCampaign, ...campaigns]);
      setShowModal(false);
      resetForm();
  };

  const resetForm = () => {
      setNewName('');
      setNewMessage('');
      setNewAudience('all');
  };

  const insertVariable = (variable: string) => {
      setNewMessage(prev => prev + ` {{${variable}}} `);
  };

  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="text-purple-600 dark:text-purple-400" />
            Campañas Publicitarias
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Envía mensajes masivos a tus clientes de WhatsApp.</p>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
        >
            <Plus size={18} />
            Nueva Campaña
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Send size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Mensajes Enviados</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12,450</p>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Apertura</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">84%</p>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                    <Calendar size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Campañas Activas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                </div>
            </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Historial de Campañas</h3>
              <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Search size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Filter size={20} />
                  </button>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                      <tr>
                          <th className="px-6 py-4">Nombre Campaña</th>
                          <th className="px-6 py-4">Audiencia</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4">Entrega</th>
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {campaigns.map((campaign) => (
                          <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4">
                                  <p className="font-semibold text-gray-900 dark:text-white">{campaign.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{campaign.message}</p>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      <Users size={16} className="text-gray-400" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                          {campaign.audience === 'all' ? 'Todos los Contactos' : `Etiqueta: ${campaign.audience}`}
                                      </span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                    ${campaign.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                      {campaign.status === 'completed' ? 'Completado' : campaign.status === 'scheduled' ? 'Programado' : 'Borrador'}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="w-full max-w-[120px]">
                                      <div className="flex justify-between text-xs mb-1 text-gray-500">
                                          <span>{Math.round((campaign.readCount / campaign.totalCount) * 100)}% Leído</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full" 
                                            style={{ width: `${(campaign.readCount / campaign.totalCount) * 100}%` }}
                                          ></div>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">{campaign.sentCount} / {campaign.totalCount} enviados</p>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                  {campaign.createdAt.toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                  <button className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                                      <BarChart3 size={18} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* New Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
            
            {/* Form Section */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Campaña</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la Campaña</label>
                        <input 
                            type="text" 
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white outline-none"
                            placeholder="Ej. Promo Navidad 2024"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audiencia (Segmentación)</label>
                        <select 
                            value={newAudience}
                            onChange={(e) => setNewAudience(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white outline-none appearance-none"
                        >
                            <option value="all">Todos los Contactos</option>
                            <option value="VIP">Clientes VIP</option>
                            <option value="New">Nuevos Clientes</option>
                            <option value="Pending">Pagos Pendientes</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Users size={12} /> Se enviará a aproximadamente {newAudience === 'all' ? '350' : '45'} contactos.
                        </p>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mensaje</label>
                         <div className="relative">
                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white outline-none h-40 resize-none"
                                placeholder="Escribe tu mensaje aquí..."
                            />
                            <div className="absolute bottom-2 left-2 flex gap-2">
                                <button type="button" onClick={() => insertVariable('nombre')} className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                                    {`{{nombre}}`}
                                </button>
                                <button type="button" onClick={() => insertVariable('empresa')} className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                                    {`{{empresa}}`}
                                </button>
                            </div>
                         </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg font-bold">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                            <Send size={18} /> Enviar Campaña
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Section */}
            <div className="w-full md:w-80 bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6">Vista Previa</h3>
                
                <div className="w-[280px] h-[550px] bg-white dark:bg-gray-800 rounded-[3rem] border-8 border-gray-800 dark:border-gray-600 shadow-2xl relative overflow-hidden flex flex-col">
                    {/* Phone Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-600 rounded-b-xl z-10"></div>
                    
                    {/* Phone Header */}
                    <div className="h-16 bg-[#005c4b] flex items-center px-4 pt-4 text-white gap-3 shadow-md z-0">
                        <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-2 w-20 bg-white/40 rounded mb-1"></div>
                            <div className="h-2 w-12 bg-white/20 rounded"></div>
                        </div>
                    </div>

                    {/* Phone Body */}
                    <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] p-4 overflow-y-auto" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"}}>
                        <div className="bg-white dark:bg-[#202c33] p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-900 dark:text-white">
                            {newMessage ? newMessage.replace('{{nombre}}', 'Juan').replace('{{empresa}}', 'Tech S.A.') : <span className="text-gray-400 italic">Tu mensaje aparecerá aquí...</span>}
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-500">12:30 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Phone Footer */}
                    <div className="h-14 bg-gray-100 dark:bg-[#202c33] px-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex-1 h-8 rounded-full bg-white dark:bg-gray-700"></div>
                        <div className="w-8 h-8 rounded-full bg-[#005c4b] flex items-center justify-center">
                            <Send size={14} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;