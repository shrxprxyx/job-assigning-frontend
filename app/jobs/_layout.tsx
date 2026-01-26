import { Slot, usePathname } from "expo-router";
import ChatFab from "./components/ChatFab";
import { View } from "react-native";

export default function JobsLayout() {
  const path = usePathname();
  const hideFab = path.includes("/chat");

  return (
    <View className="flex-1">
      <Slot />
      {!hideFab && <ChatFab />}
    </View>
  );
}
