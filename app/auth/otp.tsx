import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { verifyOTP } from "../../services/auth.service";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function Otp() {
  const router = useRouter();
  const { confirmationResult, login } = useAuth();
  const params = useLocalSearchParams();

  const phone = Array.isArray(params.phone)
    ? params.phone[0]
    : params.phone ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!confirmationResult) {
      Alert.alert("Error", "OTP session expired");
      return;
    }

    if (code.length !== 6) {
      Alert.alert("Invalid OTP", "Enter 6 digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { user } = await verifyOTP(confirmationResult, code);

      console.log("✅ USER FROM BACKEND:", user);

      login(user);

      router.replace(
        user.isProfileComplete ? "/jobs" : "/auth/user-details"
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FFF3E8] justify-center px-6">
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 15,
        }}
        enableOnAndroid
        extraScrollHeight={30}
        keyboardOpeningTime={0}
      >
        {/* Card */}
        <View className="bg-white rounded-2xl p-6 shadow-md">
          <View className="items-center mb-4">
            <FontAwesome name="paper-plane" size={42} />
            <Text className="text-2xl font-bold mt-4">Verify OTP</Text>
            <Text className="text-gray-600 mt-2 text-center">
              OTP sent to {phone}
            </Text>
          </View>

          {/* OTP Input */}
          <TextInput
            className="bg-card border border-gray-200 p-4 rounded-xl text-center text-lg tracking-widest mt-4"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            placeholder="••••••"
          />

          {/* Verify Button */}
          <TouchableOpacity
            className={`p-4 rounded-xl mt-6 ${loading ? "bg-gray-400" : "bg-accent"
              }`}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Verify OTP
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
