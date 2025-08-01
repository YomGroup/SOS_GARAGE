import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { MessageService } from '../../../../services/messagerie.service';
import { AuthService } from '../../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Message } from '../../models/Message.model';
import { ReparateurService } from '../../../../services/reparateur.service';
import { Assure, Reparateur } from '../../../../services/models-api.interface';
import { ActivatedRoute } from '@angular/router';
import { NgZone } from '@angular/core';
import { AssureService } from '../../../../services/assure.service';
import { MissionService } from '../../../../services/mission.service';
import { Mission } from '../../../../services/models-api.interface';
import { Modal } from 'bootstrap';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage = '';
  senderId: string = '';
  receiverId: string = '';
  isAssure: boolean = false;
  isGaragiste: boolean = false;
  isAdmin: boolean = false;
  selectedUser?: Reparateur;
  missions: Mission[] = [];
  disponiblesAssures: any[] = [];
  private messagesUnsubscribe!: () => void;

  private messagesSub!: Subscription;
  private currentUserSub!: Subscription;
  private conversationsSub!: Subscription; // NOUVEAU : subscription pour les nouvelles conversations
  conversationUsers: any[] = [];
  filteredMissions: Mission[] = [];
  isLoadingModalData = false;
  showConversationsList: boolean = true;
  disponiblesGaragistes: any[] = [];
  disponiblesAdmins: any[] = [];
  isLoadingAllUsers = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private reparateurService: ReparateurService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private assureService: AssureService,
    private missionService: MissionService,
    private messageNotificationService: NotificationService
  ) { }
  async loadConversationUsers(): Promise<void> {
    try {
      console.log('Rechargement de la liste des conversations...');
      const userIds = await this.messageService.getConversationUsers(this.senderId);
      console.log('UserIds trouvés:', userIds);

      if (userIds.length === 0) {
        console.log('Aucune conversation trouvée');
        this.ngZone.run(() => {
          this.conversationUsers = [];
          this.cdRef.detectChanges();
        });
        return;
      }

      if (this.isAssure) {
        // Si c'est un assuré, on récupère les infos des garagistes ET des admins
        const newConversationUsers = await Promise.all(
          userIds.map(async (id) => {
            try {
              // Essayer d'abord de récupérer comme garagiste
              const reparateur = await this.reparateurService.getReparateurByKeycloakId(id).toPromise();
              if (reparateur) {
                return reparateur;
              }

              // Si ce n'est pas un garagiste, créer un objet pour l'admin
              return {
                id: 0,
                name: 'Administrateur',
                prenom: id.slice(0, 6) + '...',
                useridKeycloak: id,
                email: '',
                telephone: '',
                adresse: '',
                codePostal: '',
                ville: '',
                commission: 0,
                siret: '',
                nomDuGarage: 'Administrateur',
                servicePropose: [],
                missions: [],
                anneeExperience: 0,
                nombreVehiculeReparee: 0,
                nombreEmployes: 0,
                logo: '',
                imagesReparations: []
              };
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
              // Si erreur, supposons que c'est un admin
              return {
                id: 0,
                name: 'Administrateur',
                prenom: id.slice(0, 6) + '...',
                useridKeycloak: id,
                email: '',
                telephone: '',
                adresse: '',
                codePostal: '',
                ville: '',
                commission: 0,
                siret: '',
                nomDuGarage: 'Administrateur',
                servicePropose: [],
                missions: [],
                anneeExperience: 0,
                nombreVehiculeReparee: 0,
                nombreEmployes: 0,
                logo: '',
                imagesReparations: []
              };
            }
          })
        );

        // Filtrer les résultats valides
        const validUsers = newConversationUsers.filter(user => !!user);

        // Mettre à jour seulement si la liste a changé
        const currentIds = this.conversationUsers.map(u => u.useridKeycloak).sort().join(',');
        const newIds = validUsers.map(u => u.useridKeycloak).sort().join(',');

        if (currentIds !== newIds) {
          this.ngZone.run(() => {
            this.conversationUsers = validUsers;
            this.cdRef.detectChanges();
            console.log('Liste des conversations mise à jour:', this.conversationUsers);
          });
        }
        await this.calculateUnreadMessages();
      } else {
        // Pour les garagistes/admins, traiter les IDs des assurés
        const newConversationUsers = await Promise.all(
          userIds.map(async (id) => {
            try {
              // Essayer de récupérer les infos de l'assuré
              const assure = await this.assureService.getAssurerID(id).toPromise() as Assure;
              if (assure) {
                return {
                  id: assure.id || 0,
                  name: assure.name || 'Utilisateur',
                  prenom: assure.prenom || '',
                  useridKeycloak: id,
                  email: assure.email || '',
                  telephone: assure.telephone || '',
                  adresse: assure.adresse || '',
                  commission: 0,
                  siret: '',
                  nomDuGarage: 'Assuré',
                  servicePropose: [],
                  missions: [],
                  anneeExperience: 0,
                  nombreVehiculeReparee: 0,
                  nombreEmployes: 0,
                  logo: '',
                  imagesReparations: []
                };
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'assuré ${id}:`, error);
            }
            // Fallback si on ne trouve pas l'assuré
            return {
              id: 0,
              name: 'Administrateur',
              prenom: id.slice(0, 6) + '...',
              useridKeycloak: id,
              email: '',
              telephone: '',
              adresse: '',
              codePostal: '',
              ville: '',
              commission: 0,
              siret: '',
              nomDuGarage: 'Assuré',
              servicePropose: [],
              missions: [],
              anneeExperience: 0,
              nombreVehiculeReparee: 0,
              nombreEmployes: 0,
              logo: '',
              imagesReparations: []
            };
          })
        );

        const currentIds = this.conversationUsers.map(u => u.useridKeycloak).sort().join(',');
        const newIds = newConversationUsers.map(u => u.useridKeycloak).sort().join(',');

        if (currentIds !== newIds) {
          this.ngZone.run(() => {
            this.conversationUsers = newConversationUsers;
            this.cdRef.detectChanges();
          });
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs de conversation:', error);
    }
  }

  // NOUVELLE MÉTHODE : Écouter les nouveaux messages entrants
  private setupIncomingMessageListener(): void {
    if (!this.senderId) return;

    console.log('Configuration de l\'écoute des nouveaux messages entrants pour:', this.senderId);

    this.conversationsSub = this.messageService
      .listenToIncomingMessages(this.senderId)
      .subscribe({
        next: async (message) => {
          console.log('Nouveau message entrant détecté de:', message.senderId);

          // MODIFIÉ : Ne pas incrémenter ici car le service global s'en charge
          // Le service global écoute déjà et incrémente automatiquement

          // Vérifier si c'est un nouveau contact
          const existingUser = this.conversationUsers.find(u => u.useridKeycloak === message.senderId);

          if (!existingUser) {
            console.log('Nouveau contact détecté, rechargement de la liste des conversations');
            await this.loadConversationUsers();

            this.ngZone.run(() => {
              this.cdRef.detectChanges();
            });
          }

          // Si on a une conversation active avec cet expéditeur, marquer comme lu
          if (this.receiverId === message.senderId) {
            // Marquer automatiquement comme lu si on est dans la conversation active
            setTimeout(async () => {
              await this.messageNotificationService.markConversationAsRead(message.senderId);
              this.scrollToBottom();
            }, 500);
          }
        },
        error: (err) => {
          console.error('Erreur lors de l\'écoute des nouveaux messages entrants:', err);
        }
      });
  }



  async ngOnInit(): Promise<void> {
    await this.initializeUserData();

    // Charger les utilisateurs de conversation initiale
    await this.loadConversationUsers();

    // NOUVEAU : Démarrer l'écoute des nouveaux messages entrants
    this.setupIncomingMessageListener();

    // NOUVEAU : Calculer les messages non lus au démarrage
    //await this.calculateUnreadMessages();
    // Écouter les paramètres de route
    this.route.queryParams.subscribe(params => {
      const targetId = params['receiverId'];
      if (targetId) {
        this.selectUser(targetId);
      }
    });
  }
  private async calculateUnreadMessages(): Promise<void> {
    try {
      // MODIFIÉ : Utiliser le service global pour recalculer
      await this.messageNotificationService.recalculateUnreadMessages();
      console.log('Messages non lus recalculés via le service global');
    } catch (error) {
      console.error('Erreur lors du calcul des messages non lus:', error);
    }
  }


  // Méthode pour basculer entre liste et conversation sur mobile
  toggleMobileView(): void {
    this.showConversationsList = !this.showConversationsList;
    this.cdRef.detectChanges();
  }

  // Méthode modifiée pour la sélection d'utilisateur sur mobile
  selectUserMobile(userId: string): void {
    this.selectUser(userId); // Appel de la méthode existante qui inclut maintenant le marquage comme lu

    // Sur mobile, passer à la vue conversation après sélection
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.showConversationsList = false;
      this.cdRef.detectChanges();
    }
  }

  selectUser(userId: string): void {
    console.log('Sélection de l\'utilisateur:', userId);
    this.receiverId = userId;
    this.selectedUser = this.conversationUsers.find(u => u.useridKeycloak === userId);

    // MODIFIÉ : Utiliser le service global pour marquer comme lu
    this.messageNotificationService.markConversationAsRead(userId);

    // Arrêter l'ancienne souscription si elle existe
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }

    // Démarrer l'écoute des messages
    this.setupMessageListener();
  }

  private async markConversationAsRead(userId: string): Promise<void> {

  }
  openUserSelector(): void {
    // Ouvrir le modal immédiatement
    this.openModal();

    // Commencer le chargement des données en arrière-plan
    this.loadModalData();
  }

  // Nouvelle méthode pour ouvrir le modal immédiatement
  private openModal(): void {
    const modalElement = document.getElementById('userSelectorModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  // Séparer le chargement des données
  private loadModalData(): void {
    this.isLoadingModalData = true;
    const keycloakId = this.authService.getKeycloakId();

    if (this.isAdmin) {
      // Pour l'admin, charger tous les utilisateurs
      this.loadAllUsersForAdmin();
    } else if (this.isGaragiste) {
      // Pour le garagiste, garder la logique existante
      console.log('Chargement des missions pour le réparateur connecté:', keycloakId);

      this.missionService.getAllMissions().subscribe({
        next: async (missions) => {
          try {
            console.log('Missions récupérées:', missions);

            this.missions = missions.filter(m =>
              m.reparateur &&
              m.reparateur.useridKeycloak === keycloakId &&
              m.statut === 'en cours'
            );

            console.log('Missions filtrées pour le réparateur connecté:', this.missions);

            if (this.missions.length > 0) {
              await this.loadAssuresFromMissions();
            }

          } catch (error) {
            console.error('Erreur lors du traitement des missions:', error);
          } finally {
            this.isLoadingModalData = false;
            this.cdRef.detectChanges();
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des missions:', err);
          this.isLoadingModalData = false;
          this.cdRef.detectChanges();
        }
      });
    }
  }

  // Nouvelle méthode pour charger tous les utilisateurs (admin)
  private async loadAllUsersForAdmin(): Promise<void> {
    try {
      this.isLoadingAllUsers = true;
      this.disponiblesAssures = [];
      this.disponiblesGaragistes = [];
      this.disponiblesAdmins = [];

      console.log('Chargement de tous les utilisateurs pour l\'admin...');

      // Charger tous les assurés
      this.assureService.getAllAssures().subscribe({
        next: (assures) => {
          console.log('Assurés récupérés:', assures);
          this.disponiblesAssures = assures.map(assure => ({
            id: assure.id,
            name: assure.name,
            prenom: assure.prenom,
            useridKeycloak: assure.useridKeycloak,
            email: assure.email,
            userType: 'ASSURE'
          }));
          console.log('Assurés chargés:', this.disponiblesAssures);
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des assurés:', err);
        }
      });

      // Charger tous les garagistes
      this.reparateurService.getAllReparateurs().subscribe({
        next: (reparateurs) => {
          this.disponiblesGaragistes = reparateurs.map(reparateur => ({
            id: reparateur.id,
            name: reparateur.name,
            prenom: reparateur.prenom,
            useridKeycloak: reparateur.useridKeycloak,
            email: reparateur.email,
            nomDuGarage: reparateur.nomDuGarage,
            userType: 'GARAGISTE'
          }));
          console.log('Garagistes chargés:', this.disponiblesGaragistes);
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des garagistes:', err);
        },
        complete: () => {
          this.isLoadingModalData = false;
          this.isLoadingAllUsers = false;
          this.cdRef.detectChanges();
        }
      });

    } catch (error) {
      console.error('Erreur lors du chargement de tous les utilisateurs:', error);
      this.isLoadingModalData = false;
      this.isLoadingAllUsers = false;
      this.cdRef.detectChanges();
    }
  }


  // Optimiser loadAssuresFromMissions avec un timeout pour éviter les blocages
  private async loadAssuresFromMissions(): Promise<void> {
    try {
      // Vider la liste actuelle pour éviter les doublons
      this.disponiblesAssures = [];

      // Extraire les IDs uniques des sinistres
      const sinistreIds = [...new Set(
        this.missions
          .map(mission => mission.sinistre?.id)
          .filter(id => id !== undefined && id !== null)
      )];

      console.log('IDs des sinistres trouvés:', sinistreIds);

      if (sinistreIds.length === 0) {
        console.log('Aucun sinistre trouvé dans les missions');
        return;
      }

      // Limiter le nombre de requêtes simultanées pour éviter la surcharge
      const batchSize = 5;
      const batches = [];

      for (let i = 0; i < sinistreIds.length; i += batchSize) {
        batches.push(sinistreIds.slice(i, i + batchSize));
      }

      // Traiter les batches séquentiellement
      for (const batch of batches) {
        const assurePromises = batch.map(async (sinistreId) => {
          try {
            // Ajouter un timeout pour éviter les requêtes qui traînent
            return await Promise.race([
              this.assureService.getAssureBySinistreId(sinistreId).toPromise(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
              )
            ]);
          } catch (error) {
            console.error(`Erreur lors de la récupération de l'assuré pour le sinistre ${sinistreId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(assurePromises);

        // Traiter les résultats de ce batch
        const validAssures = batchResults
          .filter((assure): assure is any => assure !== null)
          .filter((assure, index, array) =>
            array.findIndex(a => a.useridKeycloak === assure.useridKeycloak) === index
          );

        // Ajouter à la liste existante
        const newAssures = validAssures.map(assure => ({
          id: assure.id,
          name: assure.name,
          prenom: assure.prenom,
          useridKeycloak: assure.useridKeycloak,
          email: assure.email,
        }));

        // Éviter les doublons avec la liste existante
        newAssures.forEach(newAssure => {
          if (!this.disponiblesAssures.find(existing =>
            existing.useridKeycloak === newAssure.useridKeycloak)) {
            this.disponiblesAssures.push(newAssure);
          }
        });

        // Mettre à jour l'affichage après chaque batch
        this.cdRef.detectChanges();

        // Petite pause entre les batches pour ne pas surcharger
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('Assurés chargés pour les conversations:', this.disponiblesAssures);

    } catch (error) {
      console.error('Erreur lors du chargement des assurés depuis les missions:', error);
    }
  }

  // Améliorer allAvailableUsers pour gérer l'état de chargement
  get allAvailableUsers() {
    const combined: any[] = [];

    if (this.isAdmin) {
      // Pour l'admin, inclure tous les types d'utilisateurs
      combined.push(...this.disponiblesAssures.map(assure => ({
        ...assure,
        userType: 'ASSURE',
        isFromMission: false
      })));

      combined.push(...this.disponiblesGaragistes.map(garagiste => ({
        ...garagiste,
        userType: 'GARAGISTE',
        isFromMission: false
      })));

      // Ajouter les conversations existantes (éviter les doublons)
      this.conversationUsers.forEach(user => {
        if (!combined.find(u => u.useridKeycloak === user.useridKeycloak)) {
          combined.push({
            ...user,
            userType: 'UNKNOWN',
            isFromMission: false
          });
        }
      });

    } else {
      // Pour le garagiste, garder la logique existante
      combined.push(...this.disponiblesAssures.map(assure => ({
        ...assure,
        userType: 'ASSURE',
        isFromMission: true
      })));

      this.conversationUsers.forEach(user => {
        if (!combined.find(u => u.useridKeycloak === user.useridKeycloak)) {
          combined.push({
            ...user,
            userType: this.isAssure ? 'GARAGISTE' : 'ASSURE',
            isFromMission: false
          });
        }
      });
    }

    return combined;
  }
  // Getter pour les utilisateurs groupés par type (pour l'admin)
  get usersByType() {
    if (!this.isAdmin) return {};

    return {
      assures: this.disponiblesAssures.filter(user =>
        !this.conversationUsers.find(conv => conv.useridKeycloak === user.useridKeycloak)
      ),
      garagistes: this.disponiblesGaragistes.filter(user =>
        !this.conversationUsers.find(conv => conv.useridKeycloak === user.useridKeycloak)
      ),
      conversations: this.conversationUsers
    };
  }
  startConversation(user: any): void {
    console.log('Démarrage de conversation avec :', user);

    this.selectUser(user.useridKeycloak);
    this.selectedUser = user;

    // Vérifier si l'utilisateur est déjà dans conversationUsers
    const existingUser = this.conversationUsers.find(u => u.useridKeycloak === user.useridKeycloak);

    if (!existingUser) {
      // Créer un objet Reparateur compatible si c'est un assuré
      const newConversationUser: Reparateur = {
        id: user.id || 0,
        name: user.name,
        prenom: user.prenom,
        useridKeycloak: user.useridKeycloak,
        email: user.email || '',
        telephone: '',
        adresse: '',
        codePostal: '',
        ville: '',
        commission: 0,
        siret: '',
        nomDuGarage: user.userType === 'ASSURE' ? 'Assuré' : '',
        servicePropose: [],
        missions: [],
        anneeExperience: 0,
        nombreVehiculeReparee: 0,
        nombreEmployes: 0,
        logo: '',
        imagesReparations: []
      };

      // Ajouter l'utilisateur à la liste des conversations
      this.conversationUsers.unshift(newConversationUser); // unshift pour mettre en haut
      console.log('Utilisateur ajouté à conversationUsers:', newConversationUser);
    }
    // Sur mobile, passer à la vue conversation
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.showConversationsList = false;
    }

    // Forcer la détection des changements
    this.cdRef.detectChanges();

    // Fermer le modal
    const modalElement = document.getElementById('userSelectorModal');
    if (modalElement) {
      const modal = Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Méthode pour gérer le redimensionnement de la fenêtre
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    const isMobile = event.target.innerWidth < 768;
    if (!isMobile) {
      // Sur desktop, toujours montrer les deux colonnes
      this.showConversationsList = true;
    }
  }

  private async initializeUserData(): Promise<void> {
    const token = this.authService.getToken();
    if (!token) return;

    this.senderId = this.authService.getKeycloakId() ?? '';
    this.isAssure = this.authService.getRoles().includes('ROLE_ASSURE');
    this.isGaragiste = this.authService.getRoles().includes('ROLE_GARAGISTE');
    this.isAdmin = this.authService.getRoles().includes('ROLE_ADMIN');

    if (this.isGaragiste) {
      const keycloakId = this.authService.getKeycloakId();
      if (!keycloakId) {
        console.error('Utilisateur non connecté, impossible de charger les missions');
        return;
      }
    }
    console.log('Utilisateur initialisé:', { senderId: this.senderId, isAssure: this.isAssure });
  }

  private setupMessageListener(): void {
    if (!this.senderId || !this.receiverId) {
      console.warn('SenderId ou ReceiverId manquant:', { senderId: this.senderId, receiverId: this.receiverId });
      return;
    }

    console.log('Configuration de l\'écoute des messages entre:', this.senderId, 'et', this.receiverId);

    this.messagesSub = this.messageService
      .listenToMessages(this.senderId, this.receiverId)
      .subscribe({
        next: (messages) => {
          console.log('Messages reçus:', messages.length);
          this.ngZone.run(() => {
            this.messages = messages;
            this.cdRef.detectChanges();
            this.scrollToBottom();
          });
        },
        error: (err) => {
          console.error('Erreur lors de la réception des messages:', err);
        }
      });
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() && this.receiverId) {
      try {
        console.log('Envoi du message:', {
          from: this.senderId,
          to: this.receiverId,
          message: this.newMessage.trim()
        });

        await this.messageService.sendMessage(
          this.senderId,
          this.receiverId,
          this.newMessage.trim()
        );

        this.newMessage = '';
        console.log('Message envoyé avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'envoi du message:', err);
      }
    } else {
      console.warn('Message vide ou pas de destinataire sélectionné');
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
    if (this.currentUserSub) {
      this.currentUserSub.unsubscribe();
    }
    // NOUVEAU : Nettoyer la subscription des nouvelles conversations
    if (this.conversationsSub) {
      this.conversationsSub.unsubscribe();
    }
  }
}