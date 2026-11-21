export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  messageId?: string;
  provider: string;
}

export interface IEmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
