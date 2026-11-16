import { writeBatch } from 'firebase/firestore';
import { auth } from '@/firebase';
import { sendMessage } from './messageService';

jest.mock('@/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'user_1' } } }));

const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn() };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...path: string[]) => path.join('/')),
  // doc(collection) makes a new message id; doc(db, ...path) points at an existing doc
  doc: jest.fn((parent, ...path: string[]) =>
    path.length === 0 ? { id: 'msg_1', path: `${parent}/msg_1` } : { path: path.join('/') },
  ),
  serverTimestamp: jest.fn(() => 'server-time'),
  writeBatch: jest.fn(() => mockBatch),
}));

describe('sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'user_1' };
  });

  it('stores the message with its sender, conversation, type and send time', async () => {
    await sendMessage('conversation_401', 'See you at practice');

    expect(mockBatch.set).toHaveBeenCalledWith(
      { id: 'msg_1', path: 'Conversations/conversation_401/messages/msg_1' },
      {
        conversationId: 'conversation_401',
        senderId: 'user_1',
        text: 'See you at practice',
        type: 'text',
        timeSent: 'server-time',
      },
    );
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('updates the conversation preview in the same batch', async () => {
    await sendMessage('conversation_401', 'See you at practice');

    expect(writeBatch).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).toHaveBeenCalledWith(
      { path: 'Conversations/conversation_401' },
      {
        lastMessage: {
          id: 'msg_1',
          senderId: 'user_1',
          text: 'See you at practice',
          timeSent: 'server-time',
        },
      },
    );
  });

  it('rejects without writing when no one is signed in', async () => {
    (auth as { currentUser: { uid: string } | null }).currentUser = null;

    await expect(sendMessage('conversation_401', 'Hi')).rejects.toThrow('You need to be signed in.');
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
