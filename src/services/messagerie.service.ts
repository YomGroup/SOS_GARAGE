import { Injectable, NgZone } from '@angular/core';
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, where, or, and, limit } from 'firebase/firestore';
import { db } from '../main';
import { Observable } from 'rxjs';
import { getDocs } from 'firebase/firestore';
import { Message } from './models-api.interface';

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    async sendMessage(senderId: string, receiverId: string, text: string) {
        await addDoc(collection(db, 'messages'), {
            senderId,
            receiverId,
            text,
            timestamp: serverTimestamp(),
            isRead: false
        });
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

    // MÉTHODE CORRIGÉE : Écouter spécifiquement les nouveaux messages entrants
    listenToIncomingMessages(userId: string): Observable<any> {
        return new Observable(observer => {
            if (!userId) {
                observer.error('UserId est requis');
                return () => { };
            }

            console.log('Démarrage de l\'écoute des messages entrants pour:', userId);

            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('receiverId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            // Garder trace du dernier timestamp pour éviter de traiter les anciens messages
            let lastProcessedTimestamp: any = null;
            let isFirstLoad = true;

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const messageData = change.doc.data();
                            const messageTimestamp = messageData['timestamp'];

                            // Si c'est le premier chargement, marquer tous les messages existants comme traités
                            if (isFirstLoad) {
                                if (!lastProcessedTimestamp ||
                                    (messageTimestamp && messageTimestamp.seconds > (lastProcessedTimestamp?.seconds || 0))) {
                                    lastProcessedTimestamp = messageTimestamp;
                                }
                            } else {
                                // Traiter seulement les nouveaux messages
                                if (!lastProcessedTimestamp ||
                                    (messageTimestamp && messageTimestamp.seconds > lastProcessedTimestamp.seconds)) {

                                    console.log('Nouveau message entrant de:', messageData['senderId']);

                                    observer.next({
                                        senderId: messageData['senderId'],
                                        receiverId: messageData['receiverId'],
                                        text: messageData['text'],
                                        timestamp: messageTimestamp
                                    });

                                    lastProcessedTimestamp = messageTimestamp;
                                }
                            }
                        }
                    });

                    // Après le premier chargement, commencer à traiter les nouveaux messages
                    if (isFirstLoad) {
                        isFirstLoad = false;
                        console.log('Initialisation terminée, écoute des nouveaux messages activée');
                    }
                },
                (error) => {
                    console.error('Erreur lors de l\'écoute des messages entrants:', error);
                    observer.error(error);
                }
            );

            return () => {
                console.log('Arrêt de l\'écoute des messages entrants pour:', userId);
                unsubscribe();
            };
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