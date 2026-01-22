import React, { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export function AgePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (age: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <>
      {/* Trigger */}
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-card p-3 rounded-xl mb-4"
      >
        <Text className="text-base">{value}</Text>
      </Pressable>

      <Modal transparent animationType="slide" visible={open}>
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-6 pt-4 pb-6"
            style={{ maxHeight: "55%" }}
            onPress={() => {}}
          >
            {/* Drag handle */}
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />

            <Text className="text-lg font-bold text-center mb-3">
              Select Age
            </Text>

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
            >
              {Array.from({ length: 83 }, (_, i) => i + 18).map((a) => {
                const selected = a === value;
                return (
                  <Pressable
                    key={a}
                    onPress={() => {
                      onChange(a);
                      setOpen(false);
                    }}
                    className={`py-3 rounded-xl mb-1 ${
                      selected ? "bg-accent/10" : ""
                    }`}
                  >
                    <Text
                      className={`text-center text-lg ${
                        selected
                          ? "text-accent font-bold"
                          : "text-black"
                      }`}
                    >
                      {a}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Cancel */}
            <Pressable
              onPress={() => setOpen(false)}
              className="mt-4 py-3"
            >
              <Text className="text-center text-red-500 font-semibold">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
