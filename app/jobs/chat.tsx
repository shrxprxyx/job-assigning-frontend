import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api.service";

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

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 42 }: { name?: string; size?: number }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const sizeClass =
    size <= 28
      ? "w-7 h-7 rounded-full"
      : size <= 36
      ? "w-9 h-9 rounded-full"
      : size <= 42
      ? "w-[42px] h-[42px] rounded-full"
      : "w-12 h-12 rounded-full";

  const textClass =
    size <= 28 ? "text-[10px]" : size <= 36 ? "text-xs" : "text-sm";

  return (
    <View className={`${sizeClass} bg-emerald-100 items-center justify-center`}>
      <Text className={`${textClass} font-bold text-emerald-700 tracking-wide`}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <View className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      <Text className="text-[11px] font-semibold text-emerald-700">{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
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
  const sendScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (paramChatRoomId) setActiveChatRoomId(paramChatRoomId);
  }, [paramChatRoomId]);

  const loadChatRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get("/chat");
      const body = (res as any)?.data ?? res;
      const rooms: ChatRoom[] = body?.data?.chatRooms ?? body?.chatRooms ?? [];
      setChatRooms(Array.isArray(rooms) ? rooms : []);
    } catch {
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
      const msgs: ChatMessage[] = body?.data?.messages ?? body?.messages ?? [];
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeChatRoomId) loadChatRooms();
  }, [activeChatRoomId]);

  useEffect(() => {
    if (!activeChatRoomId) return;
    loadMessages(activeChatRoomId);
  }, [activeChatRoomId]);

  const handleBack = () => {
    if (!openedWithIdRef.current && activeChatRoomId) {
      setActiveChatRoomId(null);
      setMessages([]);
      setText("");
      return;
    }
    router.back();
  };

  const animateSend = () => {
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.82, useNativeDriver: true, speed: 40 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const sendMessage = async () => {
    if (!activeChatRoomId || !text.trim()) return;
    animateSend();
    setSending(true);
    try {
      await api.post(`/chat/${activeChatRoomId}/message`, { message: text });
      setText("");
      await loadMessages(activeChatRoomId);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error("Send failed", e);
    } finally {
      setSending(false);
    }
  };

  const activeRoom = chatRooms.find((r) => r.chatRoomId === activeChatRoomId);

  // ══════════════════════════════════════════════════════════════════
  //  ROOMS LIST
  // ══════════════════════════════════════════════════════════════════
  if (!activeChatRoomId) {
    return (
      <View className="flex-1 bg-stone-50">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pt-14 pb-4 bg-white border-b border-stone-100 shadow-sm">
          <TouchableOpacity
            onPress={handleBack}
            className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="arrow-left" size={14} color="#1c1917" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-stone-900 tracking-tight">
              Messages
            </Text>
            <Text className="text-xs text-stone-400 mt-0.5">
              {chatRooms.length > 0
                ? `${chatRooms.length} conversations`
                : "Your job conversations"}
            </Text>
          </View>
        </View>

        {roomsLoading ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator color="#059669" size="large" />
            <Text className="text-sm text-stone-400 mt-3">Loading chats…</Text>
          </View>
        ) : chatRooms.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <FontAwesome name="comments-o" size={36} color="#059669" />
            </View>
            <Text className="text-lg font-bold text-stone-800 tracking-tight mb-2">
              No conversations yet
            </Text>
            <Text className="text-sm text-stone-400 text-center leading-5">
              When you connect with employers or workers, your chats will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={chatRooms}
            keyExtractor={(item) => item.chatRoomId}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const otherName = item.isUserWorker
                ? item.employer?.name
                : item.worker?.name;

              return (
                <TouchableOpacity
                  className="flex-row items-center gap-3 bg-white rounded-2xl p-4 mb-3 border border-stone-100"
                  activeOpacity={0.72}
                  onPress={() => setActiveChatRoomId(item.chatRoomId)}
                >
                  <Avatar name={otherName} size={48} />
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text
                        className="flex-1 text-sm font-bold text-stone-900 tracking-tight"
                        numberOfLines={1}
                      >
                        {item.job?.title ?? "Job"}
                      </Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text className="text-[13px] text-stone-400" numberOfLines={1}>
                      {otherName ? `Chat with ${otherName}` : "Open conversation"}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={11} color="#d4d4c8" />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  MESSAGES VIEW
  // ══════════════════════════════════════════════════════════════════
  const otherName = activeRoom
    ? activeRoom.isUserWorker
      ? activeRoom.employer?.name
      : activeRoom.worker?.name
    : undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-stone-50"
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 pt-14 pb-4 bg-white border-b border-stone-100 shadow-sm">
        <TouchableOpacity
          onPress={handleBack}
          className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="arrow-left" size={14} color="#1c1917" />
        </TouchableOpacity>
        {otherName && <Avatar name={otherName} size={36} />}
        <View className="flex-1">
          <Text className="text-base font-bold text-stone-900 tracking-tight">
            {otherName ?? "Chat"}
          </Text>
          {activeRoom?.job?.title && (
            <Text className="text-xs text-stone-400 mt-0.5" numberOfLines={1}>
              {activeRoom.job.title}
            </Text>
          )}
        </View>
        {activeRoom?.status && <StatusBadge status={activeRoom.status} />}
      </View>

      {/* Messages */}
      {loadingMessages ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" size="large" />
          <Text className="text-sm text-stone-400 mt-3">Loading messages…</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) =>
            item?.id ? String(item.id) : String(item.timestamp)
          }
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: 14,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <Text className="text-sm text-stone-400">
                No messages yet. Say hello! 👋
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMine = item.senderId === myUserId;
            const prevItem = index > 0 ? messages[index - 1] : null;
            const showSender =
              !isMine &&
              item.senderName &&
              item.senderName !== prevItem?.senderName;

            return (
              <View
                className={`flex-row items-end mb-1 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar slot */}
                {!isMine && (
                  <View className="mr-1.5 mb-0.5">
                    {showSender || !prevItem ? (
                      <Avatar name={item.senderName ?? otherName} size={28} />
                    ) : (
                      <View className="w-7" />
                    )}
                  </View>
                )}

                <View
                  className={`max-w-[72%] ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {showSender && (
                    <Text className="text-[11px] font-semibold text-stone-400 mb-1 ml-1">
                      {item.senderName}
                    </Text>
                  )}
                  <View
                    className={`px-4 py-2.5 ${
                      isMine
                        ? "bg-emerald-700 rounded-[18px] rounded-br-[5px]"
                        : "bg-white border border-stone-100 rounded-[18px] rounded-bl-[5px]"
                    }`}
                  >
                    <Text
                      className={`text-sm leading-5 ${
                        isMine ? "text-white" : "text-stone-800"
                      }`}
                    >
                      {item.message}
                    </Text>
                  </View>
                  {item.timestamp && (
                    <Text className="text-[10px] text-stone-300 mt-1 mx-1">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-end gap-2.5 px-4 pt-3 bg-white border-t border-stone-100"
        style={{ paddingBottom: Platform.OS === "ios" ? 32 : 14 }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor="#b8b8b0"
          className="flex-1 bg-stone-100 rounded-full px-4 py-2.5 text-sm text-stone-900"
          style={{ maxHeight: 110, lineHeight: 20 }}
          multiline
          returnKeyType="default"
          onSubmitEditing={sendMessage}
        />
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending || !text.trim()}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              !text.trim() || sending ? "bg-stone-300" : "bg-emerald-700"
            }`}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="send" size={14} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}