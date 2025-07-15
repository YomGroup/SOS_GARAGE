// message.service.ts
import { Injectable } from '@angular/core';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../main';
import {
    query,
    orderBy,
    onSnapshot,
    where,
} from 'firebase/firestore';

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
    listenToMessages(senderId: string, receiverId: string, callback: (msgs: any[]) => void) {
        const q = query(
            collection(db, 'messages'),
            where('senderId', 'in', [senderId, receiverId]),
            orderBy('timestamp')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages: any[] = [];
            snapshot.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
            callback(messages);
        });

        return unsubscribe;
    }
}
