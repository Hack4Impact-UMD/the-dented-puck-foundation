import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FirestoreError } from 'firebase/firestore';
import {
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
  subscribeToMessages,
} from '@/services/messageService';

// Loads a chat's messages oldest first and keeps them up to date while the screen is open
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const [listenerError, setListenerError] = useState<FirestoreError | null>(null);

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    // the listener below keeps the cache current
    staleTime: Infinity,
  });

  // every change Firestore reports replaces the cached list
  useEffect(
    () =>
      subscribeToMessages(
        conversationId,
        (messages) => queryClient.setQueryData(['messages', conversationId], messages),
        setListenerError,
      ),
    [conversationId, queryClient],
  );

  return {
    messages: query.data ?? [],
    isPending: query.isPending,
    error: query.error ?? listenerError,
  };
}

// Hooks for sending, editing, and deleting messages

export function useSendMessage(conversationId: string) {
  return useMutation({
    mutationFn: (text: string) => sendMessage(conversationId, text),
  });
}

export function useEditMessage(conversationId: string) {
  return useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      editMessage(conversationId, messageId, text),
  });
}

export function useDeleteMessage(conversationId: string) {
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(conversationId, messageId),
  });
}
