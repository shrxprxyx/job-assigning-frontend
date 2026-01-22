import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // No user → go to signup
    if (!user) {
      router.replace("/auth/SignUp" as any);
      return;
    }

    // User exists but profile incomplete
    if (!user.isProfileComplete) {
      router.replace("/auth/user-details" as any);
      return;
    }

    // User exists & profile complete
    router.replace("/jobs" as any);
  }, [user]);

  // Simple splash/loading screen
  return (
    <View className="flex-1 bg-bgmain items-center justify-center">
      <ActivityIndicator size="large" color="#FF7F50" />
    </View>
  );
}
