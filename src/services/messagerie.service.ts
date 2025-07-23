import { Injectable } from '@angular/core';
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../main';
import { Observable } from 'rxjs';
import { getDocs, or } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
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
            const q = query(
                collection(db, 'messages'),
                where('senderId', 'in', [user1, user2]),
                where('receiverId', 'in', [user1, user2]),
                orderBy('timestamp')
            );

            const unsubscribe = onSnapshot(q, snapshot => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                observer.next(messages);
            });

            // Fonction de nettoyage
            return () => unsubscribe();
        });
    }


}
