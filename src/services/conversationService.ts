import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { MessageRowConversation } from "@/components/chats/MessageRow";
import {
  getShortUserInfo,
  getTeamsUserIds,
  isUserStaff,
} from "@/services/teamService";
import type {
  Channel,
  ConversationType,
  ConversationWithId,
  MessageWithId,
  UserChannels,
} from "@/types";

// Fetch the user's conversations of a given type for a team.
export async function fetchConversationsForUserAndTeam(
  userId: string,
  teamId: string,
  type: ConversationType,
): Promise<ConversationWithId[]> {
  const snapshot = await getDocs(collection(db, "Conversation"));

  return snapshot.docs.flatMap((conversationSnapshot) => {
    const conversation = conversationSnapshot.data();
    // The app stores participant IDs as strings, but Firestore stores them as numbers.
    const participantIds = conversation.participantIds.map((id: number) =>
      id.toString(),
    );

    if (
      conversation.teamId.toString() !== teamId ||
      conversation.type !== type ||
      !participantIds.includes(userId)
    ) {
      return [];
    }

    return [
      {
        id: conversation.conversationId.toString(),
        teamId: conversation.teamId.toString(),
        type: conversation.type,
        participantIds,
      },
    ];
  });
}

// Build chat-list rows from conversations and their latest message activity.
export async function convertConvListToMessageRowConvList(
  conversations: ConversationWithId[],
): Promise<MessageRowConversation[]> {
  const rows = await Promise.all(
    conversations.map(async (conversation) => {
      // Messages are nested under the Firestore document, whose ID has a prefix.
      const messagesRef = collection(
        db,
        "Conversation",
        `conversation_${conversation.id}`,
        "messages",
      );
      // Fetch each participant's profile and newest message concurrently.
      const participants = await Promise.all(
        conversation.participantIds.map(async (participantId) => {
          const [userInfo, messagesSnapshot] = await Promise.all([
            getShortUserInfo(participantId),
            getDocs(
              query(
                messagesRef,
                where("senderId", "==", Number(participantId)),
                orderBy("timeSent", "desc"),
                limit(1),
              ),
            ),
          ]);
          const latestMessage = messagesSnapshot.docs[0]?.data();

          return {
            userInfo,
            latestMessage,
            updatedAt: latestMessage?.timeSent.toMillis() ?? 0,
          };
        }),
      );

      // The newest participant message supplies the preview and conversation time.
      const mostRecentMessage = participants
        .filter((participant) => participant.latestMessage)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];

      // Active participants sort by latest message; inactive ones sort by username.
      const orderedParticipants = [...participants].sort((a, b) => {
        if (a.latestMessage && b.latestMessage) {
          return (
            b.updatedAt - a.updatedAt ||
            a.userInfo.username.localeCompare(b.userInfo.username)
          );
        }
        if (a.latestMessage) return -1;
        if (b.latestMessage) return 1;
        return a.userInfo.username.localeCompare(b.userInfo.username);
      });

      return {
        id: conversation.id,
        participants: orderedParticipants.map(
          (participant) => participant.userInfo.username,
        ),
        isStaff: mostRecentMessage
          ? isUserStaff(mostRecentMessage.userInfo)
          : false,
        lastMessage: mostRecentMessage?.latestMessage.text ?? "",
        updatedAt: mostRecentMessage?.updatedAt ?? 0,
        unread: Math.floor(Math.random() * 3),
      };
    }),
  );

  // Show the most recently active conversations first.
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

// Create a team conversation for the requested participant set.
export async function createConversation(
  teamId: string,
  participantIds: string[],
  type: ConversationType,
): Promise<ConversationWithId> {
  const teamMemberIds = await getTeamsUserIds(teamId);
  const teamMemberIdStrings = teamMemberIds.map((id) => id.toString());
  const invalidParticipant = (
    await Promise.all(
      participantIds.map(async (participantId) => {
        if (teamMemberIdStrings.includes(participantId)) {
          return null;
        }

        if (type === "group") {
          const participant = await getShortUserInfo(participantId);
          return participant.role === "contact" ? null : participantId;
        }

        return participantId;
      }),
    )
  ).find((participantId) => participantId !== null);

  // Verify that every participant is allowed for this conversation type.
  if (invalidParticipant) {
    throw new Error(
      type === "group"
        ? `User ${invalidParticipant} is not an active team member or contact for team ${teamId}.`
        : `User ${invalidParticipant} is not an active member of team ${teamId}.`,
    );
  }

  const snapshot = await getDocs(collection(db, "Conversation"));
  // Get the most recent message
  const largestConversationId = snapshot.docs.reduce((largest, document) => {
    const conversationId = Number(document.data().conversationId);
    return Number.isFinite(conversationId)
      ? Math.max(largest, conversationId)
      : largest;
  }, 0);
  const conversationId = (largestConversationId - 1).toString();

  const conversation: ConversationWithId = {
    id: conversationId,
    teamId,
    type,
    participantIds,
  };
  await setDoc(doc(db, "Conversation", `conversation_${conversationId}`), {
    conversationId,
    teamId,
    participantIds,
    type,
  });

  return conversation;
}

// Separate the user's admin and team group channels.
export async function categorizeChannels(
  conversations: ConversationWithId[],
  userId: string,
): Promise<UserChannels> {
  if (
    conversations.length > 2 ||
    conversations.some((conversation) => conversation.type !== "group")
  ) {
    throw new Error(
      "Channels must contain no more than two group conversations.",
    );
  }

  let adminChannel: ConversationWithId | null = null;

  for (const conversation of conversations) {
    if (!conversation.participantIds.includes(userId)) {
      continue;
    }

    const participantProfiles = await Promise.all(
      conversation.participantIds
        .filter((participantId) => participantId !== userId)
        .map((participantId) => getShortUserInfo(participantId)),
    );

    if (participantProfiles.every((profile) => !isUserStaff(profile))) {
      adminChannel = conversation;
      break;
    }
  }

  const teamChannel =
    conversations.find((conversation) => conversation !== adminChannel) ?? null;

  return {
    adminChannel,
    teamChannel,
  };
}

// Fetch the latest message and normalize Firestore's timestamp and sender ID.
async function fetchLatestConversationMessage(
  conversationId: string,
): Promise<MessageWithId | null> {
  const messagesSnapshot = await getDocs(
    query(
      collection(
        db,
        "Conversation",
        `conversation_${conversationId}`,
        "messages",
      ),
      orderBy("timeSent", "desc"),
      limit(1),
    ),
  );
  const latestMessage = messagesSnapshot.docs[0];
  if (!latestMessage) {
    return null;
  }

  const data = latestMessage.data();
  return {
    id: latestMessage.id,
    senderId: data.senderId.toString(),
    text: data.text,
    timeSent: data.timeSent.toDate(),
  };
}

// Convert the user's admin and team conversations into channel cards.
export async function convertUserChannelsToChannels(
  userChannels: UserChannels,
): Promise<Channel[]> {
  const channelEntries = [
    { id: "admins", conversation: userChannels.adminChannel },
    { id: "team", conversation: userChannels.teamChannel },
  ].filter(
    (
      entry,
    ): entry is {
      id: "admins" | "team";
      conversation: ConversationWithId;
    } => entry.conversation !== null,
  );

  return Promise.all(
    channelEntries.map(async ({ id, conversation }) => {
      const latestMessage = await fetchLatestConversationMessage(
        conversation.id,
      );
      const lastSender = latestMessage
        ? await getShortUserInfo(latestMessage.senderId)
        : null;
      const name = id[0].toUpperCase() + id.slice(1);

      return {
        id,
        name,
        lastSender: lastSender?.username ?? "",
        lastMessage: latestMessage?.text ?? "",
        updatedAt: latestMessage?.timeSent.getTime() ?? 0,
        unread: Math.floor(Math.random() * 3),
      };
    }),
  );
}
