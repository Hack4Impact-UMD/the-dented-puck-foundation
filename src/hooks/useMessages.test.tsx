import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
  subscribeToMessages,
} from '@/services/messageService';
import { useDeleteMessage, useEditMessage, useMessages, useSendMessage } from './useMessages';

jest.mock('@/services/messageService', () => ({
  getMessages: jest.fn(),
  subscribeToMessages: jest.fn(),
  sendMessage: jest.fn(),
  editMessage: jest.fn(),
  deleteMessage: jest.fn(),
}));

const firstMessage = { id: 'msg_1', text: 'Practice Thursday', senderId: 'user_1' };
const secondMessage = { id: 'msg_2', text: 'Got it', senderId: 'user_2' };

// One client per test. gcTime: Infinity turns off TanStack's cleanup timers so Jest can exit.
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// the callbacks useMessages handed to subscribeToMessages
function listener() {
  const [, onMessages, onError] = (subscribeToMessages as jest.Mock).mock.calls[0];
  return { onMessages, onError };
}

describe('useMessages', () => {
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getMessages as jest.Mock).mockResolvedValue([firstMessage]);
    (subscribeToMessages as jest.Mock).mockReturnValue(unsubscribe);
  });

  it('loads the conversation\'s messages', async () => {
    const { result } = await renderHook(() => useMessages('conversation_401'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.messages).toEqual([firstMessage]));
    expect(result.current.isPending).toBe(false);
    expect(getMessages).toHaveBeenCalledWith('conversation_401');
  });

  it('shows new messages from the listener without refetching', async () => {
    const { result } = await renderHook(() => useMessages('conversation_401'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.messages).toEqual([firstMessage]));

    await act(async () => listener().onMessages([firstMessage, secondMessage]));

    // TanStack batches cache updates on a short timer, so wait for the re-render
    await waitFor(() => expect(result.current.messages).toEqual([firstMessage, secondMessage]));
    expect(getMessages).toHaveBeenCalledTimes(1);
  });

  it('returns listener errors', async () => {
    const { result } = await renderHook(() => useMessages('conversation_401'), { wrapper: createWrapper() });

    const error = { code: 'permission-denied' };
    await act(async () => listener().onError(error));

    expect(result.current.error).toBe(error);
  });

  it('stops listening when the screen closes', async () => {
    const { unmount } = await renderHook(() => useMessages('conversation_401'), { wrapper: createWrapper() });

    await unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('message mutations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends text to the conversation', async () => {
    const { result } = await renderHook(() => useSendMessage('conversation_401'), { wrapper: createWrapper() });

    await act(() => result.current.mutateAsync('See you there'));

    expect(sendMessage).toHaveBeenCalledWith('conversation_401', 'See you there');
  });

  it('edits a message in the conversation', async () => {
    const { result } = await renderHook(() => useEditMessage('conversation_401'), { wrapper: createWrapper() });

    await act(() => result.current.mutateAsync({ messageId: 'msg_1', text: 'Practice Friday' }));

    expect(editMessage).toHaveBeenCalledWith('conversation_401', 'msg_1', 'Practice Friday');
  });

  it('deletes a message in the conversation', async () => {
    const { result } = await renderHook(() => useDeleteMessage('conversation_401'), { wrapper: createWrapper() });

    await act(() => result.current.mutateAsync('msg_1'));

    expect(deleteMessage).toHaveBeenCalledWith('conversation_401', 'msg_1');
  });

  it('exposes the error when saving fails', async () => {
    const error = new Error('You can only edit your own messages.');
    (editMessage as jest.Mock).mockRejectedValue(error);
    const { result } = await renderHook(() => useEditMessage('conversation_401'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ messageId: 'msg_1', text: 'Practice Friday' });
    });

    await waitFor(() => expect(result.current.error).toBe(error));
  });
});
