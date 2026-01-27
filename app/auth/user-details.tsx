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

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!name.trim() || !gender || skills.length === 0) {
      Alert.alert("Missing info", "Enter name, gender, and at least one skill.");
      return;
    }

    try {
      setLoading(true);

      console.log("SENDING PROFILE DATA:", { name, age, gender, skills });

      const response = await completeProfile({
        name,
        age,
        gender,
        skills, // MUST be array
      });

      console.log("PROFILE SAVE RESPONSE:", response);

      if (response.success) {
        // 🔥 IMPORTANT: Save ALL fields in context
        updateUser({
          name,
          age,
          gender,
          skills,
          isProfileComplete: true,
        });

        router.replace("/jobs" as never);
      } else {
        Alert.alert("Error", "Failed to save profile.");
      }
    } catch (err) {
      console.error("PROFILE SAVE ERROR:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

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
      {/* HEADER */}
      <View className="items-center mb-6">
        <FontAwesome name="paper-plane" size={48} />
        <Text className="text-3xl mt-6 font-bold">User Details</Text>
      </View>

      {/* NAME */}
      <Text className="font-medium">Full Name</Text>
      <TextInput
        className="bg-card p-3 rounded-xl mt-1 mb-3"
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
      />

      {/* GENDER */}
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

      {/* AGE */}
      <Text className="font-medium pb-2 pt-2">Age</Text>
      <AgePicker value={age} onChange={setAge} />

      {/* SKILLS */}
      <Text className="font-medium pb-2 pt-4">Skills</Text>
      <SkillsInput
        value={skills}
        onChange={(s) => {
          Keyboard.dismiss();
          setSkills(s);
        }}
      />

      {/* SUBMIT BUTTON */}
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
