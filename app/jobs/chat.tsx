import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api.service";
import { useAuth } from "../../context/AuthContext";

type ChatRoom = {
  chatRoomId: string;
  job?: { title?: string };
  worker?: { name?: string };
  employer?: { name?: string };
  isUserWorker?: boolean;
  status?: string;
  acceptedAt?: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName?: string;
  message: string;
  timestamp?: string;
  read?: boolean;
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{ chatRoomId?: string | string[] }>();
  const paramChatRoomId = useMemo(() => {
    const raw = params?.chatRoomId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const openedWithIdRef = useRef<boolean>(!!paramChatRoomId);

  const { user } = useAuth();
  const myUserId = (user as any)?.id ?? (user as any)?._id;

  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(
    paramChatRoomId ?? null
  );

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  // If screen is opened with /jobs/chat?chatRoomId=xxxx, respect it
  useEffect(() => {
    if (paramChatRoomId) setActiveChatRoomId(paramChatRoomId);
  }, [paramChatRoomId]);

  const loadChatRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get("/chat");
      const body = (res as any)?.data ?? res;

      const rooms: ChatRoom[] =
        body?.data?.chatRooms ?? body?.chatRooms ?? [];

      setChatRooms(Array.isArray(rooms) ? rooms : []);
    } catch (e) {
      console.error("Load chat rooms failed", e);
      setChatRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/${roomId}/messages`);
      const body = (res as any)?.data ?? res;

      const msgs: ChatMessage[] =
        body?.data?.messages ?? body?.messages ?? [];

      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.error("Load messages failed", e);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // If no active room -> load rooms list
  useEffect(() => {
    if (!activeChatRoomId) {
      loadChatRooms();
    }
  }, [activeChatRoomId]);

  // If active room -> load messages
  useEffect(() => {
    if (!activeChatRoomId) return;
    loadMessages(activeChatRoomId);
  }, [activeChatRoomId]);

  const handleBack = () => {
    // If user came from FAB (no id initially), go back to rooms list
    if (!openedWithIdRef.current && activeChatRoomId) {
      setActiveChatRoomId(null);
      setMessages([]);
      setText("");
      return;
    }
    router.back();
  };

  const sendMessage = async () => {
    if (!activeChatRoomId) return;
    if (!text.trim()) return;

    setSending(true);
    try {
      await api.post(`/chat/${activeChatRoomId}/message`, {
        message: text,
      });
      setText("");
      await loadMessages(activeChatRoomId);
    } catch (e) {
      console.error("Send failed", e);
    } finally {
      setSending(false);
    }
  };

  // ------------ UI: Rooms List (when no chat selected) ------------
  if (!activeChatRoomId) {
    return (
      <View className="flex-1 bg-[#F0FDF4]">
        {/* HEADER */}
        <View className="flex-row items-center px-4 pt-12 pb-3 bg-white border-b">
          <TouchableOpacity onPress={handleBack}>
            <FontAwesome name="arrow-left" size={18} />
          </TouchableOpacity>
          <Text className="ml-3 font-bold text-lg">Chats</Text>
        </View>

        {roomsLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator />
          </View>
        ) : chatRooms.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-gray-600 text-center">
              No chats found yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={chatRooms}
            keyExtractor={(item) => item.chatRoomId}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const otherName = item.isUserWorker
                ? item.employer?.name
                : item.worker?.name;

              return (
                <TouchableOpacity
                  className="bg-white rounded-xl p-4 mb-3 border"
                  activeOpacity={0.8}
                  onPress={() => setActiveChatRoomId(item.chatRoomId)}
                >
                  <Text className="font-bold text-base">
                    {item.job?.title ?? "Job"}
                  </Text>
                  <Text className="text-gray-600 mt-1">
                    {otherName ? `With: ${otherName}` : "Open chat"}
                  </Text>
                  {item.status ? (
                    <Text className="text-gray-500 mt-1 text-xs">
                      Status: {item.status}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  // ------------ UI: Messages View (when room selected) ------------
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F0FDF4]"
    >
      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-12 pb-3 bg-white border-b">
        <TouchableOpacity onPress={handleBack}>
          <FontAwesome name="arrow-left" size={18} />
        </TouchableOpacity>
        <Text className="ml-3 font-bold text-lg">Chat</Text>
      </View>

      {/* MESSAGES */}
      {loadingMessages ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={{ paddingBottom: 80 }}
          data={messages}
          keyExtractor={(item) => (item?.id ? String(item.id) : String(item.timestamp))}
          renderItem={({ item }) => {
            const isMine = item.senderId === myUserId;

            return (
              <View
                className={`m-2 p-3 rounded-xl max-w-[75%] ${
                  isMine ? "self-end bg-green-600" : "self-start bg-white"
                }`}
              >
                <Text className={isMine ? "text-white" : "text-black"}>
                  {item.message}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* INPUT */}
      <View className="absolute bottom-0 w-full flex-row p-3 bg-white border-t">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type message"
          className="flex-1 bg-gray-100 px-4 py-2 rounded-full"
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sending}
          className="ml-2 bg-green-600 w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.8}
        >
          <FontAwesome name="send" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}