import React, { useState } from 'react';
import { Group, Contact } from '../types';
import { Plus, Check, X } from 'lucide-react';

interface GroupManagerProps {
    contacts: Contact[];
    groups: Group[];
    onUpdateGroups: (groups: Group[]) => void;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ contacts, groups, onUpdateGroups }) => {
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleContact = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreate = () => {
        const newGroup: Group = {
            id: Date.now().toString(),
            name: newName,
            contactIds: selectedIds,
        };
        onUpdateGroups([...groups, newGroup]);
        setShowModal(false);
        setNewName('');
        setSelectedIds([]);
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Grupos de Contactos</h2>
            <button
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => setShowModal(true)}
            >
                <Plus size={20} /> Crear Grupo
            </button>

            {/* List existing groups */}
            <ul className="mt-6 space-y-2">
                {groups.map(g => (
                    <li key={g.id} className="p-2 bg-gray-100 rounded">
                        <strong>{g.name}</strong> ({g.contactIds.length} contactos)
                    </li>
                ))}
            </ul>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded w-96">
                        <h3 className="text-lg font-semibold mb-4">Nuevo Grupo</h3>
                        <input
                            type="text"
                            placeholder="Nombre del grupo"
                            className="w-full border p-2 mb-4"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <div className="max-h-48 overflow-y-auto mb-4">
                            {contacts.map(c => (
                                <label key={c.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(c.id)}
                                        onChange={() => toggleContact(c.id)}
                                    />
                                    <span>{c.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded"
                                onClick={() => setShowModal(false)}
                            >
                                <X size={18} /> Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-1"
                                onClick={handleCreate}
                                disabled={!newName.trim()}
                            >
                                <Check size={18} /> Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
