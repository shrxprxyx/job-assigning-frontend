import { FontAwesome } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api.service";

/* ================= TYPES ================= */

interface UserProfile {
  id: string;
  firebaseUid: string;
  phone: string;
  name?: string;
  age?: number;
  gender?: string;
  profileImage?: string;
  skills?: string[];
  currentMode: "employer" | "worker";
  availability?: { isAvailable: boolean; schedule?: string };
  location?: { type: string; coordinates: [number, number]; text?: string };
  rating?: { average: number; count: number };
  isProfileComplete?: boolean;
  status?: string;
}

/* ================= SCREEN ================= */

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

  /* ---------- FETCH ---------- */
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

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  /* ---------- TOGGLE MODE ---------- */
  const handleToggleMode = () => {
    if (!profile || togglingMode) return;
    const newMode = profile.currentMode === "employer" ? "worker" : "employer";

    const modeLabel = newMode === "employer" ? "Employer" : "Worker";
    const modeDesc =
      newMode === "employer"
        ? "You'll be able to post jobs and hire workers."
        : "You'll be able to browse jobs and apply for work.";

    Alert.alert(
      `Switch to ${modeLabel} Mode?`,
      modeDesc,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Switch to ${modeLabel}`,
          onPress: () => confirmToggleMode(newMode),
        },
      ]
    );
  };

  const confirmToggleMode = async (newMode: "employer" | "worker") => {
    setTogglingMode(true);
    try {
      const response = await apiRequest<{ user: UserProfile }>(
        "/users/switch-mode",
        {
          method: "PUT",
          body: JSON.stringify({ mode: newMode }),
        }
      );

      // Handle both response shapes the API might return
      const updatedUser =
        (response.data as any)?.user ??
        (response.data as any)?.data?.user ??
        null;

      if (response.success && updatedUser) {
        setProfile(updatedUser);
        updateUser(updatedUser as any);
        Alert.alert(
          "Mode Changed ✓",
          newMode === "employer"
            ? "You're now an Employer. Post jobs and find workers."
            : "You're now a Worker. Browse and apply for jobs."
        );
      } else {
        Alert.alert("Error", "Failed to switch mode. Try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setTogglingMode(false);
    }
  };

  /* ---------- LOGOUT ---------- */
  const handleLogout = () => {
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
      <View className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const displayProfile = profile || user;
  const isEmployer = profile?.currentMode === "employer";

  /* ================= UI ================= */
  return (
    <View className="flex-1 bg-stone-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <View className="bg-white pt-14 pb-6 px-6 items-center border-b border-stone-100">
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                displayProfile?.name || "User"
              )}&background=065f46&color=fff&size=200`,
            }}
            className="w-24 h-24 rounded-full mb-3"
          />
          <Text className="text-xl font-bold text-stone-900 tracking-tight">
            {displayProfile?.name || "User"}
          </Text>
          <Text className="text-sm text-stone-400 mt-0.5">
            {displayProfile?.phone}
          </Text>

          {/* Mode badge */}
          <View
            className={`mt-3 flex-row items-center gap-1.5 px-4 py-1.5 rounded-full ${
              isEmployer ? "bg-blue-100" : "bg-emerald-100"
            }`}
          >
            <FontAwesome
              name={isEmployer ? "briefcase" : "wrench"}
              size={11}
              color={isEmployer ? "#1d4ed8" : "#065f46"}
            />
            <Text
              className={`text-xs font-semibold ${
                isEmployer ? "text-blue-700" : "text-emerald-700"
              }`}
            >
              {isEmployer ? "Employer" : "Worker"} Mode
            </Text>
          </View>
        </View>

        <View className="px-5 pt-5 gap-4">
          {/* ── Mode explainer + switch ── */}
          <View className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            {/* Current mode description */}
            <View className={`px-4 pt-4 pb-3 ${isEmployer ? "bg-blue-50" : "bg-emerald-50"}`}>
              <Text className={`text-xs font-bold uppercase tracking-widest mb-1 ${isEmployer ? "text-blue-600" : "text-emerald-600"}`}>
                Current mode
              </Text>
              <Text className={`text-sm font-semibold ${isEmployer ? "text-blue-800" : "text-emerald-800"}`}>
                {isEmployer ? "Employer" : " Worker"}
              </Text>
              <Text className={`text-xs mt-0.5 ${isEmployer ? "text-blue-600" : "text-emerald-600"}`}>
                {isEmployer
                  ? "Post jobs, view applicants, hire workers & chat with them."
                  : "Browse jobs, apply for work, post your skills & chat with employers."}
              </Text>
            </View>

            {/* Switch button */}
            <TouchableOpacity
              onPress={handleToggleMode}
              disabled={togglingMode}
              className="flex-row items-center justify-between px-4 py-3.5"
              activeOpacity={0.7}
            >
              <View>
                <Text className="text-sm font-semibold text-stone-800">
                  Switch to {isEmployer ? "Worker" : "Employer"} Mode
                </Text>
                <Text className="text-xs text-stone-400 mt-0.5">
                  {isEmployer
                    ? "Browse and apply for jobs instead"
                    : "Post jobs and hire workers instead"}
                </Text>
              </View>
              {togglingMode ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <FontAwesome name="exchange" size={14} color="#059669" />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Profile details ── */}
          <View className="bg-white rounded-2xl border border-stone-100 px-4 py-4 gap-4">
            <ProfileItem icon="birthday-cake" label="Age" value={profile?.age ? `${profile.age} years` : "Not set"} />
            <ProfileItem icon="user" label="Gender" value={profile?.gender || "Not set"} />
            <ProfileItem
              icon="star"
              label="Rating"
              value={
                profile?.rating?.count
                  ? `${profile.rating.average.toFixed(1)} ⭐  (${profile.rating.count} reviews)`
                  : "No ratings yet"
              }
            />
            <ProfileItem
              icon="map-marker"
              label="Location"
              value={profile?.location?.text || "Not set"}
            />
            <ProfileItem
              icon="clock-o"
              label="Availability"
              value={profile?.availability?.isAvailable ? "Available" : "Not available"}
            />
          </View>

          {/* ── Skills ── */}
          {(profile?.skills?.length ?? 0) > 0 && (
            <View className="bg-white rounded-2xl border border-stone-100 px-4 py-4">
              <Text className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
                Skills
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {profile!.skills!.map((skill) => (
                  <View
                    key={skill}
                    className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-xs font-medium text-emerald-700">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Actions ── */}
          <TouchableOpacity
            onPress={() => router.push("/auth/user-details" as any)}
            className="bg-emerald-700 py-4 rounded-2xl items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="border border-red-300 py-4 rounded-2xl items-center"
            activeOpacity={0.85}
          >
            <Text className="text-red-500 font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row justify-around items-center bg-white border-t border-stone-100 px-2"
        style={{ paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 24 : 12 }}
      >
        <TouchableOpacity onPress={() => router.push("/jobs")} className="flex-1 items-center gap-1 py-1">
          <FontAwesome name="plus-circle" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Post Job</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/jobs/availablejobs")} className="flex-1 items-center gap-1 py-1">
          <FontAwesome name="briefcase" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/jobs/explore")} className="flex-1 items-center gap-1 py-1">
          <FontAwesome name="search" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Explore</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center gap-1 py-1">
          <FontAwesome name="user" size={22} color="#059669" />
          <Text className="text-[10px] text-emerald-600 font-semibold">Profile</Text>
        </View>
      </View>
    </View>
  );
}

/* ================= REUSABLE ITEM ================= */
function ProfileItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
        <FontAwesome name={icon} size={14} color="#059669" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-stone-400">{label}</Text>
        <Text className="text-sm font-medium text-stone-800">{value}</Text>
      </View>
    </View>
  );
}