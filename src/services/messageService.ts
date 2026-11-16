import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/firebase';

function currentUserId() {
  if (!auth.currentUser) throw new Error('You need to be signed in.');
  return auth.currentUser.uid;
}

// Messages live in a subcollection so loading the chat list doesn't pull every message
function messagesCollection(conversationId: string) {
  return collection(db, 'Conversations', conversationId, 'messages');
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
