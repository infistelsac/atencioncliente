import React from 'react';
import { DashboardStats } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MessageSquare, Clock, CheckCircle, TrendingUp, Users } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
}

const data = [
  { name: 'Lun', messages: 400, resolved: 240 },
  { name: 'Mar', messages: 300, resolved: 139 },
  { name: 'Mie', messages: 500, resolved: 480 },
  { name: 'Jue', messages: 280, resolved: 200 },
  { name: 'Vie', messages: 590, resolved: 430 },
  { name: 'Sab', messages: 200, resolved: 180 },
  { name: 'Dom', messages: 150, resolved: 120 },
];

const satisfactionData = [
  { name: '1 ★', count: 10 },
  { name: '2 ★', count: 25 },
  { name: '3 ★', count: 40 },
  { name: '4 ★', count: 120 },
  { name: '5 ★', count: 350 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Panel de Control</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <MessageSquare size={24} />
            </div>
            <span className="text-green-500 text-sm font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp size={14} /> +12%
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Mensajes</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalMessages}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <Clock size={24} />
            </div>
            <span className="text-red-500 text-sm font-semibold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp size={14} /> +5%
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tiempo Respuesta Promedio</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.avgResponseTime}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <span className="text-green-500 text-sm font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp size={14} /> +8%
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tickets Resueltos</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.resolvedTickets}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Agentes Activos</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeAgents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actividad de Mensajes</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1f2937', color: '#fff'}}
                    itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="messages" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorMsg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Satisfacción del Cliente</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 600}} width={40} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}} itemStyle={{color: '#fff'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;