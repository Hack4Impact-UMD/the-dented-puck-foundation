import { getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { auth } from '@/firebase';
import { editMessage, getMessages, sendMessage, subscribeToMessages } from './messageService';

jest.mock('@/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'user_1' } } }));

const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn() };
const mockTransaction = { get: jest.fn(), update: jest.fn() };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...path: string[]) => path.join('/')),
  // doc(collection) makes a new message id; doc(db, ...path) points at an existing doc
  doc: jest.fn((parent, ...path: string[]) =>
    path.length === 0 ? { id: 'msg_1', path: `${parent}/msg_1` } : { path: path.join('/') },
  ),
  serverTimestamp: jest.fn(() => 'server-time'),
  writeBatch: jest.fn(() => mockBatch),
  query: jest.fn((collectionPath, ...constraints) => ({ collectionPath, constraints })),
  orderBy: jest.fn((field, direction) => `orderBy ${field} ${direction}`),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn((_db, update) => update(mockTransaction)),
}));

const sentAt = new Date(2026, 10, 16, 19, 5);

function fakeMessageDoc(id: string, text: string) {
  return {
    id,
    data: jest.fn(() => ({ text, senderId: 'user_1', timeSent: { toDate: () => sentAt } })),
  };
}

const messagesQuery = {
  collectionPath: 'Conversations/conversation_401/messages',
  constraints: ['orderBy timeSent asc'],
};

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

describe('getMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the conversation\'s messages oldest first with ids and Dates', async () => {
    const firstDoc = fakeMessageDoc('msg_1', 'Practice Thursday');
    (getDocs as jest.Mock).mockResolvedValue({ docs: [firstDoc, fakeMessageDoc('msg_2', 'Got it')] });

    await expect(getMessages('conversation_401')).resolves.toEqual([
      { id: 'msg_1', text: 'Practice Thursday', senderId: 'user_1', timeSent: sentAt },
      { id: 'msg_2', text: 'Got it', senderId: 'user_1', timeSent: sentAt },
    ]);
    expect(getDocs).toHaveBeenCalledWith(messagesQuery);
    expect(firstDoc.data).toHaveBeenCalledWith({ serverTimestamps: 'estimate' });
  });
});

describe('subscribeToMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the ordered messages to the callback on every snapshot and returns unsubscribe', () => {
    const unsubscribe = jest.fn();
    (onSnapshot as jest.Mock).mockReturnValue(unsubscribe);
    const onMessages = jest.fn();

    expect(subscribeToMessages('conversation_401', onMessages, jest.fn())).toBe(unsubscribe);
    expect(onSnapshot).toHaveBeenCalledWith(messagesQuery, expect.any(Function), expect.any(Function));

    const onNext = (onSnapshot as jest.Mock).mock.calls[0][1];
    onNext({ docs: [fakeMessageDoc('msg_1', 'Practice Thursday')] });
    expect(onMessages).toHaveBeenLastCalledWith([
      { id: 'msg_1', text: 'Practice Thursday', senderId: 'user_1', timeSent: sentAt },
    ]);
  });

  it('passes listener errors to onError', () => {
    const onError = jest.fn();
    subscribeToMessages('conversation_401', jest.fn(), onError);

    const error = { code: 'permission-denied' };
    (onSnapshot as jest.Mock).mock.calls[0][2](error);
    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe('editMessage', () => {
  const messageRef = { path: 'Conversations/conversation_401/messages/msg_1' };
  const conversationRef = { path: 'Conversations/conversation_401' };

  // the transaction reads the message first, then the conversation
  function storedDocs(senderId: string, lastMessageId: string) {
    mockTransaction.get
      .mockResolvedValueOnce({ data: () => ({ senderId, text: 'Practice Thursday' }) })
      .mockResolvedValueOnce({ data: () => ({ lastMessage: { id: lastMessageId } }) });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'user_1' };
  });

  it('saves the new text with an edited time and updates the preview of the newest message', async () => {
    storedDocs('user_1', 'msg_1');
    await editMessage('conversation_401', 'msg_1', 'Practice Friday');

    expect(mockTransaction.update).toHaveBeenCalledWith(messageRef, {
      text: 'Practice Friday',
      editedAt: 'server-time',
    });
    expect(mockTransaction.update).toHaveBeenCalledWith(conversationRef, {
      'lastMessage.text': 'Practice Friday',
    });
  });

  it('leaves the preview alone when an older message is edited', async () => {
    storedDocs('user_1', 'msg_2');
    await editMessage('conversation_401', 'msg_1', 'Practice Friday');

    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    expect(mockTransaction.update).toHaveBeenCalledWith(messageRef, expect.anything());
  });

  it('rejects without writing when the message belongs to someone else', async () => {
    storedDocs('user_2', 'msg_1');

    await expect(editMessage('conversation_401', 'msg_1', 'Practice Friday')).rejects.toThrow(
      'You can only edit your own messages.',
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});
