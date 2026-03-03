import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { applyForJob, getJobById, Job } from "../../services/job.service";

// Geocode a text address → { lat, lng } using Nominatim (same as create.tsx)
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { "User-Agent": "job-app" } });
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export default function JobDetailsScreen() {
  const { jobId, isAccepted } = useLocalSearchParams<{
    jobId: string;
    isAccepted?: string;
  }>();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Resolved coordinates — either from job.locationGeo or geocoded on the fly
  const [resolvedGeo, setResolvedGeo] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (jobId) fetchJobDetails();
    else setLoading(false);
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await getJobById(jobId!);
      if (response.success && response.data?.job) {
        const fetchedJob = response.data.job;
        setJob(fetchedJob);
        setApplied(fetchedJob.hasApplied || false);

        // If coords already exist on the job, use them immediately
        const geo = fetchedJob.locationGeo;
        if (geo?.lat && geo?.lng) {
          setResolvedGeo({ lat: geo.lat, lng: geo.lng });
        } else if (fetchedJob.locationText) {
          // Coords missing — geocode now so the button works
          resolveCoords(fetchedJob.locationText);
        }
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveCoords = async (locationText: string) => {
    setGeocoding(true);
    const geo = await geocodeAddress(locationText);
    setResolvedGeo(geo); // null if geocoding failed — button will fall back to Google Maps
    setGeocoding(false);
  };

  const handleApply = async () => {
    if (!job) return;
    setApplying(true);
    try {
      const response = await applyForJob(job.id);
      if (response.success) {
        setApplied(true);
        Alert.alert("Applied", "You have successfully applied for this job.");
      } else {
        Alert.alert("Error", "Failed to apply for job");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setApplying(false);
    }
  };

  const openInGoogleMaps = () => {
    if (!job?.locationText) return;
    const query = encodeURIComponent(job.locationText);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const openLeafletMap = () => {
    if (geocoding) {
      Alert.alert("Please wait", "Resolving map location…");
      return;
    }

    if (!resolvedGeo) {
      // Coords couldn't be resolved at all — fall back gracefully to Google Maps
      Alert.alert(
        "Opening in Google Maps",
        "Could not resolve exact coordinates. Opening in Google Maps instead.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open", onPress: openInGoogleMaps },
        ]
      );
      return;
    }

    router.push({
      pathname: "/jobs/jobmap",
      params: {
        lat: resolvedGeo.lat.toString(),
        lng: resolvedGeo.lng.toString(),
        title: job!.title,
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F0FDF4]">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F0FDF4]">
        <Text className="text-[#14532D]">No job data found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 flex-row items-center gap-2"
        >
          <FontAwesome name="arrow-left" size={16} color="#14532D" />
          <Text className="text-[#14532D] font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isJobAccepted = isAccepted === "true";

  return (
    <View className="flex-1 bg-[#F0FDF4]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-6 mt-10">
          <Text className="text-[#14532D] text-3xl font-bold">Job Details</Text>
        </View>

        <View className="bg-white rounded-3xl border border-[#DCFCE7] p-5 mb-6">
          {/* TITLE */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-[#14532D] text-xl font-semibold flex-1 mr-3">
              {job.title}
            </Text>
            <View className="bg-[#DCFCE7] px-3 py-1 rounded-full">
              <Text className="text-[#166534] text-xs font-medium">
                {job.payment}
              </Text>
            </View>
          </View>

          {/* STATUS */}
          <View className="flex-row mb-3">
            <View className="px-3 py-1 rounded-full bg-green-100">
              <Text className="text-xs text-green-700">{job.status}</Text>
            </View>
          </View>

          {/* DESCRIPTION */}
          <Text className="text-[#14532D] text-sm mb-4">{job.description}</Text>

          {/* META */}
          <View className="mb-4">
            <Text className="text-xs text-gray-600">
              Location: {job.locationText}
            </Text>
            <Text className="text-xs text-gray-600 mt-1">
              Duration: {job.totalTime || "Flexible"}
            </Text>
          </View>

          {/* MAP BUTTONS */}
          <View className="gap-3 mb-4">
            <TouchableOpacity
              onPress={openInGoogleMaps}
              className="border border-[#166534] py-3 rounded-full"
            >
              <Text className="text-center text-[#166534] font-medium">
                Open in Google Maps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openLeafletMap}
              className="bg-[#166534] py-3 rounded-full flex-row items-center justify-center gap-2"
            >
              {geocoding ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-medium">Locating…</Text>
                </>
              ) : (
                <Text className="text-white font-medium">
                  View Live Map (In App)
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* APPLY */}
          {!isJobAccepted && job.status === "Open" && (
            <TouchableOpacity
              disabled={applied || applying}
              onPress={handleApply}
              className={`py-4 rounded-full ${
                applied ? "bg-gray-300" : "bg-[#166534]"
              }`}
            >
              {applying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-center text-white font-bold">
                  {applied ? "Applied" : "Apply for Job"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isJobAccepted && (
            <View className="bg-[#DCFCE7] py-3 rounded-full">
              <Text className="text-center text-[#14532D] font-semibold">
                Accepted Job
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center justify-center gap-2"
        >
          <FontAwesome name="arrow-left" size={16} color="#14532D" />
          <Text className="text-[#14532D] font-medium">Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}