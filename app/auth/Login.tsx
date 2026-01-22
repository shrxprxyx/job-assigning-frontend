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
      Alert.alert("Invalid number", "Enter 10 digit phone number");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${digits}`;
      const confirmation = await sendOTP(
        fullPhone,
        recaptchaVerifier.current
      );

      setConfirmationResult(confirmation);

      router.push({
        pathname: "/auth/otp",
        params: { phone: fullPhone },
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={Constants.expoConfig?.extra?.firebase}
        attemptInvisibleVerification={false}
      />


      <FontAwesome name="paper-plane" size={48} />

      <Text className="text-2xl font-bold mt-4">Login</Text>

      <TextInput
        className="border p-3 mt-4 rounded"
        keyboardType="phone-pad"
        placeholder="9876543210"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        className="bg-blue-600 p-4 mt-4 rounded"
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold">
            Send OTP
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
