export type Role = "global-admin" | "super-admin" | "team-staff" | "player" | "contact";
export type Status = "inactive" | "active" | "suspended";
export type ConversationType = "group" | "dm";

  


export interface User {
  role: Role;
  username: string;
  region: string;
  age: number;
  email: string;
  phoneNumber: string;  
  linkedPlayerId?: string; //for contacts
}

export interface Team {
  region: string;
  name: string;
  supervisorId: string;
  status: Status;
  wins: number;
  losses: number;       
}

export interface UserToTeam {
  userId: string;
  teamId: string;
  status: Status;
}

export interface Event {
  region: string;
  teamIds: string[];
  title: string;
  startTime: Date; 
  endTime: Date;
  location: string;
  result?: string;
}

export interface Conversation {
  teamId?: string;
  type: ConversationType;
  participantIds: string[];
}

export interface Message {
  text: string;
  senderId: string;
  recipientId?: string;
  timeSent: Date;
}

// FRONTEND MODELS WITH FIRESTORE IDs

export interface UserWithId extends User {
  id: string;
}

export interface TeamWithId extends Team {
  id: string;
}

export interface UserToTeamWithId extends UserToTeam {
  id: string;
}

export interface EventWithId extends Event {
  id: string;
}

export interface ConversationWithId extends Conversation {
  id: string;
}

export interface MessageWithId extends Message {
  id: string;
}