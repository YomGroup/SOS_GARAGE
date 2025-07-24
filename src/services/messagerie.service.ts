import { Injectable, NgZone } from '@angular/core';
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, where, or, and } from 'firebase/firestore';
import { db } from '../main';
import { Observable } from 'rxjs';
import { getDocs } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    async sendMessage(senderId: string, receiverId: string, text: string) {
        await addDoc(collection(db, 'messages'), {
            senderId,
            receiverId,
            text,
            timestamp: serverTimestamp()
        });
    }

    async getConversationUsers(userId: string): Promise<string[]> {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            or(
                where('senderId', '==', userId),
                where('receiverId', '==', userId)
            )
        );

        const snapshot = await getDocs(q);
        const userIds = new Set<string>();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data['senderId'] !== userId) userIds.add(data['senderId']);
            if (data['receiverId'] !== userId) userIds.add(data['receiverId']);
        });

        return Array.from(userIds);
    }

    listenToMessages(user1: string, user2: string): Observable<any[]> {
        return new Observable(observer => {
            // Vérification que les deux utilisateurs sont définis
            if (!user1 || !user2) {
                observer.next([]);
                return () => { };
            }

            // Requête corrigée : récupérer tous les messages entre ces deux utilisateurs
            const q = query(
                collection(db, 'messages'),
                or(
                    and(
                        where('senderId', '==', user1),
                        where('receiverId', '==', user2)
                    ),
                    and(
                        where('senderId', '==', user2),
                        where('receiverId', '==', user1)
                    )
                ),
                orderBy('timestamp', 'asc')
            );

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const messages = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    observer.next(messages);
                },
                (error) => {
                    console.error('Erreur lors de l\'écoute des messages:', error);
                    observer.error(error);
                }
            );

            // Fonction de nettoyage
            return () => unsubscribe();
        });
    }
}