import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { MessageWithId } from '@/types';

function currentUserId() {
  if (!auth.currentUser) throw new Error('You need to be signed in.');
  return auth.currentUser.uid;
}

// Messages live in a subcollection so loading the chat list doesn't pull every message
function messagesCollection(conversationId: string) {
  return collection(db, 'Conversations', conversationId, 'messages');
}

// oldest first, so the newest message is at the bottom of the chat
function messagesQuery(conversationId: string) {
  return query(messagesCollection(conversationId), orderBy('timeSent', 'asc'));
}

function toMessage(snapshot: QueryDocumentSnapshot): MessageWithId {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return { ...data, id: snapshot.id, timeSent: data.timeSent.toDate() } as MessageWithId;
}

export async function getMessages(conversationId: string): Promise<MessageWithId[]> {
  const snapshot = await getDocs(messagesQuery(conversationId));
  return snapshot.docs.map(toMessage);
}

// Calls onMessages with the ordered list every time a message is added, edited, or deleted
export function subscribeToMessages(
  conversationId: string,
  onMessages: (messages: MessageWithId[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    messagesQuery(conversationId),
    (snapshot) => onMessages(snapshot.docs.map(toMessage)),
    onError,
  );
}

// Saves the message and the conversation's latest message preview in one batch,
// so the chat list never previews a message that failed to save.
export async function sendMessage(conversationId: string, text: string): Promise<void> {
  const senderId = currentUserId();
  const messageRef = doc(messagesCollection(conversationId));

  const batch = writeBatch(db);
  batch.set(messageRef, {
    conversationId,
    senderId,
    text,
    type: 'text',
    timeSent: serverTimestamp(),
  });
  batch.update(doc(db, 'Conversations', conversationId), {
    lastMessage: { id: messageRef.id, senderId, text, timeSent: serverTimestamp() },
  });
  await batch.commit();
}
