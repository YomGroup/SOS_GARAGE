// services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { MessageService } from './messagerie.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private unreadMessagesCountSubject = new BehaviorSubject<number>(0);
    private hasNewMessagesSubject = new BehaviorSubject<boolean>(false);
    private isInitialized = false;
    private messageListenerSub?: Subscription;
    private currentUserId?: any;

    // Observables publics
    unreadMessagesCount$ = this.unreadMessagesCountSubject.asObservable();
    hasNewMessages$ = this.hasNewMessagesSubject.asObservable();

    constructor(
        private messageService: MessageService,
        private authService: AuthService
    ) {
        this.initializeService();
    }

    // Initialiser le service automatiquement
    private async initializeService(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const token = this.authService.getToken();
            if (!token) {
                console.log('Pas de token, service de notification non initialisé');
                return;
            }

            this.currentUserId = this.authService.getKeycloakId();
            if (!this.currentUserId) {
                console.log('Pas d\'ID utilisateur, service de notification non initialisé');
                return;
            }

            console.log('Initialisation du service de notification pour:', this.currentUserId);

            // Calculer le nombre initial de messages non lus
            await this.calculateInitialUnreadMessages();

            // Démarrer l'écoute des nouveaux messages
            this.setupGlobalMessageListener();

            this.isInitialized = true;
            console.log('Service de notification initialisé avec succès');

        } catch (error) {
            console.error('Erreur lors de l\'initialisation du service de notification:', error);
        }
    }

    // Calculer le nombre initial de messages non lus
    private async calculateInitialUnreadMessages(): Promise<void> {
        if (!this.currentUserId) return;

        try {
            console.log('Calcul des messages non lus initiaux...');

            // Récupérer tous les utilisateurs avec qui on a des conversations
            const conversationUserIds = await this.messageService.getConversationUsers(this.currentUserId);

            let totalUnreadCount = 0;

            // Pour chaque conversation, compter les messages non lus
            for (const userId of conversationUserIds) {
                const unreadCount = await this.messageService.getUnreadMessagesCount(
                    this.currentUserId,
                    userId
                );
                totalUnreadCount += unreadCount;
            }

            console.log('Messages non lus initiaux calculés:', totalUnreadCount);
            this.updateUnreadCount(totalUnreadCount);

        } catch (error) {
            console.error('Erreur lors du calcul des messages non lus initiaux:', error);
        }
    }

    // Écouter globalement les nouveaux messages entrants
    private setupGlobalMessageListener(): void {
        if (!this.currentUserId) return;

        console.log('Configuration de l\'écoute globale des messages pour:', this.currentUserId);

        // Si on a déjà un listener, le nettoyer d'abord
        if (this.messageListenerSub) {
            this.messageListenerSub.unsubscribe();
        }

        this.messageListenerSub = this.messageService
            .listenToIncomingMessages(this.currentUserId)
            .subscribe({
                next: async (message) => {
                    console.log('Nouveau message détecté globalement de:', message.senderId);

                    // Toujours incrémenter le compteur pour les nouveaux messages
                    this.incrementUnreadCount();

                    console.log('Compteur de notifications mis à jour');
                },
                error: (err) => {
                    console.error('Erreur dans l\'écoute globale des messages:', err);
                }
            });
    }

    // Méthode publique pour réinitialiser le service (utile après connexion)
    public async reinitialize(): Promise<void> {
        console.log('Réinitialisation du service de notification...');
        this.isInitialized = false;
        this.cleanup();
        await this.initializeService();
    }

    // Nettoyer les ressources
    private cleanup(): void {
        if (this.messageListenerSub) {
            this.messageListenerSub.unsubscribe();
            this.messageListenerSub = undefined;
        }
    }

    // Mettre à jour le nombre de messages non lus
    updateUnreadCount(count: number): void {
        console.log('Mise à jour du compteur de notifications:', count);
        this.unreadMessagesCountSubject.next(count);
        this.hasNewMessagesSubject.next(count > 0);
    }

    // Incrementer le compteur
    incrementUnreadCount(): void {
        const currentCount = this.unreadMessagesCountSubject.value;
        this.updateUnreadCount(currentCount + 1);
    }

    // Décrémenter le compteur
    decrementUnreadCount(amount: number = 1): void {
        const currentCount = this.unreadMessagesCountSubject.value;
        const newCount = Math.max(0, currentCount - amount);
        this.updateUnreadCount(newCount);
    }

    // Réinitialiser les notifications
    markAllAsRead(): void {
        this.updateUnreadCount(0);
    }

    // Marquer une conversation spécifique comme lue
    async markConversationAsRead(otherUserId: string): Promise<void> {
        if (!this.currentUserId) return;

        try {
            // Obtenir le nombre de messages non lus pour cette conversation
            const unreadCount = await this.messageService.getUnreadMessagesCount(
                this.currentUserId,
                otherUserId
            );

            if (unreadCount > 0) {
                // Marquer comme lus dans Firebase
                await this.messageService.markMessagesAsRead(this.currentUserId, otherUserId);

                // Décrémenter le compteur global
                this.decrementUnreadCount(unreadCount);

                console.log(`${unreadCount} messages marqués comme lus pour ${otherUserId}`);
            }
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
        }
    }

    // Recalculer complètement les messages non lus
    async recalculateUnreadMessages(): Promise<void> {
        await this.calculateInitialUnreadMessages();
    }

    // Obtenir le nombre actuel
    getCurrentUnreadCount(): number {
        return this.unreadMessagesCountSubject.value;
    }

    // Vérifier s'il y a de nouveaux messages
    getHasNewMessages(): boolean {
        return this.hasNewMessagesSubject.value;
    }

    // Nettoyer lors de la destruction du service
    ngOnDestroy(): void {
        this.cleanup();
    }
}