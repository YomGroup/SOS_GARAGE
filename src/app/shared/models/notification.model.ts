export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  type: NotificationType;
  message: string;
  time: Date;
} 