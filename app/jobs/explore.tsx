import { FontAwesome } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getSkillPosts,
  requestSkill,
  SkillPost,
} from "../../services/skillPost.service";

export default function ExploreScreen() {
  const { user } = useAuth();
  const myId = (user as any)?.id ?? (user as any)?._id;

  const [skills, setSkills] = useState<SkillPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchSkillPosts();
    }, [])
  );

  const fetchSkillPosts = async () => {
    try {
      const response = await getSkillPosts();
      if (response.success && response.data?.skillPosts) {
        setSkills(response.data.skillPosts);
      }
    } catch (error) {
      console.error("Failed to fetch skill posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSkillPosts();
  };

  const handleRequestJob = async (skillPost: SkillPost) => {
    setRequestingId(skillPost.id);
    try {
      const response = await requestSkill(skillPost.id);
      if (response.success) {
        Alert.alert(
          "Request Sent!",
          `Your request for "${skillPost.skill}" has been sent to ${skillPost.userId.name}.`
        );
      } else {
        Alert.alert("Error", (response as any).message || "Failed to send request");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-14 pb-5 bg-white border-b border-stone-100">
          <Text className="text-stone-400 text-sm">Welcome back,</Text>
          <Text className="text-stone-900 text-2xl font-bold tracking-tight mt-0.5">
            {user?.name || "User"}
          </Text>

          {/* Post Your Skill CTA */}
          <TouchableOpacity
            onPress={() => router.push("/jobs/createskillpost")}
            className="flex-row items-center gap-3 mt-4 bg-emerald-700 rounded-2xl px-4 py-3"
            activeOpacity={0.85}
          >
            <View className="w-8 h-8 rounded-full bg-emerald-600 items-center justify-center">
              <FontAwesome name="plus" size={14} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Post Your Skill</Text>
              <Text className="text-emerald-200 text-xs mt-0.5">
                Let employers find and hire you
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#6ee7b7" />
          </TouchableOpacity>
        </View>

        {/* ── Section title ── */}
        <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
          <Text className="text-stone-900 font-bold text-base tracking-tight">
            Browse Skills
          </Text>
          <Text className="text-stone-400 text-xs">
            {skills.length} {skills.length === 1 ? "post" : "posts"}
          </Text>
        </View>

        {/* ── Empty state ── */}
        {skills.length === 0 && (
          <View className="items-center py-16 px-8">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <FontAwesome name="search" size={32} color="#059669" />
            </View>
            <Text className="text-stone-700 font-bold text-base mb-1">
              No skill posts yet
            </Text>
            <Text className="text-stone-400 text-sm text-center leading-5">
              Be the first! Tap "Post Your Skill" above to advertise your services.
            </Text>
          </View>
        )}

        {/* ── Skill Cards ── */}
        <View className="px-4">
          {skills.map((item) => {
            const isOwn =
              item.userId._id === myId || (item.userId as any).id === myId;

            return (
              <View
                key={item.id}
                className="bg-white rounded-2xl border border-stone-100 mb-4 overflow-hidden"
              >
                {/* Photo */}
                {item.photo && (
                  <Image
                    source={{ uri: item.photo }}
                    className="w-full h-44"
                    resizeMode="cover"
                  />
                )}

                {/* Content */}
                <View className="p-4">
                  {/* Top row */}
                  <View className="flex-row justify-between items-start mb-1">
                    <View className="flex-1 mr-2">
                      <Text className="text-stone-900 text-base font-bold tracking-tight">
                        {item.skill}
                      </Text>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        {/* Avatar initial */}
                        <View className="w-5 h-5 rounded-full bg-emerald-100 items-center justify-center">
                          <Text className="text-[9px] font-bold text-emerald-700">
                            {item.userId.name?.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="text-xs text-stone-400">
                          {item.userId.name}
                          {isOwn && (
                            <Text className="text-emerald-600 font-semibold"> (You)</Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Rating badge */}
                    {item.userId.rating && (
                      <View className="flex-row items-center bg-amber-50 border border-amber-100 px-2 py-1 rounded-full gap-1">
                        <FontAwesome name="star" size={10} color="#f59e0b" />
                        <Text className="text-xs text-amber-700 font-semibold">
                          {item.userId.rating.average?.toFixed(1) ?? "New"}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  <Text className="text-sm text-stone-500 leading-5 mt-2" numberOfLines={3}>
                    {item.description}
                  </Text>

                  {/* Stats */}
                  {item.stats && (
                    <View className="flex-row gap-3 mt-2">
                      <Text className="text-xs text-stone-300">
                        👁 {item.stats.views} views
                      </Text>
                      <Text className="text-xs text-stone-300">
                        📩 {item.stats.requests} requests
                      </Text>
                    </View>
                  )}

                  {/* Action button */}
                  {isOwn ? (
                    <View className="mt-4 py-3 rounded-xl bg-stone-100 border border-stone-200">
                      <Text className="text-center text-stone-400 text-sm font-medium">
                        Your post · visible to all users
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleRequestJob(item)}
                      disabled={requestingId === item.id}
                      className={`mt-4 py-3 rounded-xl ${
                        requestingId === item.id ? "bg-stone-200" : "bg-emerald-700"
                      }`}
                      activeOpacity={0.8}
                    >
                      {requestingId === item.id ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <Text className="text-white text-center font-semibold text-sm">
                          Request Job
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View className="absolute bottom-0 left-0 right-0 flex-row justify-around items-center bg-white border-t border-stone-100 py-3 px-2"
        style={{ paddingBottom: Platform.OS === "ios" ? 24 : 12 }}
      >
        <TouchableOpacity
          onPress={() => router.push("/jobs")}
          className="flex-1 items-center gap-1 py-1"
        >
          <FontAwesome name="plus-circle" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Post Job</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/jobs/availablejobs")}
          className="flex-1 items-center gap-1 py-1"
        >
          <FontAwesome name="briefcase" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Jobs</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center gap-1 py-1">
          <FontAwesome name="search" size={22} color="#059669" />
          <Text className="text-[10px] text-emerald-600 font-semibold">Explore</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="flex-1 items-center gap-1 py-1"
        >
          <FontAwesome name="user" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// needed for bottom nav safe area
import { Platform } from "react-native";

