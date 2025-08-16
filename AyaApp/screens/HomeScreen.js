import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Svg, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  Shield,
  AlertTriangle,
  Users,
  MapPin,
  Bell,
  Settings,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function AyaHomepage() {
  const [safetyState, setSafetyState] = useState({
    percentage: 87,
    status: "safe",
    tip: "Low-risk zone detected",
    class: "safe",
  });
  const [location, setLocation] = useState("Main Street, Downtown");
  const [activeUsers, setActiveUsers] = useState(1247);
  const [recentTips, setRecentTips] = useState([
    {
      id: 1,
      title: "Avoid dark alleys",
      description: "AI suggests safer streets",
    },
    {
      id: 2,
      title: "Community Watch Nearby",
      description: "Police patrol 150m away",
    },
    { id: 3, title: "Construction Zone", description: "Take alternate routes" },
  ]);
  const [sapsData, setSapsData] = useState([
    { id: 1, type: "Police Station", distance: "200m" },
    { id: 2, type: "Patrol Car", distance: "350m" },
    { id: 3, type: "Recent Incident", distance: "500m" },
  ]);

  const safetyStates = [
    {
      percentage: 87,
      status: "safe",
      tip: "Low-risk zone detected",
      class: "safe",
    },
    {
      percentage: 65,
      status: "caution",
      tip: "Moderate activity detected",
      class: "caution",
    },
    {
      percentage: 32,
      status: "danger",
      tip: "High risk area",
      class: "danger",
    },
  ];

  useEffect(() => {
    const safetyTimer = setInterval(() => {
      const randomState =
        safetyStates[Math.floor(Math.random() * safetyStates.length)];
      setSafetyState(randomState);
    }, 10000);
    return () => clearInterval(safetyTimer);
  }, []);

  const getSafetyColor = () => {
    switch (safetyState.class) {
      case "safe":
        return "#10B981";
      case "caution":
        return "#F59E0B";
      case "danger":
        return "#EF4444";
      default:
        return "#E91E63";
    }
  };

  const radius = 90;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (safetyState.percentage / 100) * circumference;

  const getSafetyIcon = () => {
    switch (safetyState.class) {
      case "safe":
        return <Shield color={getSafetyColor()} size={32} />;
      case "caution":
        return <AlertTriangle color={getSafetyColor()} size={32} />;
      case "danger":
        return <AlertTriangle color={getSafetyColor()} size={32} />;
      default:
        return <Shield color={getSafetyColor()} size={32} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* AI Dashboard */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.aiDashboard}>
          {/* Current Location & ML Safety */}
          <View style={styles.locationBox}>
            <MapPin color="#E91E63" size={24} />
            <Text style={styles.locationText}>{location}</Text>
          </View>

          {/* Massive Safety Circle */}
          <View style={styles.progressContainer}>
            <Svg width={220} height={220}>
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#E91E63" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Circle
                cx={110}
                cy={110}
                r={radius}
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx={110}
                cy={110}
                r={radius}
                stroke="url(#grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${progress} ${circumference}`}
                strokeLinecap="round"
                rotation="-180"
                origin="110,110"
              />
            </Svg>
            <View style={styles.progressText}>
              {getSafetyIcon()}
              <Text
                style={[styles.percentageText, { color: getSafetyColor() }]}
              >
                {safetyState.percentage}%
              </Text>
              <Text style={styles.statusText}>
                {safetyState.status.toUpperCase()}
              </Text>
              <Text style={styles.tipText}>{safetyState.tip}</Text>
            </View>
          </View>

          {/* AI Model Card */}
          <View style={styles.aiModelCard}>
            <View style={styles.aiStatItem}>
              <AlertTriangle color="#F59E0B" size={28} />
              <Text style={styles.aiStatNumber}>2</Text>
              <Text style={styles.aiStatLabel}>Predicted Crimes</Text>
            </View>
            <View style={styles.aiStatItem}>
              <AlertTriangle color="#EF4444" size={28} />
              <Text style={styles.aiStatNumber}>1</Text>
              <Text style={styles.aiStatLabel}>Unsafe Zones</Text>
            </View>
            <View style={styles.aiStatItem}>
              <Shield color="#10B981" size={28} />
              <Text style={styles.aiStatNumber}>✓</Text>
              <Text style={styles.aiStatLabel}>Safe Route</Text>
            </View>
            <View style={styles.aiStatItem}>
              <Users color="#E91E63" size={28} />
              <Text style={styles.aiStatNumber}>{activeUsers}</Text>
              <Text style={styles.aiStatLabel}>Active Users</Text>
            </View>
          </View>
        </View>

        {/* SAPS / Nearby Safety */}
        <View style={styles.sapsContainer}>
          <Text style={styles.sectionTitle}>Nearby SAPS Info</Text>
          {sapsData.map((item) => (
            <View key={item.id} style={styles.sapsItem}>
              <Text style={styles.sapsType}>{item.type}</Text>
              <Text style={styles.sapsDistance}>{item.distance}</Text>
            </View>
          ))}
        </View>

        {/* Recent Tips / News */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Recent Safety Tips</Text>
          {recentTips.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  logo: { width: 25, height: 20 },
  headerIcons: { flexDirection: "row" },
  aiDashboard: { alignItems: "center", marginTop: 20 },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  progressContainer: { alignItems: "center", marginBottom: 20 },
  progressText: {
    position: "absolute",
    alignItems: "center",
    top: 60,
    left: 0,
    right: 0,
  },
  percentageText: { fontSize: 36, fontWeight: "bold", marginTop: 5 },
  statusText: { fontSize: 16, fontWeight: "600", color: "#555" },
  tipText: { fontSize: 14, color: "#555", marginTop: 5, textAlign: "center" },
  aiModelCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  aiStatItem: { alignItems: "center", flexBasis: "45%", marginBottom: 20 },
  aiStatNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E91E63",
    marginTop: 5,
  },
  aiStatLabel: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 2,
  },
  sapsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  sapsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sapsType: { fontSize: 14, color: "#555" },
  sapsDistance: { fontSize: 14, fontWeight: "bold", color: "#E91E63" },
  tipsContainer: { paddingHorizontal: 20, marginBottom: 30 },
  tipCard: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipTitle: { fontSize: 14, fontWeight: "bold", color: "#333" },
  tipDesc: { fontSize: 12, color: "#555", marginTop: 2 },
});
