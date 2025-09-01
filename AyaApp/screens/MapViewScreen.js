import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Switch,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Accelerometer } from "expo-sensors";

const { width, height } = Dimensions.get("window");

/* ----------------------------- Small helpers ----------------------------- */

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const haversine = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const bearingBetween = (a, b) => {
  // 0-360 heading from point a to b
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(dLon);
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return brng;
};

const scoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#f59e0b";
  return "#ef4444";
};

const labelForScore = (s) => (s >= 75 ? "Best" : s >= 55 ? "Caution" : "Risky");

/* --------------------------------- UX kit -------------------------------- */

const StepDot = ({ active, done }) => (
  <View
    style={[
      styles.stepDot,
      active && styles.stepDotActive,
      done && styles.stepDotDone,
    ]}
  />
);

const PrimaryButton = ({ title, onPress, disabled, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.button, disabled && { opacity: 0.5 }, style]}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const GhostButton = ({ title, onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.buttonGhost, style]}
  >
    <Text style={styles.buttonGhostText}>{title}</Text>
  </TouchableOpacity>
);

/* ------------------------------ Mocked world ----------------------------- */

/**
 * Johannesburg base (CBD-ish). We’ll center camera here by default
 * if we don't have a GPS fix yet.
 */
const JHB_CENTER = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

/**
 * Generate 3 "road-like" routes by following a city grid:
 *  - Move east/west first, then north/south (or vice versa)
 *  - Insert extra bends to feel like streets, not straight lines
 */
function genGridRoutes(start, end) {
  if (!start || !end) return [];

  const dx = end.longitude - start.longitude;
  const dy = end.latitude - start.latitude;

  // midpoints with tiny offsets to create different street-like alternatives
  const mid1 = {
    latitude: start.latitude,
    longitude: start.longitude + dx * 0.55,
  };
  const mid2 = {
    latitude: start.latitude + dy * 0.55,
    longitude: start.longitude,
  };

  const altBend = 0.0022; // ~200-250m bend
  const altBend2 = 0.0016;

  // Route A: E/W → N/S with extra jogs
  const routeA = [
    start,
    { latitude: start.latitude, longitude: start.longitude + dx * 0.3 },
    {
      latitude: start.latitude + dy * 0.05,
      longitude: start.longitude + dx * 0.3 + altBend,
    },
    mid1,
    {
      latitude: mid1.latitude + dy * 0.4,
      longitude: mid1.longitude + (dx > 0 ? altBend2 : -altBend2),
    },
    end,
  ];

  // Route B: N/S → E/W with extra jogs
  const routeB = [
    start,
    { latitude: start.latitude + dy * 0.35, longitude: start.longitude },
    {
      latitude: start.latitude + dy * 0.35 + (dy > 0 ? altBend2 : -altBend2),
      longitude: start.longitude + dx * 0.2,
    },
    mid2,
    {
      latitude: mid2.latitude,
      longitude: mid2.longitude + dx * 0.65 + (dx > 0 ? altBend : -altBend),
    },
    end,
  ];

  // Route C: snake-ish path to simulate avoiding blocks
  const routeC = [
    start,
    {
      latitude: start.latitude + dy * 0.2,
      longitude: start.longitude + dx * 0.15,
    },
    {
      latitude: start.latitude + dy * 0.4,
      longitude: start.longitude + dx * 0.25 + (dx > 0 ? altBend : -altBend),
    },
    {
      latitude: start.latitude + dy * 0.55,
      longitude: start.longitude + dx * 0.55,
    },
    {
      latitude: start.latitude + dy * 0.8,
      longitude: start.longitude + dx * 0.8 + (dx > 0 ? altBend2 : -altBend2),
    },
    end,
  ];

  return [routeA, routeB, routeC];
}

/**
 * A very simple mock safety scoring:
 * - shorter is (slightly) safer
 * - add small randomness to simulate AI features
 */
const scoreRoute = (points) => {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversine(points[i - 1], points[i]);
  }
  const base = clamp(90 - dist * 8, 30, 95);
  const noise = Math.round((Math.random() - 0.5) * 10);
  return clamp(Math.round(base + noise), 20, 98);
};

/* ------------------------------- Main Screen ------------------------------ */

export default function SafeRoutesDemo() {
  const [step, setStep] = useState(0); // 0: caution, 1: start, 2: dest, 3: routes, 4: navigating
  const [region, setRegion] = useState(JHB_CENTER);
  const mapRef = useRef(null);

  // Start & Destination
  const [start, setStart] = useState(null);
  const [dest, setDest] = useState(null);

  // Image analysis (mock)
  const [photo, setPhoto] = useState(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [flags, setFlags] = useState({
    lowLight: false,
    fewPeople: false,
    narrowAlley: false,
    brokenLights: false,
  });

  // Routes + selection
  const [routes, setRoutes] = useState([]);
  const [scored, setScored] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // "Car" animation state
  const [carCoord, setCarCoord] = useState(null);
  const [carHeading, setCarHeading] = useState(0);
  const animTimer = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  // Sensors (accelerometer) for tiny heading wobble
  useEffect(() => {
    Accelerometer.setUpdateInterval(250);
    const sub = Accelerometer.addListener(({ x, y }) => {
      // tiny wobble
      const wobble = clamp((x + y) * 10, -8, 8);
      setCarHeading((h) => (h + wobble + 360) % 360);
    });
    return () => sub && sub.remove();
  }, []);

  // Ask for location permission once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!start) {
        const s = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setStart(s);
        setRegion({ ...s, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      }
    })();
  }, []);

  // Camera helper
  const goTo = (coord) => {
    if (!mapRef.current || !coord) return;
    mapRef.current.animateCamera(
      {
        center: coord,
        zoom: 16,
        heading: carHeading,
        pitch: Platform.OS === "ios" ? 60 : 0,
      },
      { duration: 800 }
    );
  };

  // Build routes when both points chosen
  useEffect(() => {
    if (start && dest) {
      const rts = genGridRoutes(start, dest);
      const withScores = rts.map((pts) => ({
        points: pts,
        score: scoreRoute(pts),
      }));
      // sort best first
      withScores.sort((a, b) => b.score - a.score);
      setRoutes(rts);
      setScored(withScores);
      setSelectedIndex(0);
      setStep(3);
      // frame routes
      setTimeout(() => fitAllRoutes(withScores.map((r) => r.points)), 200);
    }
  }, [start, dest]);

  const fitAllRoutes = (routesPts) => {
    if (!mapRef.current || routesPts.length === 0) return;
    const all = routesPts.flat();
    const lats = all.map((p) => p.latitude);
    const lngs = all.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    mapRef.current.fitToCoordinates(
      [
        { latitude: minLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng },
      ],
      {
        edgePadding: { top: 80, bottom: 300, left: 60, right: 60 },
        animated: true,
      }
    );
  };

  /* --------------------------- Step actions (UX) -------------------------- */

  const onPickCurrentStart = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const s = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setStart(s);
      setRegion({ ...s, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      goTo(s);
      setStep(2);
    } catch (e) {
      Alert.alert("Location", "Unable to get your current location.");
    }
  };

  const onPickStartOnMap = () => {
    Alert.alert("Pick Start", "Tap on the map to set your start point.", [
      { text: "OK" },
    ]);
    setStep(1); // stay on step 1; enable tap-select
  };

  const onPickDestOnMap = () => {
    Alert.alert("Pick Destination", "Tap on the map to set your destination.", [
      { text: "OK" },
    ]);
    setStep(2); // enable tap-select for dest
  };

  const onUploadPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission", "Media library permission is required.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      exif: true,
      quality: 0.8,
    });
    if (!res.canceled) {
      setPhoto(res.assets[0]);
      setAiModalVisible(true);
    }
  };

  const confirmPhotoAI = () => {
    setAiModalVisible(false);
    // In a real system, flags would influence scoring,
    // here we just close modal; scoring already has randomness.
  };

  /* ------------------------- Animated "car" movement ---------------------- */

  const startDrive = () => {
    if (!scored[selectedIndex]) return;
    const points = scored[selectedIndex].points;
    if (!points || points.length < 2) return;

    setStep(4);
    setIsRunning(true);
    setCarCoord(points[0]);
    goTo(points[0]);

    let seg = 0;
    let t = 0; // 0..1 along segment
    const speedMetersPerSec = 10; // virtual speed ~36km/h
    const tickMs = 50;

    const distCache = (a, b) => haversine(a, b) * 1000;

    const tick = () => {
      if (!isRunningRef.current) return;

      const a = points[seg];
      const b = points[seg + 1];
      if (!b) {
        clearInterval(animTimer.current);
        setIsRunning(false);
        return;
      }

      const segDist = distCache(a, b); // meters
      const step = (speedMetersPerSec * (tickMs / 1000)) / segDist; // progress per tick
      t += step;

      if (t >= 1) {
        // move to next segment
        t = 0;
        seg++;
        if (!points[seg + 1]) {
          setCarCoord(points[seg]);
          clearInterval(animTimer.current);
          setIsRunning(false);
          return;
        }
      } else {
        // interpolate
        const lat = a.latitude + (b.latitude - a.latitude) * t;
        const lng = a.longitude + (b.longitude - a.longitude) * t;
        setCarCoord({ latitude: lat, longitude: lng });
        // heading towards next point with small easing
        const br = bearingBetween({ latitude: lat, longitude: lng }, b);
        setCarHeading(br);
        mapRef.current?.animateCamera(
          {
            center: { latitude: lat, longitude: lng },
            heading: br,
            zoom: 17,
            pitch: Platform.OS === "ios" ? 60 : 0,
          },
          { duration: tickMs }
        );
      }
    };

    // keep running flag in a ref so interval sees the latest
    isRunningRef.current = true;
    animTimer.current = setInterval(tick, tickMs);
  };

  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (animTimer.current) clearInterval(animTimer.current);
    };
  }, []);

  /* ------------------------------- Map taps ------------------------------- */

  const onMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    if (step === 1) {
      setStart(coord);
      setRegion({ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      setTimeout(() => setStep(2), 200);
    } else if (step === 2) {
      setDest(coord);
      setRegion({ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    }
  };

  /* ------------------------------ Street snaps ---------------------------- */

  // Free, generic street-like images from Unsplash (no API key needed for direct image CDN).
  const streetShots = [
    "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495603889488-42d1d66e5523?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488747279002-c8523379faaa?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
  ];

  const currentStreetShot = useMemo(() => {
    if (!carCoord || !scored[selectedIndex]) return streetShots[0];
    const idx =
      Math.floor((Date.now() / 2500) % streetShots.length) % streetShots.length;
    return streetShots[idx];
  }, [carCoord, selectedIndex]);

  /* --------------------------------- UI ---------------------------------- */

  const StepHeader = () => (
    <View style={styles.stepBar}>
      <StepDot active={step === 0} done={step > 0} />
      <StepDot active={step === 1} done={step > 1} />
      <StepDot active={step === 2} done={step > 2} />
      <StepDot active={step === 3} done={step > 3} />
      <StepDot active={step === 4} done={false} />
    </View>
  );

  const Card = ({ title, children }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const RoutePill = ({ score, active, onPress, index }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.routePill, active && { borderColor: scoreColor(score) }]}
    >
      <Text style={styles.routePillText}>
        Route {index + 1} •{" "}
        <Text style={{ color: scoreColor(score), fontWeight: "700" }}>
          {labelForScore(score)}
        </Text>{" "}
        • {score}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onPress={onMapPress}
        customMapStyle={appleLikeMapStyle}
      >
        {start && (
          <Marker
            coordinate={start}
            title="Start"
            pinColor="#e90e6dff"
            identifier="start"
          />
        )}
        {dest && (
          <Marker
            coordinate={dest}
            title="Destination"
            pinColor="#ef4444"
            identifier="dest"
          />
        )}
        {scored.map((r, idx) => (
          <Polyline
            key={`rt-${idx}`}
            coordinates={r.points}
            strokeWidth={6}
            strokeColor={
              idx === selectedIndex ? scoreColor(r.score) : "#cbd5e1"
            }
            zIndex={idx === selectedIndex ? 10 : 1}
          />
        ))}
        {carCoord && (
          <Marker
            coordinate={carCoord}
            title="You"
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={carHeading}
            // A simple car emoji as marker; replace with a custom image for higher fidelity
            // For iOS rotation, 'flat' helps; on Android rotation works by default.
          ></Marker>
        )}
      </MapView>

      {/* Street snapshot overlay */}
      {step >= 3 && (
        <View style={styles.streetSnap}>
          <Image
            source={{ uri: currentStreetShot }}
            style={styles.streetSnapImage}
          />
          <Text style={styles.snapLabel}>Street preview (mock)</Text>
        </View>
      )}

      {/* Bottom sheet card (no scrolling; each step fits) */}
      <View style={styles.sheet}>
        <StepHeader />

        {step === 0 && (
          <Card title="Predictive Route Safety">
            <Text style={styles.subtle}>
              Choose a safe way through the city. Start with caution:
            </Text>
            <View style={{ height: 12 }} />
            <PrimaryButton title="Start" onPress={() => setStep(1)} />
            <View style={{ height: 8 }} />
          </Card>
        )}

        {step === 1 && (
          <Card title="Pick your starting point">
            <PrimaryButton
              title="Use Current Location"
              onPress={onPickCurrentStart}
            />
            <View style={{ height: 8 }} />
            <GhostButton
              title="Upload Route Photo (optional)"
              onPress={onUploadPhoto}
            />
          </Card>
        )}

        {step === 2 && (
          <Card title="Pick your destination">
            <PrimaryButton
              title="Tap on Map to Set Destination"
              onPress={onPickDestOnMap}
            />
            <View style={{ height: 8 }} />
            {/* Quick picks: a couple of Johannesburg spots */}
            <View style={styles.quickRow}>
              <TouchableOpacity
                onPress={() =>
                  setDest({ latitude: -26.2049, longitude: 28.0575 })
                }
                style={styles.quickChip}
                activeOpacity={0.9}
              >
                <Text style={styles.quickChipText}>Carlton Centre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setDest({ latitude: -26.1952, longitude: 28.0336 })
                }
                style={styles.quickChip}
                activeOpacity={0.9}
              >
                <Text style={styles.quickChipText}>Wits University</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 8 }} />
            {start && dest && (
              <PrimaryButton title="See Routes" onPress={() => setStep(3)} />
            )}
          </Card>
        )}

        {step === 3 && scored.length > 0 && (
          <Card title="Suggested routes">
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                justifyContent: "space-between",
              }}
            >
              {scored.slice(0, 3).map((r, idx) => (
                <RoutePill
                  key={`pill-${idx}`}
                  index={idx}
                  score={r.score}
                  active={idx === selectedIndex}
                  onPress={() => {
                    setSelectedIndex(idx);
                    fitAllRoutes([scored[idx].points]);
                  }}
                />
              ))}
            </View>
            <View style={{ height: 10 }} />
            <PrimaryButton title="Start Navigation" onPress={startDrive} />
            <View style={{ height: 8 }} />
            <GhostButton title="Adjust points" onPress={() => setStep(2)} />
          </Card>
        )}

        {step === 4 && (
          <Card title="Navigating…">
            <Text style={styles.subtle}>
              Follow the route. Marker animates like an Uber car. You can cancel
              anytime.
            </Text>
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="End"
              onPress={() => {
                setIsRunning(false);
                if (animTimer.current) clearInterval(animTimer.current);
                setCarCoord(null);
                setStep(3);
              }}
              style={{ backgroundColor: "#ef4444" }}
            />
          </Card>
        )}
      </View>

      {/* AI Photo Explanation Modal */}
      <Modal visible={aiModalVisible} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>AI Observations</Text>
            {photo && (
              <Image source={{ uri: photo.uri }} style={styles.modalImage} />
            )}
            {[
              { key: "lowLight", label: "Low light detected" },
              { key: "fewPeople", label: "Few people present" },
              { key: "narrowAlley", label: "Narrow passage" },
              { key: "brokenLights", label: "Street lights broken" },
            ].map((f) => (
              <View key={f.key} style={styles.flagRow}>
                <Text style={styles.flagLabel}>{f.label}</Text>
                <Switch
                  value={flags[f.key]}
                  onValueChange={(v) => setFlags((p) => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}
            <PrimaryButton title="OK" onPress={confirmPhotoAI} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------------------ Apple-ish map ---------------------------- */

const appleLikeMapStyle = [
  // light, clean look
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

/* --------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  map: { ...StyleSheet.absoluteFillObject },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000000ff",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },

  stepBar: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
    marginBottom: 10,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  stepDotActive: { backgroundColor: "#111827" },
  stepDotDone: { backgroundColor: "#6b7280" },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eef0f3",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#271121ff",
    marginBottom: 8,
  },

  subtle: { color: "#6b7280", fontSize: 13 },

  button: {
    backgroundColor: "#ce0e68ff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },

  buttonGhost: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  buttonGhostText: { color: "#780752ff", fontWeight: "700" },

  quickRow: { flexDirection: "row", gap: 8 },
  quickChip: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  quickChipText: { color: "#111827", fontWeight: "600", fontSize: 13 },

  routePill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    minWidth: (width - 16 * 2 - 8 * 2) / 3 - 2,
    alignItems: "center",
  },
  routePillText: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 12,
  },

  streetSnap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 220,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  streetSnapImage: { width: "100%", height: 100 },
  snapLabel: {
    position: "absolute",
    bottom: 6,
    right: 10,
    fontSize: 11,
    color: "#111827",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  carDot: {
    width: 28,
    height: 28,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  modalImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 8 },
  flagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  flagLabel: { color: "#271124ff", fontSize: 14 },
});
