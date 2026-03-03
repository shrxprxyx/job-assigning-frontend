import { FontAwesome } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  AcceptedJob,
  applyForJob,
  getAcceptedJobs,
  getAvailableJobs,
  Job
} from "../../services/job.service";

export default function AvailableJobsScreen() {
  const { user } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [availableRes, acceptedRes] = await Promise.all([
        getAvailableJobs(),
        getAcceptedJobs("Active"),
      ]);

      if (availableRes.success && availableRes.data?.jobs) {
        setAvailableJobs(availableRes.data.jobs);
      }

      if (acceptedRes.success && acceptedRes.data?.acceptedJobs) {
        setAcceptedJobs(acceptedRes.data.acceptedJobs);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      const response = await applyForJob(jobId);
      if (response.success) {
        Alert.alert("Success", "Application submitted successfully!");
        // Update job in list to show applied status
        setAvailableJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, hasApplied: true, applicationStatus: "Applied" }
              : job
          )
        );
      } else {
        Alert.alert("Error", (response as any).message || "Failed to apply");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setApplyingId(null);
    }
  };

  const handleReject = (jobId: string) => {
    // Just hide from list locally for now
    setAvailableJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const goToJobDetails = (job: Job, isAccepted: boolean = false) => {
    router.push({
      pathname: "/jobs/jobdetails",
      params: {
        jobId: job.id,
        isAccepted: isAccepted ? "true" : "false",
      },
    } as any);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F0FDF4] items-center justify-center">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  // Jobs not yet applied to
  const jobRequests = availableJobs.filter((job) => !job.hasApplied);
  // Jobs already applied to
  const appliedJobs = availableJobs.filter((job) => job.hasApplied);

  return (
    <View className="flex-1 bg-[#F0FDF4]">
      {/* HEADER */}
      <View className="px-6 pt-14">
        <Text className="text-[#14532D] text-xl">Welcome,</Text>
        <Text className="text-[#14532D] text-3xl font-bold">
          {user?.name || "User"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ACCEPTED JOBS */}
        {acceptedJobs.length > 0 && (
          <View className="px-6 mt-6">
            <Text className="text-[#166534] text-lg mb-3">
              Active Jobs ({acceptedJobs.length})
            </Text>

            {acceptedJobs.map((accepted) => (
              <TouchableOpacity
                key={accepted.id}
                activeOpacity={0.8}
                onPress={() => goToJobDetails(accepted.jobId as Job, true)}
              >
                <View className="bg-white rounded-3xl border border-[#DCFCE7] p-4 mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-[#14532D] font-semibold">
                        {accepted.jobId.title}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {accepted.jobId.locationText} • {accepted.jobId.totalTime || "Flexible"}
                      </Text>
                    </View>
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-xs text-green-700">Active</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/jobs/chat",
                        params: { chatRoomId: accepted.chatRoomId },
                      } as any)
                    }
                    className="mt-3 border border-[#166534] py-2 rounded-full"
                  >
                    <Text className="text-center text-[#166534] font-medium">
                      Chat with Employer
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* APPLIED JOBS */}
        {appliedJobs.length > 0 && (
          <View className="px-6 mt-6">
            <Text className="text-[#166534] text-lg mb-3">
              Applied Jobs ({appliedJobs.length})
            </Text>

            {appliedJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.8}
                onPress={() => goToJobDetails(job)}
              >
                <View className="bg-white rounded-3xl border border-[#DCFCE7] p-4 mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-[#14532D] font-semibold">
                        {job.title}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {job.locationText} • {job.payment}
                      </Text>
                    </View>
                    <View className="bg-yellow-100 px-3 py-1 rounded-full">
                      <Text className="text-xs text-yellow-700">
                        {job.applicationStatus || "Applied"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* JOB REQUESTS */}
        <View className="px-6 mt-6">
          <Text className="text-[#166534] text-lg mb-3">
            Available Jobs ({jobRequests.length})
          </Text>

          {jobRequests.length === 0 && (
            <View className="items-center py-10">
              <FontAwesome name="briefcase" size={48} color="#ccc" />
              <Text className="text-gray-500 mt-4 text-center">
                No new jobs available.{"\n"}Pull down to refresh!
              </Text>
            </View>
          )}

          {jobRequests.map((job) => (
            <TouchableOpacity
              key={job.id}
              activeOpacity={0.8}
              onPress={() => goToJobDetails(job)}
            >
              <View className="bg-white rounded-3xl border border-[#DCFCE7] p-4 mb-4">
                <Text className="text-[#14532D] font-semibold">
                  {job.title}
                </Text>
                <Text className="text-xs text-gray-600 mb-2">
                  {job.locationText} • {job.totalTime || "Flexible"} • {job.payment}
                </Text>
                <Text className="text-sm text-gray-700 mb-4" numberOfLines={2}>
                  {job.description}
                </Text>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => handleApply(job.id)}
                    disabled={applyingId === job.id}
                    className={`flex-1 py-2 rounded-full ${
                      applyingId === job.id ? "bg-gray-300" : "bg-[#166534]"
                    }`}
                  >
                    {applyingId === job.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-center text-white font-medium">
                        Accept
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleReject(job.id)}
                    className="flex-1 border border-[#166534] py-2 rounded-full"
                  >
                    <Text className="text-center text-[#166534] font-medium">
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row justify-around items-center bg-white border-t border-stone-100 px-2"
        style={{ paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 24 : 12 }}
      >
        <TouchableOpacity
          onPress={() => router.push("/jobs")}
          className="flex-1 items-center gap-1 py-1"
        >
          <FontAwesome name="plus-circle" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Post Job</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center gap-1 py-1">
          <FontAwesome name="briefcase" size={22} color="#059669" />
          <Text className="text-[10px] text-emerald-600 font-semibold">Jobs</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/jobs/explore")}
          className="flex-1 items-center gap-1 py-1"
        >
          <FontAwesome name="search" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="flex-1 items-center gap-1 py-1"
        >
          <FontAwesome name="user" size={22} color="#a8a29e" />
          <Text className="text-[10px] text-stone-400">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}