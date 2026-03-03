// app/explore/create-skill-post.tsx
import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createSkillPost } from "../../services/skillPost.service";

const CATEGORIES = [
  "Cleaning", "Plumbing", "Electrical", "Carpentry",
  "Cooking", "Driving", "Gardening", "Painting", "Teaching", "Other",
];

export default function CreateSkillPostScreen() {
  const [form, setForm] = useState({
    skill: "",
    description: "",
    priceRange: "",
    category: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Use My Location ───────────────────────────────────────────────
  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Allow location access in your device Settings to use this feature."
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode — no API key needed, uses device/OS geocoder
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (!place) {
        Alert.alert("Error", "Could not resolve your address. Type it manually.");
        return;
      }

      // Build readable string from whichever parts are available
      const parts = [
        place.name,
        place.district,
        place.city,
        place.region,
      ].filter(Boolean);

      update("location", parts.join(", "));
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocating(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.skill.trim()) {
      Alert.alert("Missing Field", "Please enter a skill title.");
      return;
    }
    if (!form.description.trim()) {
      Alert.alert("Missing Field", "Please add a description.");
      return;
    }

    setLoading(true);
    try {
      const response = await createSkillPost({
        skill: form.skill.trim(),
        description: form.description.trim(),
        ...(form.priceRange.trim() && { priceRange: form.priceRange.trim() }),
        ...(form.category && { category: form.category }),
        ...(form.location.trim() && { location: form.location.trim() }),
      } as any);

      if (response.success) {
        Alert.alert("Posted!", "Your skill post is now live.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Failed to create skill post.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={{ flex: 1 }} className="bg-stone-50">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pt-14 pb-4 bg-white border-b border-stone-100 shadow-sm">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="arrow-left" size={14} color="#1c1917" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-stone-900 tracking-tight">
              Post Your Skill
            </Text>
            <Text className="text-xs text-stone-400 mt-0.5">
              Let others find and hire you
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Skill Title */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
              Skill Title *
            </Text>
            <TextInput
              value={form.skill}
              onChangeText={(t) => update("skill", t)}
              placeholder="e.g. Plumber, House Painter, Driver…"
              placeholderTextColor="#b8b8b0"
              returnKeyType="next"
              className="bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900"
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
              Description *
            </Text>
            <TextInput
              value={form.description}
              onChangeText={(t) => update("description", t)}
              placeholder="Describe your experience, what you offer, years of work…"
              placeholderTextColor="#b8b8b0"
              multiline
              returnKeyType="default"
              className="bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>

          {/* Price Range */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
              Price / Rate
            </Text>
            <TextInput
              value={form.priceRange}
              onChangeText={(t) => update("priceRange", t)}
              placeholder="e.g. ₹300/hr, ₹500–800 per job"
              placeholderTextColor="#b8b8b0"
              returnKeyType="next"
              className="bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900"
            />
          </View>

          {/* Location */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
              Location
            </Text>

            {/* Input + Use My Location button side by side */}
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={form.location}
                onChangeText={(t) => update("location", t)}
                placeholder="e.g. Chennai, Tamil Nadu"
                placeholderTextColor="#b8b8b0"
                returnKeyType="done"
                className="flex-1 bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900"
              />

              {/* GPS button */}
              <TouchableOpacity
                onPress={handleUseMyLocation}
                disabled={locating}
                className="w-12 h-12 rounded-2xl bg-emerald-700 items-center justify-center"
                activeOpacity={0.8}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                {locating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FontAwesome name="location-arrow" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {/* Helper text */}
            <Text className="text-xs text-stone-400 mt-1.5 ml-1">
              Tap{" "}
              <FontAwesome name="location-arrow" size={10} color="#a8a29e" />{" "}
              to auto-fill your current location
            </Text>
          </View>

          {/* Category */}
          <View className="mb-8">
            <Text className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() =>
                    update("category", form.category === cat ? "" : cat)
                  }
                  className={`px-4 py-2 rounded-full border ${
                    form.category === cat
                      ? "bg-emerald-700 border-emerald-700"
                      : "bg-white border-stone-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      form.category === cat ? "text-white" : "text-stone-600"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-2xl items-center justify-center ${
              loading ? "bg-stone-300" : "bg-emerald-700"
            }`}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Publish Skill Post
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}