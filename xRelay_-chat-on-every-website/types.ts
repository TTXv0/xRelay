
export enum SenderType {
  USER = 'USER',
  BOT = 'BOT',
  IRC_USER = 'IRC_USER',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  senderType: SenderType;
  timestamp: string;
}
