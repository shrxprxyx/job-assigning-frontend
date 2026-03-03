import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

export default function JobMapScreen() {
  const { lat, lng, title } = useLocalSearchParams<{
    lat: string;
    lng: string;
    title: string;
  }>();

  const jobLat = Number(lat);
  const jobLng = Number(lng);

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locationReady, setLocationReady] = useState(false); // whether we've finished attempting location

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && !cancelled) {
          // Timeout after 8s — don't block map forever
          const locPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 8000)
          );

          const result = await Promise.race([locPromise, timeoutPromise]);
          if (!cancelled && result) {
            setUserLoc({
              lat: (result as Location.LocationObject).coords.latitude,
              lng: (result as Location.LocationObject).coords.longitude,
            });
          }
        }
      } catch {
        // permission denied or error — proceed without user location
      } finally {
        if (!cancelled) setLocationReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Validate job coordinates
  if (isNaN(jobLat) || isNaN(jobLng)) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50 px-8">
        <Text className="text-stone-500 text-center text-base mb-4">
          Job location coordinates are unavailable.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-emerald-700 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show spinner only until we've attempted location fetch
  if (!locationReady) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-stone-400 text-sm mt-3">Getting your location…</Text>
      </View>
    );
  }

  // Build HTML — user location is optional; route only shown if available
  const userLatStr = userLoc ? userLoc.lat.toString() : "null";
  const userLngStr = userLoc ? userLoc.lng.toString() : "null";
  const hasUser = userLoc !== null;
  const safeTitle = (title ?? "Job Location").replace(/"/g, '\\"');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { height: 100%; width: 100%; }

    #info-card {
      position: absolute;
      bottom: 20px;
      left: 12px;
      right: 12px;
      background: #fff;
      border-radius: 14px;
      padding: 14px 16px;
      font-family: -apple-system, sans-serif;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    #info-card .job-title {
      font-size: 15px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 6px;
    }
    #info-card .route-info {
      font-size: 13px;
      color: #57534e;
    }
    #info-card .route-info span {
      background: #d1fae5;
      color: #065f46;
      border-radius: 6px;
      padding: 2px 7px;
      margin-right: 6px;
      font-weight: 600;
    }
    #info-card .no-route {
      font-size: 12px;
      color: #a8a29e;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="info-card">
    <div class="job-title">${safeTitle}</div>
    <div class="route-info" id="route-text">
      ${hasUser ? "Calculating route…" : '<span class="no-route">Enable location for directions</span>'}
    </div>
  </div>

  <script>
    const jobLat = ${jobLat};
    const jobLng = ${jobLng};
    const userLat = ${userLatStr};
    const userLng = ${userLngStr};
    const hasUser = ${hasUser};

    const map = L.map("map", { zoomControl: true });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom job marker (green)
    const jobIcon = L.divIcon({
      className: "",
      html: '<div style="width:32px;height:32px;background:#065f46;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Custom user marker (blue)
    const userIcon = L.divIcon({
      className: "",
      html: '<div style="width:18px;height:18px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    L.marker([jobLat, jobLng], { icon: jobIcon })
      .addTo(map)
      .bindPopup("<b>${safeTitle}</b>", { closeButton: false });

    if (hasUser) {
      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here", { closeButton: false });

      // Fit map to show both markers
      const bounds = L.latLngBounds([[jobLat, jobLng], [userLat, userLng]]);
      map.fitBounds(bounds, { padding: [60, 60] });

      // Fetch driving route
      fetch(
        "https://router.project-osrm.org/route/v1/driving/" +
        userLng + "," + userLat + ";" +
        jobLng + "," + jobLat +
        "?overview=full&geometries=geojson"
      )
      .then(res => res.json())
      .then(data => {
        if (!data.routes || !data.routes.length) throw new Error("No route");
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

        L.polyline(coords, {
          color: "#059669",
          weight: 5,
          opacity: 0.85,
          lineJoin: "round",
        }).addTo(map);

        map.fitBounds(coords, { padding: [60, 80] });

        const km = (route.distance / 1000).toFixed(1);
        const min = Math.round(route.duration / 60);
        const hrs = min >= 60 ? Math.floor(min / 60) + "h " + (min % 60) + "m" : min + " min";

        document.getElementById("route-text").innerHTML =
          '<span>' + km + ' km</span><span>' + hrs + ' drive</span>';
      })
      .catch(() => {
        document.getElementById("route-text").innerHTML =
          '<span class="no-route" style="background:none;color:#a8a29e">Route unavailable</span>';
      });
    } else {
      // No user location — just center on job
      map.setView([jobLat, jobLng], 15);
    }
  </script>
</body>
</html>
`;

  return (
    <View className="flex-1">
      <WebView
        source={{ html }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1 }}
        onError={() => {}} // silence WebView errors
      />
    </View>
  );
}