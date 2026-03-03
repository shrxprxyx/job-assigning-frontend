// app/jobs/create.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";


import { createJob, updateJob, getJobById } from "../../services/job.service";

type Params = {
  mode?: string;
  jobId?: string;
};

type JobFormState = {
  title: string;
  description: string;
  startTime: string;
  payment: string;
  locationText: string;
  totalTime: string;
};

export default function CreateJob() {
  const router = useRouter();
  const { mode, jobId } = useLocalSearchParams<Params>();
  const isEdit = mode === "edit";
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(false);

  const [form, setForm] = useState<JobFormState>({
    title: "",
    description: "",
    startTime: "",
    payment: "",
    locationText: "",
    totalTime: "",
  });

  useEffect(() => {
    if (isEdit && jobId) {
      fetchJobData();
    }
  }, [isEdit, jobId]);

  const fetchJobData = async () => {
    if (!jobId) return;
    setFetchingJob(true);
    try {
      const response = await getJobById(jobId);
      if (response.success && response.data?.job) {
        const job = response.data.job;
        setForm({
          title: job.title || "",
          description: job.description || "",
          startTime: job.startTime || "",
          payment: job.payment || "",
          locationText: job.locationText || "",
          totalTime: job.totalTime || "",
        });
      }
    } catch {
      Alert.alert("Error", "Failed to load job data");
    } finally {
      setFetchingJob(false);
    }
  };

  const updateField = (key: keyof JobFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ REQUIRED: convert text location → lat/lng
  const geocodeLocation = async (address: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "job-app" },
      });
      const data = await res.json();

      if (!data.length) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert("Missing Fields", "Please fill at least title and description.");
      return;
    }

    if (!form.payment.trim() || !form.locationText.trim()) {
      Alert.alert("Missing Fields", "Payment and location are required.");
      return;
    }

    setLoading(true);

    try {
      // ✅ REQUIRED: get coordinates
      const locationGeo = await geocodeLocation(form.locationText.trim());

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        startTime: form.startTime.trim(),
        payment: form.payment.trim(),
        locationText: form.locationText.trim(),
        totalTime: form.totalTime.trim(),
        locationGeo: locationGeo ?? undefined,
      };

      const response =
        isEdit && jobId
          ? await updateJob(jobId, payload as any)
          : await createJob(payload);

      if (response.success) {
        Alert.alert(
          "Success",
          isEdit ? "Job updated successfully" : "Job created successfully",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", "Failed to save job");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingJob) {
    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#FFF2E6",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FF7F50" />
        <Text className="text-textmuted mt-4">Loading job data...</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#FFF2E6",
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 32,
      }}
    >
      <Text className="text-3xl font-bold text-textmain mb-8">
        {isEdit ? "Edit Job" : "Add New Job"}
      </Text>

      <Text className="text-textmuted font-medium mb-1">Job Title</Text>
      <TextInput
        className="bg-card p-3 rounded-2xl mb-4"
        value={form.title}
        onChangeText={(t) => updateField("title", t)}
      />

      <Text className="text-textmuted font-medium mb-1">Description</Text>
      <TextInput
        className="bg-card p-3 rounded-2xl mb-4 min-h-[96px]"
        multiline
        value={form.description}
        onChangeText={(t) => updateField("description", t)}
      />

      <Text className="text-textmuted font-medium mb-1">Starting time</Text>
      <TextInput
        className="bg-card p-3 rounded-2xl mb-4"
        value={form.startTime}
        onChangeText={(t) => updateField("startTime", t)}
      />

      <Text className="text-textmuted font-medium mb-1">Payment</Text>
      <TextInput
        className="bg-card p-3 rounded-2xl mb-4"
        keyboardType="numeric"
        value={form.payment}
        onChangeText={(t) => updateField("payment", t)}
      />

      <Text className="text-textmuted font-medium mb-1">Location</Text>
      <TextInput
        className="bg-card p-3 rounded-2xl mb-4"
        value={form.locationText}
        onChangeText={(t) => updateField("locationText", t)}
      />

      <Text className="text-textmuted font-medium mb-1">Total time</Text>
      <TextInput
        className="bg-card p-3 rounded-2xl mb-6"
        value={form.totalTime}
        onChangeText={(t) => updateField("totalTime", t)}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-accent p-4 rounded-2xl mt-2"
      >
        <Text className="text-white text-center text-lg font-bold">
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Job"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
