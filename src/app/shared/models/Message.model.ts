// message.model.ts
export interface Message {
    id?: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp?: any; // Firestore timestamp
}
export interface UserConversation {
    name: string;
    prenom: string;
    useridKeycloak: string;
    email?: string;
}
