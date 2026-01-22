import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import { completeProfile } from "../../services/auth.service";
import { AgePicker } from "./AgeField";
import { SkillsInput } from "./SkillsInput";

export default function UserDetails() {
  const router = useRouter();
  const { updateUser } = useAuth();

  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(18);
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !gender || skills.length === 0) {
      Alert.alert(
        "Missing info",
        "Please enter name, gender, and at least one skill."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await completeProfile({
        name,
        age,
        gender,
        skills,
      });

      if (response.success) {
        updateUser({
          name,
          skills,
          isProfileComplete: true,
        });
        router.replace("/jobs" as never);
      } else {
        Alert.alert("Error", "Failed to save profile.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFF3E8" }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 200,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="items-center mb-6">
        <FontAwesome name="paper-plane" size={48} />
        <Text className="text-3xl mt-6 font-bold">User Details</Text>
      </View>

      {/* Name */}
      <Text className="font-medium">Full Name</Text>
      <TextInput
        className="bg-card p-3 rounded-xl mt-1 mb-3"
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
      />

      {/* Gender Dropdown */}
      <Text className="font-medium mb-2">Gender</Text>

      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          setShowGenderDropdown((prev) => !prev);
        }}
        className="bg-card p-3 rounded-xl mb-2"
        activeOpacity={0.8}
      >
        <Text className="text-gray-700">
          {gender
            ? gender.charAt(0).toUpperCase() + gender.slice(1)
            : "Select gender"}
        </Text>
      </TouchableOpacity>

      {showGenderDropdown && (
        <View className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
          {(["male", "female", "other"] as const).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => {
                setGender(g);
                setShowGenderDropdown(false);
              }}
              className="p-4 border-b border-gray-200"
            >
              <Text className="text-center font-medium">
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Age */}
      <Text className="text-textmuted font-medium pb-3 pt-3">Age</Text>
      <AgePicker value={age} onChange={setAge} />

      {/* Skills */}
      <SkillsInput
        value={skills}
        onChange={(s) => {
          Keyboard.dismiss();
          setSkills(s);
        }}
      />

      {/* Submit */}
      <TouchableOpacity
        className={`p-4 rounded-xl mt-8 ${
          loading ? "bg-gray-400" : "bg-accent"
        }`}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-center text-white font-bold text-lg">
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
