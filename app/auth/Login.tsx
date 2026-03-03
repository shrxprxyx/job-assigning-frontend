import { FontAwesome } from "@expo/vector-icons";
import Constants from "expo-constants";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "../../context/AuthContext";
import { sendOTP } from "../../services/auth.service";

export default function Login() {
  const router = useRouter();
  const { setConfirmationResult } = useAuth();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      Alert.alert("Invalid number", "Please enter a 10 digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${digits}`;
      const confirmation = await sendOTP(fullPhone, recaptchaVerifier.current);
      setConfirmationResult(confirmation);
      router.push({
        pathname: "/auth/otp",
        params: { phone: fullPhone },
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bgmain">
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
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={Constants.expoConfig?.extra?.firebase}
          attemptInvisibleVerification={false}
        />

        <View>
          {/* Icon + title */}
          <View className="items-center mb-6">
            <FontAwesome name="paper-plane" size={48} color="#111827" />
            <Text className="text-3xl mt-8 font-bold text-textmain">
              Welcome Back
            </Text>
          </View>

          {/* Label */}
          <Text className="text-textmuted font-medium">Phone Number</Text>

          {/* Input */}
          <View className="flex-row items-center bg-card rounded-xl mt-1 mb-3">
            <Text className="px-3 text-gray-600">+91</Text>
            <TextInput
              className="flex-1 p-3 text-textmain"
              placeholder="Enter phone number"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              editable={!loading}
            />
          </View>

          {/* CTA */}
          <TouchableOpacity
            className={`p-4 rounded-xl mt-4 ${
              loading ? "bg-gray-400" : "bg-accent"
            }`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-center text-white font-bold text-lg">
                Send OTP
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign up link */}
          <TouchableOpacity
            onPress={() => router.push("/auth/SignUp" as any)}
            className="mt-4"
            disabled={loading}
          >
            <Text className="text-center text-textmuted text-sm underline">
              Don't have an account? Sign Up
            </Text>

            
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}