import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View, Platform } from "react-native";

type Props = {
  chatRoomId?: string; // optional: if you ever want to open a specific room directly
};

export default function ChatFab({ chatRoomId }: Props) {
  const onPress = () => {
    // If chatRoomId is provided, it will open that chat directly.
    // Otherwise, it opens the chats list screen.
    if (chatRoomId) {
      router.push({
        pathname: "/jobs/chat",
        params: { chatRoomId },
      } as any);
    } else {
      router.push("/jobs/chat");
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: 20,
        bottom: Platform.OS === "ios" ? 110 : 90,
        zIndex: 100,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#22c55e",
          justifyContent: "center",
          alignItems: "center",
          elevation: 6,
        }}
        activeOpacity={0.8}
      >
        <FontAwesome name="comments" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}