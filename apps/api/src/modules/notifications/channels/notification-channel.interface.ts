export interface NotificationToSend {
  id: string;
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface NotificationRecipient {
  email?: string | null;
  phone?: string | null;
}

/**
 * Un canal par mécanisme d'envoi (ARCHITECTURE.md §12) — ajouter un canal (SMS, push)
 * ne touche jamais aux modules métier qui déclenchent des notifications, seulement
 * au resolver qui choisit l'implémentation.
 */
export interface NotificationChannel {
  readonly name: string;
  send(notification: NotificationToSend, recipient: NotificationRecipient): Promise<void>;
}
