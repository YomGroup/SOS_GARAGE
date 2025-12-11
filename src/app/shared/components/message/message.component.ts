import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { ReparateurService } from '../../../../services/reparateur.service';
import { AssureService } from '../../../../services/assure.service';
import { BackendMessagingService, EnhancedChat, ChatMessage, ChatUser } from '../../../../services/backend-messaging.service';
import { Assure, Reparateur } from '../../../../services/models-api.interface';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage = '';
  
  // User IDs
  currentUserDbId: number = 0;
  currentUserKeycloakId: string = '';
  selectedUserId: number = 0;
  currentChatId: number = 0;
  
  // User roles
  isAssure: boolean = false;
  isGaragiste: boolean = false;
  isAdmin: boolean = false;
  
  // UI State
  selectedUser?: ChatUser;
  conversationUsers: ChatUser[] = [];
  showConversationsList: boolean = true;
  isLoading: boolean = false;
  isLoadingMessages: boolean = false;
  connectionStatus: boolean = false;
  
  // Unread counts
  unreadMessagesByUser = new Map<number, number>();
  totalUnreadCount: number = 0;

  private subscriptions: Subscription[] = [];
  private typingTimeout: any;

  constructor(
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private reparateurService: ReparateurService,
    private assureService: AssureService,
    private messagingService: BackendMessagingService,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 MessageComponent initialized');
    
    await this.initializeUser();
    
    if (this.currentUserDbId) {
      await this.connectWebSocket();
      await this.loadChats();
      this.setupMessageListeners();
    } else {
      console.warn('⚠️ User not found in database, cannot load chats');
    }
    
    // Handle route params
    this.route.queryParams.subscribe(params => {
      const targetUserId = params['receiverId'];
      if (targetUserId) {
        this.selectUserById(parseInt(targetUserId));
      }
    });
  }

  ngOnDestroy(): void {
    console.log('🛑 MessageComponent destroyed');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.messagingService.disconnect();
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  // ==================== Initialization ====================

  private async initializeUser(): Promise<void> {
    try {
      this.currentUserKeycloakId = this.authService.getKeycloakId() || '';
      const roles = this.authService.getRoles();
      
      // Check roles
      this.isAssure = roles.some(r => r.toLowerCase().includes('assure'));
      this.isGaragiste = roles.some(r => r.toLowerCase().includes('garagiste') || r.toLowerCase().includes('garage'));
      this.isAdmin = roles.some(r => r.toLowerCase().includes('admin'));

      console.log('👤 User roles:', { isAssure: this.isAssure, isGaragiste: this.isGaragiste, isAdmin: this.isAdmin });

      // Get database ID based on role
      if (this.isAssure && this.currentUserKeycloakId) {
        try {
          const assure = await firstValueFrom(this.assureService.getAssurerID(this.currentUserKeycloakId)) as Assure;
          this.currentUserDbId = assure?.id || 0;
          console.log('✅ Assure found:', { id: this.currentUserDbId, name: assure.name });
        } catch (e) {
          console.warn('❌ Could not get assure:', e);
        }
      }
      
      if (this.isGaragiste && this.currentUserKeycloakId) {
        try {
          const reparateur = await firstValueFrom(this.reparateurService.getReparateurByKeycloakId(this.currentUserKeycloakId));
          this.currentUserDbId = reparateur?.id || 0;
          console.log('✅ Reparateur found:', { id: this.currentUserDbId, name: reparateur.name });
        } catch (e) {
          console.warn('❌ Could not get reparateur:', e);
        }
      }
      
      if (this.isAdmin && this.currentUserKeycloakId) {
        // Try as reparateur first
        try {
          const reparateur = await firstValueFrom(this.reparateurService.getReparateurByKeycloakId(this.currentUserKeycloakId));
          if (reparateur?.id) {
            this.currentUserDbId = reparateur.id;
            console.log('✅ Admin as reparateur:', reparateur);
          }
        } catch (e) {
          // Try as assure
          try {
            const assure = await firstValueFrom(this.assureService.getAssurerID(this.currentUserKeycloakId)) as Assure;
            if (assure?.id) {
              this.currentUserDbId = assure.id;
              console.log('✅ Admin as assure:', assure);
            }
          } catch (e2) {
            console.warn('⚠️ Admin not found in DB');
          }
        }
      }

      console.log('✅ User initialized:', { 
        keycloakId: this.currentUserKeycloakId, 
        dbId: this.currentUserDbId
      });
    } catch (error) {
      console.error('❌ Error initializing user:', error);
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.currentUserDbId) {
      console.warn('⚠️ Cannot connect WebSocket: No user ID');
      return;
    }

    try {
      console.log('🔌 Connecting to WebSocket...');
      await this.messagingService.connect(this.currentUserDbId);
      console.log('✅ WebSocket connected');
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
    }

    // Subscribe to connection status
    const statusSub = this.messagingService.connectionStatus$.subscribe(status => {
      this.ngZone.run(() => {
        this.connectionStatus = status;
        console.log('🔌 Connection status:', status ? 'Connected' : 'Disconnected');
        this.cdRef.detectChanges();
      });
    });
    this.subscriptions.push(statusSub);
  }

  private setupMessageListeners(): void {
    // Listen to new messages
    const messageSub = this.messagingService.newMessage$.subscribe(message => {
      this.ngZone.run(() => {
        console.log('📨 New message received:', message);
        
        // If message is for current chat, add it
        if (message.chatId === this.currentChatId) {
          this.messages.push(message);
          this.scrollToBottom();
        } else {
          // Update unread count for other chat
          const currentCount = this.unreadMessagesByUser.get(message.senderId) || 0;
          this.unreadMessagesByUser.set(message.senderId, currentCount + 1);
          this.totalUnreadCount++;
        }
        
        this.cdRef.detectChanges();
      });
    });
    this.subscriptions.push(messageSub);
  }

  // ==================== Load Chats ====================

  async loadChats(): Promise<void> {
    if (!this.currentUserDbId) {
      console.warn('⚠️ Cannot load chats: No user ID');
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log('📋 Loading chats for user:', this.currentUserDbId);
      const chats = await firstValueFrom(this.messagingService.getEnhancedChats(this.currentUserDbId));
      console.log('✅ Chats loaded:', chats.length);
      
      // Convert to ChatUser format
      this.conversationUsers = await Promise.all(chats.map(async (chat) => {
        const otherUserId = chat.senderId === this.currentUserDbId ? chat.receiverId : chat.senderId;
        const userInfo = await this.getUserInfo(otherUserId);
        
        this.unreadMessagesByUser.set(otherUserId, chat.unreadCount);
        
        return {
          id: otherUserId,
          chatId: chat.id,
          name: userInfo?.name || chat.name || 'Utilisateur',
          prenom: userInfo?.prenom || '',
          email: userInfo?.email || '',
          isOnline: chat.isRecipientOnline,
          unreadCount: chat.unreadCount,
          lastMessage: chat.lastMessage || '',
          lastMessageTime: chat.lastMessageTime || ''
        } as ChatUser & { chatId: number };
      }));

      // Calculate total unread
      this.totalUnreadCount = Array.from(this.unreadMessagesByUser.values()).reduce((a, b) => a + b, 0);
      console.log('📊 Total unread:', this.totalUnreadCount);
      
      this.cdRef.detectChanges();
    } catch (error) {
      console.error('❌ Error loading chats:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async getUserInfo(userId: number): Promise<{ name: string; prenom: string; email: string } | null> {
    try {
      // Try to get as assure first
      const assures = await firstValueFrom(this.assureService.getAllAssures());
      const assureList = Array.isArray(assures) ? assures : (assures as any).content || [];
      const assure = assureList.find((a: Assure) => a.id === userId);
      if (assure) {
        return { name: assure.name || '', prenom: assure.prenom || '', email: assure.email || '' };
      }
      
      // Try as reparateur
      const reparateur = await firstValueFrom(this.reparateurService.getReparateur(userId));
      if (reparateur) {
        return { 
          name: reparateur.nomDuGarage || reparateur.name || '', 
          prenom: reparateur.prenom || '', 
          email: reparateur.email || '' 
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not get user info for:', userId);
    }
    return null;
  }

  // ==================== Select User / Chat ====================

  async selectUser(user: ChatUser & { chatId?: number }): Promise<void> {
    console.log('👤 Selecting user:', user);
    
    this.selectedUser = user;
    this.selectedUserId = user.id;
    this.showConversationsList = false;
    this.isLoadingMessages = true;
    
    try {
      // Get or create chat
      if (user.chatId) {
        this.currentChatId = user.chatId;
      } else {
        const result = await firstValueFrom(
          this.messagingService.getOrCreateChat(this.currentUserDbId, user.id)
        );
        
        if (result.chatId) {
          this.currentChatId = result.chatId;
        } else if (result.canChat) {
          // Create new chat
          const newChatId = await firstValueFrom(
            this.messagingService.createChat(this.currentUserDbId, user.id)
          );
          this.currentChatId = newChatId;
        } else {
          console.error('❌ Cannot create chat between users');
          this.currentChatId = 0;
        }
      }

      if (this.currentChatId) {
        console.log('💬 Loading messages for chat:', this.currentChatId);
        
        // Load messages
        const messages = await firstValueFrom(this.messagingService.getChatMessages(this.currentChatId));
        this.messages = messages || [];
        console.log('✅ Messages loaded:', this.messages.length);
        
        // Mark as read (API REST)
        await firstValueFrom(this.messagingService.markMessagesAsRead(this.currentChatId, this.currentUserDbId));
        
        // Send WebSocket read receipt
        this.messagingService.sendReadReceipt(this.currentChatId, this.currentUserDbId, user.id);
        
        // Update unread count
        this.unreadMessagesByUser.set(user.id, 0);
        this.totalUnreadCount = Array.from(this.unreadMessagesByUser.values()).reduce((a, b) => a + b, 0);
        
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('❌ Error selecting user:', error);
      this.messages = [];
    } finally {
      this.isLoadingMessages = false;
      this.cdRef.detectChanges();
    }
  }

  async selectUserById(userId: number): Promise<void> {
    const user = this.conversationUsers.find(u => u.id === userId);
    if (user) {
      await this.selectUser(user as ChatUser & { chatId?: number });
    }
  }

  // ==================== Send Message ====================

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.currentChatId || !this.selectedUserId) {
      console.warn('⚠️ Cannot send: missing data');
      return;
    }

    const messageContent = this.newMessage.trim();
    this.newMessage = '';

    console.log('📤 Sending message:', messageContent);

    // Optimistic UI update
    const tempMessage: ChatMessage = {
      content: messageContent,
      senderId: this.currentUserDbId,
      receiverId: this.selectedUserId,
      chatId: this.currentChatId,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      status: 'SENDING'
    };
    this.messages.push(tempMessage);
    this.scrollToBottom();
    this.cdRef.detectChanges();

    // Send via WebSocket
    const sent = this.messagingService.sendMessage({
      content: messageContent,
      senderId: this.currentUserDbId,
      receiverId: this.selectedUserId,
      chatId: this.currentChatId,
      type: 'TEXT'
    });

    if (!sent) {
      console.error('❌ Failed to send message');
      // Remove optimistic message
      this.messages = this.messages.filter(m => m !== tempMessage);
      this.cdRef.detectChanges();
    }
  }

  // ==================== Typing Indicator ====================

  onMessageInput(): void {
    if (!this.currentChatId || !this.selectedUserId) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing indicator
    this.messagingService.sendTypingIndicator(
      this.currentUserDbId,
      this.selectedUserId,
      this.currentChatId,
      true
    );

    // Auto-stop typing after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.messagingService.sendTypingIndicator(
        this.currentUserDbId,
        this.selectedUserId,
        this.currentChatId,
        false
      );
    }, 3000);
  }

  // ==================== UI Helpers ====================

  getInitials(user: ChatUser | undefined): string {
    if (!user) return '??';
    const name = user.name || '';
    const prenom = user.prenom || '';
    const firstInitial = name.length > 0 ? name.charAt(0) : '';
    const secondInitial = prenom.length > 0 ? prenom.charAt(0) : '';
    return (firstInitial + secondInitial).toUpperCase() || '??';
  }

  getDisplayName(user: ChatUser | undefined): string {
    if (!user) return 'Utilisateur';
    const name = user.name || '';
    const prenom = user.prenom || '';
    return `${name} ${prenom}`.trim() || 'Utilisateur';
  }

  getUnreadCount(userId: number): number {
    return this.unreadMessagesByUser.get(userId) || 0;
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserDbId;
  }

  formatMessageTime(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatLastMessageTime(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Hier';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      return '';
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  backToList(): void {
    this.showConversationsList = true;
    this.selectedUser = undefined;
    this.messages = [];
    this.currentChatId = 0;
  }

  @HostListener('window:resize')
  onResize(): void {
    // Handle responsive behavior
  }

  trackByMessageId(index: number, message: ChatMessage): number | string {
    return message.id || index;
  }

  trackByUserId(index: number, user: ChatUser): number {
    return user.id;
  }
}