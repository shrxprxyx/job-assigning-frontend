import React, { useMemo, useState } from "react";
import {
  Keyboard,
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
    Keyboard.dismiss(); // ✅ UX fix
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

  return (
    <View className="w-full mt-4 relative">
      <Text className="text-textmuted font-medium mb-1">Skills</Text>

      {/* Selected skills */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {value.map((skill) => (
          <Pressable
            key={skill}
            onPress={() => removeSkill(skill)}
            className="px-3 py-1 rounded-full bg-card flex-row items-center"
          >
            <Text className="text-xs mr-1 text-black">{skill}</Text>
            <Text className="text-xs text-gray-700">✕</Text>
          </Pressable>
        ))}
      </View>

      {/* Input */}
      <TextInput
        placeholder="Type a helping skill, e.g. 'buy milk'"
        value={query}
        onChangeText={setQuery}
        className="bg-card p-3 rounded-xl text-sm text-black"
        placeholderTextColor="#6e6e6e"
        returnKeyType="done"
        onSubmitEditing={() => trimmedQuery && addSkill(trimmedQuery)}
      />

      {/* Suggestions */}
      {(canAddCustom || suggestions.length > 0) && (
        <View
          style={{
            position: "absolute",
            top: 58,          // height of input
            left: 0,
            right: 0,
            zIndex: 999,
            elevation: 20,
          }}
          className="rounded-xl bg-white border border-[#d0d0d0] max-h-44"
        >

          <ScrollView keyboardShouldPersistTaps="handled">
            {canAddCustom && (
              <Pressable
                onPress={() => addSkill(trimmedQuery)}
                className="px-3 py-2 border-b border-[#ececec]"
              >
                <Text className="text-sm text-black">
                  ➕ Add “{normaliseSkill(trimmedQuery)}”
                </Text>
              </Pressable>
            )}

            {suggestions.map((skill) => (
              <Pressable
                key={skill}
                onPress={() => addSkill(skill)}
                className="px-3 py-2 border-b border-[#ececec] last:border-b-0"
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

