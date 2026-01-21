import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db, appId } from './firebase';

// Helper to get the base path for artifacts (matching current project structure)
const getCollectionPath = (name: string) => {
    return `artifacts/${appId}/public/data/${name}`;
};

export const databaseService = {
    // Generic CRUD
    async add(collectionName: string, data: any) {
        if (!db) return null;
        const colRef = collection(db, getCollectionPath(collectionName));
        return await addDoc(colRef, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    async update(collectionName: string, id: string, data: any) {
        if (!db) return;
        const docRef = doc(db, getCollectionPath(collectionName), id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async delete(collectionName: string, id: string) {
        if (!db) return;
        const docRef = doc(db, getCollectionPath(collectionName), id);
        await deleteDoc(docRef);
    },

    listen(collectionName: string, callback: (data: any[]) => void) {
        if (!db) return () => { };
        const colRef = collection(db, getCollectionPath(collectionName));
        const q = query(colRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(docs);
        });
    }
};
