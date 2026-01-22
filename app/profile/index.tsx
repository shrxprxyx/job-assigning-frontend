import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api.service";

/* ---------------- TYPES ---------------- */

interface UserProfile {
  _id: string;
  name: string;
  phone: string;
  skills: string[];
  profileImage?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    text?: string;
  };
  availability?: string;
  currentMode: "employer" | "worker";
  rating?: {
    average: number;
    count: number;
  };
}

/**
 * This is the ONLY type used for rendering.
 * All fields optional → safe for `UserProfile | User`
 */
type DisplayUser = {
  name?: string;
  phone?: string;
  profileImage?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    text?: string;
  };
};

/* ---------------- SCREEN ---------------- */

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const response = await apiRequest<{ user: UserProfile }>("/users/profile");
      if (response.success && response.data?.user) {
        setProfile(response.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleToggleMode = async () => {
    if (!profile) return;

    setTogglingMode(true);
    const newMode = profile.currentMode === "employer" ? "worker" : "employer";

    try {
      const response = await apiRequest<{ user: UserProfile }>("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ currentMode: newMode }),
      });

      if (response.success && response.data?.user) {
        setProfile(response.data.user);
        updateUser(response.data.user as any);
        Alert.alert("Mode Changed", `You are now in ${newMode} mode`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to change mode");
    } finally {
      setTogglingMode(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F0FDF4] items-center justify-center">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  const displayProfile: DisplayUser | null = profile || user || null;

  return (
    <View className="flex-1 bg-[#F0FDF4]">
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* PROFILE HEADER */}
        <View className="items-center mb-6">
          <Image
            source={{
              uri:
                displayProfile?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayProfile?.name || "User"
                )}&background=166534&color=fff&size=150`,
            }}
            className="w-28 h-28 rounded-full mb-3"
          />

          <Text className="text-2xl font-bold text-[#14532D]">
            {displayProfile?.name || "User"}
          </Text>

          {/* MODE BADGE */}
          {profile?.currentMode && (
            <View
              className={`mt-2 px-4 py-1 rounded-full ${
                profile.currentMode === "employer"
                  ? "bg-blue-100"
                  : "bg-green-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  profile.currentMode === "employer"
                    ? "text-blue-700"
                    : "text-green-700"
                }`}
              >
                {profile.currentMode === "employer" ? "Employer" : "Worker"} Mode
              </Text>
            </View>
          )}
        </View>

        {/* PROFILE DETAILS */}
        <View className="bg-[#cff5de] rounded-3xl p-6 mb-4">
          <ProfileItem
            icon="phone"
            label="Phone"
            value={displayProfile?.phone || "Not set"}
          />

          <ProfileItem
            icon="map-marker"
            label="Location"
            value={profile?.location?.text || "Not set"}
          />
        </View>

        {/* EDIT PROFILE */}
        <TouchableOpacity
          onPress={() => router.push("/auth/user-details" as any)}
          className="bg-[#166534] py-4 rounded-full mb-4"
        >
          <Text className="text-center text-white font-bold">
            Edit Profile
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={handleLogout}
          className="border border-red-500 py-4 rounded-full mb-10"
        >
          <Text className="text-center text-red-500 font-bold">
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------- REUSABLE ITEM ---------------- */

function ProfileItem({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center mb-4">
      <FontAwesome
        name={icon}
        size={18}
        color="#166534"
        style={{ width: 26 }}
      />
      <View>
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-sm font-medium text-[#14532D]">
          {value}
        </Text>
      </View>
    </View>
  );
}
