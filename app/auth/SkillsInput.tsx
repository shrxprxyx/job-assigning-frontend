import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const HELPING_SKILLS = [
  "Buying milk for neighbours",
  "Buying groceries / vegetables",
  "Driving to nearby shops / market",
  "Dropping kids at school",
  "Picking kids from school",
  "Babysitting / child care at home",
  "Helping kids with homework",
  "Cooking simple home food",
  "Preparing tiffin / lunch box",
  "Basic house cleaning and mopping",
  "Washing and folding clothes",
  "Pet walking and feeding",
  "Watering plants",
  "Accompanying elders to hospital / clinic",
  "Accompanying elders for evening walk",
  "Standing in queues / paying bills",
  "Collecting parcels / courier",
];

type SkillsInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
};

export function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const trimmedQuery = query.trim();

  const suggestions = useMemo(() => {
    if (!trimmedQuery) return [];
    const lower = trimmedQuery.toLowerCase();
    return HELPING_SKILLS.filter(
      (skill) =>
        skill.toLowerCase().includes(lower) && !value.includes(skill)
    ).slice(0, 6);
  }, [trimmedQuery, value]);

  const normaliseSkill = (raw: string) => {
    const t = raw.trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const addSkill = (skill: string) => {
    const clean = normaliseSkill(skill);
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setQuery("");
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  const canAddCustom =
    !!trimmedQuery &&
    !value.includes(normaliseSkill(trimmedQuery)) &&
    !HELPING_SKILLS.some(
      (s) => s.toLowerCase() === trimmedQuery.toLowerCase()
    );

  const showDropdown = isFocused && (canAddCustom || suggestions.length > 0);

  return (
    // Removed mt-4 — parent (UserDetails) handles top spacing via paddingTop
    <View className="w-full">
      <Text className="text-textmuted font-medium mb-1">Skills</Text>

      {/* Selected skill chips */}
      {value.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {value.map((skill) => (
            <Pressable
              key={skill}
              onPress={() => removeSkill(skill)}
              className="px-3 py-1.5 rounded-full bg-card flex-row items-center gap-1"
            >
              <Text className="text-xs text-black">{skill}</Text>
              <Text className="text-xs text-gray-500">✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Input */}
      <TextInput
        placeholder="Type a helping skill, e.g. 'buy milk'"
        value={query}
        onChangeText={setQuery}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 150);
        }}
        className="bg-card p-3 rounded-xl text-sm text-black"
        placeholderTextColor="#6e6e6e"
        returnKeyType="done"
        blurOnSubmit={false}
        onSubmitEditing={() => {
          if (trimmedQuery) addSkill(trimmedQuery);
        }}
      />

      {/* Dropdown */}
      {showDropdown && (
        <View className="mt-1 rounded-xl bg-white border border-[#d0d0d0] overflow-hidden max-h-44">
          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {canAddCustom && (
              <Pressable
                onPress={() => addSkill(trimmedQuery)}
                className="px-3 py-2.5 border-b border-[#ececec]"
              >
                <Text className="text-sm text-black">
                  ➕ Add "{normaliseSkill(trimmedQuery)}"
                </Text>
              </Pressable>
            )}

            {suggestions.map((skill) => (
              <Pressable
                key={skill}
                onPress={() => addSkill(skill)}
                className="px-3 py-2.5 border-b border-[#ececec]"
              >
                <Text className="text-sm text-black">{skill}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}