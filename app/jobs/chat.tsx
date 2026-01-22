import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

interface ChatRoom {
  id: string;
  participants: string[];
  jobId: string;
}

export default function ChatScreen() {
  const { chatRoomId, jobTitle } = useLocalSearchParams<{
    chatRoomId: string;
    jobTitle?: string;
  }>();

  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!chatRoomId) return;

    const roomRef = doc(db, "chatRooms", chatRoomId);
    const messagesRef = collection(roomRef, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setMessages(list);
      setLoading(false);
    });

    return unsub;
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatRoomId) return;

    setSending(true);
    try {
      await addDoc(
        collection(db, "chatRooms", chatRoomId, "messages"),
        {
          senderId: (user as any)._id || user.id,
          text: newMessage.trim(),
          timestamp: serverTimestamp(),
        }
      );
      setNewMessage("");
    } catch (e) {
      console.error("Send message error:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F0FDF4]"
    >
      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={18} />
        </TouchableOpacity>
        <Text className="ml-3 font-bold text-lg">
          {jobTitle || "Chat"}
        </Text>
      </View>

      {/* MESSAGES */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View
              className={`p-3 m-2 rounded-xl max-w-[80%] ${
                item.senderId === ((user as any)?._id || user?.id)
                  ? "self-end bg-green-600"
                  : "self-start bg-white"
              }`}
            >
              <Text
                className={
                  item.senderId === ((user as any)?._id || user?.id)
                    ? "text-white"
                    : "text-black"
                }
              >
                {item.text}
              </Text>
            </View>
          )}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {/* INPUT */}
      <View className="flex-row p-3 bg-white">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          className="flex-1 bg-gray-100 px-4 py-2 rounded-full"
          placeholder="Type a message"
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sending}
          className="ml-2 bg-green-600 w-10 h-10 rounded-full items-center justify-center"
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <FontAwesome name="send" color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
