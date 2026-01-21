import React from 'react';
import { Shield, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 md:p-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Políticas de Privacidad</h1>
                            <p className="text-slate-500 dark:text-slate-400">Última actualización: 21 de enero de 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all font-medium self-start md:self-center"
                    >
                        <ArrowLeft size={18} />
                        Volver
                    </button>
                </header>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Lock className="text-blue-500" size={20} />
                                1. Introducción
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                En INFISTEL, valoramos su privacidad y nos comprometemos a proteger sus datos personales. Esta Política de Privacidad describe cómo recopilamos, utilizamos y compartimos su información cuando utiliza nuestra plataforma de CRM y Atención al Cliente por WhatsApp.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Eye className="text-blue-500" size={20} />
                                2. Información que Recopilamos
                            </h2>
                            <div className="space-y-3">
                                <p className="text-slate-600 dark:text-slate-300">
                                    Para proporcionar un servicio eficiente, recopilamos diferentes tipos de información:
                                </p>
                                <ul className="list-none space-y-2 pl-2">
                                    {[
                                        'Datos de contacto (nombre, teléfono, correo electrónico)',
                                        'Mensajes y metadatos de conversaciones gestionadas vía WhatsApp API',
                                        'Información técnica (dirección IP, tipo de navegador, logs de acceso)',
                                        'Datos de geolocalización para la gestión de cuadrillas y visitas técnicas'
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-300">
                                            <CheckCircle2 className="text-green-500 shrink-0 mt-1" size={16} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="text-blue-500" size={20} />
                                3. Uso de la Información
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Utilizamos la información recopilada para:
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    'Gestionar la atención al cliente de manera centralizada',
                                    'Mejorar la eficiencia de los agentes mediante IA',
                                    'Programar y monitorear mantenimientos técnicos',
                                    'Enviar campañas informativas autorizadas',
                                    'Garantizar la seguridad de la red y el sistema'
                                ].map((item, i) => (
                                    <li key={i} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-600 dark:text-slate-300 shadow-sm">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl text-white shadow-xl shadow-blue-500/20">
                            <h3 className="font-bold text-lg mb-2">¿Tiene dudas?</h3>
                            <p className="text-blue-50/80 text-sm mb-4">
                                Si desea ejercer sus derechos de acceso, rectificación o eliminación de datos, no dude en contactarnos.
                            </p>
                            <a
                                href="mailto:soporte@infistel.pe"
                                className="inline-block w-full text-center py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-colors text-sm font-semibold"
                            >
                                soporte@infistel.pe
                            </a>
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Cumplimiento Legal</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                INFISTEL cumple con las normativas locales de Protección de Datos Personales y los Términos de Servicio de Meta para el uso de la API de WhatsApp Business. Su información se almacena en servidores seguros con cifrado de grado industrial.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-slate-400 text-sm">
                        © 2026 INFISTEL - Todos los derechos reservados.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
