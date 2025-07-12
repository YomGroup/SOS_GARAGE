// chat.service.ts
/*
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Message {
    text: string;
    sender: string;
    timestamp: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    constructor(private firestore: Firestore) { }

    getMessages(): Observable<Message[]> {
        const ref = collection(this.firestore, 'messages');
        const q = query(ref, orderBy('timestamp'));
        return collectionData(q) as Observable<Message[]>;
    }

    sendMessage(text: string, sender: string) {
        const ref = collection(this.firestore, 'messages');
        return addDoc(ref, {
            text,
            sender,
            timestamp: new Date()
        });
    }
}
*/
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface MessageFirebase {
    conversationId: string;
    expediteur: string;
    objet: string;
    contenu: string;
    dateEnvoi: string;
    heureEnvoi: string;
    lu: boolean;
    type: string;
    priorite: string;
    pieceJointe?: string[];
    sinistresId?: string;
    timestamp: any;
}

@Injectable({ providedIn: 'root' })
export class ChatFirebaseService {
    constructor(private firestore: Firestore) { }

    async sendMessage(conversationId: string, message: Omit<MessageFirebase, 'timestamp'>): Promise<void> {
        const convRef = collection(this.firestore, `conversations/${conversationId}/messages`);
        await addDoc(convRef, {
            ...message,
            timestamp: new Date()
        });
    }

    getMessages(conversationId: string): Observable<MessageFirebase[]> {
        const convRef = collection(this.firestore, `conversations/${conversationId}/messages`);
        const q = query(convRef, orderBy('timestamp'));
        return collectionData(q, { idField: 'id' }) as Observable<MessageFirebase[]>;
    }
}
