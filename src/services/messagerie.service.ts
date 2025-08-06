import { Injectable, NgZone } from '@angular/core';
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, where, or, and, limit, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../main';
import { Observable } from 'rxjs';
import { getDocs } from 'firebase/firestore';
import { Message } from './models-api.interface';

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    async sendMessage(senderId: string, receiverId: string, text: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'messages');
            await addDoc(messagesRef, {
                senderId,
                receiverId,
                text,
                timestamp: Timestamp.now(),
                read: false, // NOUVEAU : Marquer comme non lu par défaut
                readAt: null // NOUVEAU : Date de lecture
            });
            console.log('Message envoyé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            throw error;
        }
    }
    listenToUnreadMessagesCount(userId: string): Observable<number> {
        return new Observable(observer => {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                observer.next(snapshot.size);
            }, (error) => {
                observer.error(error);
            });

            return () => unsubscribe();
        });
    }
    // Méthode pour écouter les messages non lus par conversation en temps réel
    listenToUnreadMessagesByConversation(userId: string): Observable<Map<string, number>> {
        return new Observable(observer => {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const unreadByUser = new Map<string, number>();

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const senderId = data['senderId'];
                    const currentCount = unreadByUser.get(senderId) || 0;
                    unreadByUser.set(senderId, currentCount + 1);
                });

                observer.next(unreadByUser);
            }, (error) => {
                observer.error(error);
            });

            return () => unsubscribe();
        });
    }
    // Méthode pour obtenir le dernier message de chaque conversation
    async getLastMessageForConversations(userId: string, userIds: string[]): Promise<Map<string, any>> {
        const lastMessages = new Map<string, any>();

        for (const otherUserId of userIds) {
            try {
                const messagesRef = collection(db, 'messages');
                const q = query(
                    messagesRef,
                    or(
                        and(
                            where('senderId', '==', userId),
                            where('receiverId', '==', otherUserId)
                        ),
                        and(
                            where('senderId', '==', otherUserId),
                            where('receiverId', '==', userId)
                        )
                    ),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const lastMessage = snapshot.docs[0].data();
                    lastMessages.set(otherUserId, lastMessage);
                }
            } catch (error) {
                console.error(`Erreur lors de la récupération du dernier message pour ${otherUserId}:`, error);
            }
        }

        return lastMessages;
    }

    async getUnreadMessagesByConversation(userId: string): Promise<Map<string, number>> {
        try {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            const unreadByUser = new Map<string, number>();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const senderId = data['senderId'];
                const currentCount = unreadByUser.get(senderId) || 0;
                unreadByUser.set(senderId, currentCount + 1);
            });

            return unreadByUser;
        } catch (error) {
            console.error('Erreur lors de la récupération des messages non lus par conversation:', error);
            return new Map();
        }
    }

    async getTotalUnreadMessagesCount(userId: string): Promise<number> {
        try {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Erreur lors du comptage total des messages non lus:', error);
            return 0;
        }
    }
    async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('senderId', '==', otherUserId),
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const batch = writeBatch(db);

                snapshot.docs.forEach((docSnapshot) => {
                    batch.update(docSnapshot.ref, {
                        read: true,
                        readAt: Timestamp.now()
                    });
                });

                await batch.commit();
                console.log(`${snapshot.size} messages marqués comme lus`);
            }
        } catch (error) {
            console.error('Erreur lors du marquage des messages comme lus:', error);
            throw error;
        }
    }
    async getUnreadMessagesCount(userId: string, otherUserId: string): Promise<number> {
        try {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('senderId', '==', otherUserId),
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Erreur lors du comptage des messages non lus:', error);
            return 0;
        }
    }
    // Méthode corrigée pour écouter tous les messages d'un utilisateur
    listenToAllUserMessages(userId: string): Observable<Message> {
        return new Observable(observer => {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const messageData = change.doc.data();
                            const message: Message = {
                                senderId: messageData['senderId'],
                                receiverId: messageData['receiverId'],
                                text: messageData['text'],
                                timestamp: messageData['timestamp']
                            };
                            observer.next(message);
                        }
                    });
                },
                (error) => {
                    console.error('Erreur lors de l\'écoute globale des messages:', error);
                    observer.error(error);
                }
            );

            // Fonction de nettoyage
            return () => {
                unsubscribe();
            };
        });
    }
    async markAllMessagesAsRead(userId: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const batch = writeBatch(db);

                snapshot.docs.forEach((docSnapshot) => {
                    batch.update(docSnapshot.ref, {
                        read: true,
                        readAt: Timestamp.now()
                    });
                });

                await batch.commit();
                console.log(`${snapshot.size} messages marqués comme lus`);
            }
        } catch (error) {
            console.error('Erreur lors du marquage de tous les messages comme lus:', error);
            throw error;
        }
    }
    async getConversationUsers(userId: string): Promise<string[]> {
        console.log('getConversationUsers appelé pour userId:', userId);
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

        console.log('Nombre de messages trouvés:', snapshot.size);

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('Message data:', { senderId: data['senderId'], receiverId: data['receiverId'] });
            if (data['senderId'] !== userId) userIds.add(data['senderId']);
            if (data['receiverId'] !== userId) userIds.add(data['receiverId']);
        });

        const result = Array.from(userIds);
        console.log('UserIds trouvés dans getConversationUsers:', result);
        return result;
    }

    // NOUVELLE MÉTHODE : Écouter spécifiquement les nouveaux messages entrants
    // Dans messagerie.service.ts

    listenToIncomingMessages(userId: string): Observable<any> {
        return new Observable(observer => {
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                where('read', '==', false),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const messageData = {
                            id: change.doc.id,
                            ...change.doc.data()
                        };
                        observer.next(messageData);
                    }
                });
            }, (error) => {
                observer.error(error);
            });

            return () => unsubscribe();
        });
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