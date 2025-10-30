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
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Accelerometer } from "expo-sensors";
import { Ionicons } from "@expo/vector-icons";

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

/* ----------------------------- TomTom API Integration -------------------- */

const TOMTOM_API_KEY = "RAsJTESPENvIz1X04u2Wct3fA7fTjwU6";
let useSimulation = false; // Flag to switch to simulation when API fails

/**
 * Fetch real-time traffic data from TomTom Traffic API
 * Returns traffic flow data including current speed, free flow speed, and confidence
 */
async function fetchTrafficData(lat, lon) {
  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${TOMTOM_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.warn('TomTom API limit reached or access denied. Switching to simulation mode.');
        useSimulation = true;
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('TomTom API error:', error.message);
    useSimulation = true;
    return null;
  }
}

/**
 * Calculate people/traffic density from TomTom traffic data
 * Uses current speed vs free flow speed to estimate congestion
 */
function estimatePeopleFromTrafficData(trafficData) {
  if (!trafficData || !trafficData.flowSegmentData) {
    return null;
  }
  
  const flowData = trafficData.flowSegmentData;
  const currentSpeed = flowData.currentSpeed || 0;
  const freeFlowSpeed = flowData.freeFlowSpeed || 50;
  const confidence = flowData.confidence || 0.5;
  
  // Calculate congestion ratio (lower speed = more congestion = more people)
  const congestionRatio = 1 - (currentSpeed / freeFlowSpeed);
  
  // Estimate people based on congestion
  // Higher congestion = more vehicles/people
  const basePeople = Math.floor(congestionRatio * 500); // Up to 500 people per segment
  const adjustedPeople = Math.floor(basePeople * confidence);
  
  return {
    peopleCount: adjustedPeople,
    congestionLevel: congestionRatio,
    isHotspot: congestionRatio > 0.6, // Over 60% congestion = hotspot
    confidence: confidence,
    currentSpeed: currentSpeed,
    freeFlowSpeed: freeFlowSpeed
  };
}

/**
 * Fetch actual route from TomTom Routing API
 * Returns real street-level navigation path between two points
 */
async function fetchTomTomRoute(start, end, routeType = 'fastest') {
  try {
    const startCoords = `${start.latitude},${start.longitude}`;
    const endCoords = `${end.latitude},${end.longitude}`;
    
    // TomTom Routing API - supports multiple route types
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${startCoords}:${endCoords}/json?key=${TOMTOM_API_KEY}&routeType=${routeType}&traffic=true&travelMode=car`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.warn('TomTom Routing API limit reached.');
        useSimulation = true;
        return null;
      }
      throw new Error(`Routing API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const points = route.legs[0].points.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude
      }));
      
      return {
        points,
        distance: route.summary.lengthInMeters / 1000, // km
        duration: route.summary.travelTimeInSeconds / 60, // minutes
        trafficDelay: route.summary.trafficDelayInSeconds || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('TomTom Routing API error:', error.message);
    return null;
  }
}

/**
 * Fetch multiple alternative routes from TomTom
 */
async function fetchMultipleTomTomRoutes(start, end) {
  try {
    const startCoords = `${start.latitude},${start.longitude}`;
    const endCoords = `${end.latitude},${end.longitude}`;
    
    // Request up to 5 alternative routes
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${startCoords}:${endCoords}/json?key=${TOMTOM_API_KEY}&maxAlternatives=4&traffic=true&travelMode=car&alternativeType=anyRoute`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('TomTom API limit - using simulation fallback');
      useSimulation = true;
      return null;
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes.map((route, index) => {
        const points = route.legs[0].points.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude
        }));
        
        return {
          points,
          distance: route.summary.lengthInMeters / 1000, // km
          duration: route.summary.travelTimeInSeconds / 60, // minutes
          trafficDelay: route.summary.trafficDelayInSeconds || 0,
          routeType: ['Main Route', 'Alternative 1', 'Alternative 2', 'Alternative 3', 'Alternative 4'][index] || `Route ${index + 1}`
        };
      });
    }
    
    return null;
  } catch (error) {
    console.error('TomTom Multiple Routes error:', error.message);
    return null;
  }
}

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
    <Text style={styles.buttonText}    >{title}</Text>
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
 * Johannesburg base (CBD-ish). We'll center camera here by default
 * if we don't have a GPS fix yet.
 */
const JHB_CENTER = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

/**
 * Generate 5 "road-like" routes by following different city paths:
 *  - Various combinations of east/west and north/south movements
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
  const mid3 = {
    latitude: start.latitude + dy * 0.3,
    longitude: start.longitude + dx * 0.7,
  };

  const altBend = 0.0022; // ~200-250m bend
  const altBend2 = 0.0016;
  const altBend3 = 0.0018;

  // Route A: E/W → N/S with extra jogs (Main route)
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

  // Route B: N/S → E/W with extra jogs (Highway route)
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

  // Route C: snake-ish path to simulate avoiding blocks (Scenic route)
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

  // Route D: Diagonal approach (Business district route)
  const routeD = [
    start,
    {
      latitude: start.latitude + dy * 0.25,
      longitude: start.longitude + dx * 0.25,
    },
    {
      latitude: start.latitude + dy * 0.4 + altBend3,
      longitude: start.longitude + dx * 0.4,
    },
    mid3,
    {
      latitude: start.latitude + dy * 0.75,
      longitude: start.longitude + dx * 0.85 + (dx > 0 ? altBend : -altBend),
    },
    end,
  ];

  // Route E: Outer perimeter route (Residential route)
  const routeE = [
    start,
    {
      latitude: start.latitude + dy * 0.1,
      longitude: start.longitude + dx * 0.6,
    },
    {
      latitude: start.latitude + dy * 0.2 + (dy > 0 ? altBend2 : -altBend2),
      longitude: start.longitude + dx * 0.8,
    },
    {
      latitude: start.latitude + dy * 0.6,
      longitude: start.longitude + dx * 0.9 + altBend3,
    },
    {
      latitude: start.latitude + dy * 0.9,
      longitude: start.longitude + dx * 0.95,
    },
    end,
  ];

  return [routeA, routeB, routeC, routeD, routeE];
}

/**
detected * Generate traffic data for a route using TomTom API or simulation fallback
 * Simulates real-world traffic detection from various sources:
 * - TomTom Traffic API (primary data source)
 * - Mobile phone signals (simulation fallback)
 * - Traffic cameras (simulation fallback)
 * - IoT devices (simulation fallback)
 * - Pedestrian counters (simulation fallback)
 */
const generateTrafficData = async (points) => {
  let totalPeopleDetected = 0;
  let segmentData = [];
  let apiCallsSuccessful = 0;
  let apiCallsFailed = 0;
  
  for (let i = 1; i < points.length; i++) {
    const segmentDistance = haversine(points[i - 1], points[i]);
    const midPoint = {
      latitude: (points[i - 1].latitude + points[i].latitude) / 2,
      longitude: (points[i - 1].longitude + points[i].longitude) / 2,
    };
    
    let finalSegmentPeople;
    let isHotspot;
    let dataSource = 'simulation';
    
    // Try TomTom API first if not in simulation mode
    if (!useSimulation) {
      const trafficData = await fetchTrafficData(midPoint.latitude, midPoint.longitude);
      
      if (trafficData) {
        const estimate = estimatePeopleFromTrafficData(trafficData);
        if (estimate) {
          finalSegmentPeople = estimate.peopleCount;
          isHotspot = estimate.isHotspot;
          dataSource = 'tomtom-api';
          apiCallsSuccessful++;
        }
      } else {
        apiCallsFailed++;
      }
    }
    
    // Fallback to simulation if API failed or we're in simulation mode
    if (!finalSegmentPeople && finalSegmentPeople !== 0) {
      // Base people count based on segment distance
      const basePeople = Math.floor(segmentDistance * 100); // ~100 people per km base
      
      // Add randomness to simulate real traffic variations
      const variation = Math.random() * 0.8 + 0.6; // 0.6 to 1.4 multiplier
      const segmentPeople = Math.floor(basePeople * variation);
      
      // Add some hotspots (simulate busy intersections, markets, etc.)
      isHotspot = Math.random() < 0.2; // 20% chance of hotspot
      const hotspotMultiplier = isHotspot ? 2 + Math.random() * 3 : 1; // 2-5x more people
      
      finalSegmentPeople = Math.floor(segmentPeople * hotspotMultiplier);
    }
    
    totalPeopleDetected += finalSegmentPeople;
    
    segmentData.push({
      segment: i,
      peopleCount: finalSegmentPeople,
      isHotspot,
      distance: segmentDistance,
      dataSource
    });
  }
  
  // Log API usage stats
  if (apiCallsSuccessful > 0 || apiCallsFailed > 0) {
    console.log('TomTom API Stats:', {
      successful: apiCallsSuccessful,
      failed: apiCallsFailed,
      mode: useSimulation ? 'Simulation' : 'Live API'
    });
  }
  
  return {
    totalPeopleDetected,
    segmentData,
    averagePeoplePerKm: totalPeopleDetected / points.reduce((total, point, i) => {
      if (i === 0) return 0;
      return total + haversine(points[i - 1], point);
    }, 0),
    dataSource: useSimulation ? 'simulation' : 'mixed',
    apiCallsSuccessful,
    apiCallsFailed
  };
};

/**
 * Enhanced safety scoring based on people/device detection:
 * - Fewer people = safer route
 * - Consider route distance
 * - Factor in hotspots and congestion
 */
const scoreRoute = async (points) => {
  // Get traffic data for this route (now async with TomTom API)
  const trafficData = await generateTrafficData(points);
  
  // Calculate total route distance
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversine(points[i - 1], points[i]);
  }
  
  // Base score calculation
  const peoplePerKm = trafficData.averagePeoplePerKm;
  
  // Safety score logic:
  // - Start with 100 points
  // - Subtract points based on people density
  // - Subtract extra points for hotspots
  let safetyScore = 100;
  
  // Penalty for people density (more people = less safe)
  const densityPenalty = Math.min(peoplePerKm / 10, 40); // Max 40 points penalty
  safetyScore -= densityPenalty;
  
  // Penalty for hotspots
  const hotspotCount = trafficData.segmentData.filter(s => s.isHotspot).length;
  const hotspotPenalty = hotspotCount * 8; // 8 points per hotspot
  safetyScore -= hotspotPenalty;
  
  // Slight penalty for longer routes (efficiency factor)
  const distancePenalty = Math.min(totalDistance * 2, 10); // Max 10 points penalty
  safetyScore -= distancePenalty;
  
  // Add small randomness for real-world variations
  const randomFactor = (Math.random() - 0.5) * 6; // ±3 points
  safetyScore += randomFactor;
  
  // Ensure score is between 20 and 98
  const finalScore = Math.max(20, Math.min(98, Math.round(safetyScore)));
  
  return {
    score: finalScore,
    trafficData,
    totalDistance: totalDistance.toFixed(2),
    peopleDetected: trafficData.totalPeopleDetected,
    dataSource: trafficData.dataSource
  };
};

/* ------------------------------- Main Screen ------------------------------ */

export default function SafeRouteScreen() {
  const [step, setStep] = useState(0); // 0: caution, 1: start, 2: dest, 3: routes, 4: navigating
  const [region, setRegion] = useState(JHB_CENTER);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Start & Destination
  const [start, setStart] = useState(null);
  const [dest, setDest] = useState(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Current location state
  const [currentLocation, setCurrentLocation] = useState(null);

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // "Car" animation state
  const [carCoord, setCarCoord] = useState(null);
  const [carHeading, setCarHeading] = useState(0);
  const animTimer = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  // TomTom API Key
  const TOMTOM_API_KEY = '97VjAqYxN2dPpjTn2A2Fde2ZfYErlX1B';

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

  // Get current location on component mount for start point
  useEffect(() => {
    getCurrentLocationForStart();
  }, []);

  // Get current location only for start point
  const getCurrentLocationForStart = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const currentCoord = { latitude, longitude };
      
      setCurrentLocation(currentCoord);
      
      // Set as start point automatically
      if (!start) {
        setStart(currentCoord);
        setRegion({ ...currentCoord, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      }
      
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  // Search for locations using TomTom API with real-time suggestions
  const searchLocations = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    // Show loading state while searching
    setLoadingSearch(true);
    setShowSearchResults(true);
    
    try {
      console.log('🔍 Searching TomTom API for:', query);
      
      const testQuery = query.trim();
      const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(testQuery)}.json?key=${TOMTOM_API_KEY}&countrySet=ZA&limit=10&language=en-GB&idxSet=Str,PAD&typeahead=true`;
      
      console.log('📡 API URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`TomTom API error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📍 TomTom API response received:', JSON.stringify(data, null, 2));
      
      if (data && data.results && data.results.length > 0) {
        console.log(`🎯 Found ${data.results.length} results`);
        
        const suggestions = data.results.map((place, index) => {
          const address = place.address || {};
          
          // Construct a meaningful display name
          let displayName = place.poi?.name || address.streetName || address.freeformAddress || 'Unknown Location';
          let addressText = '';
          
          // Build detailed address
          if (address.streetName && address.municipalitySubdivision) {
            addressText = `${address.streetName}, ${address.municipalitySubdivision}`;
          } else if (address.freeformAddress) {
            addressText = address.freeformAddress;
          } else if (address.municipality) {
            addressText = `${address.municipality}, ${address.countrySubdivision || ''}`;
          }
          
          const suggestion = {
            id: place.id || `search-${index}-${Date.now()}`,
            name: displayName,
            address: addressText,
            position: {
              lat: place.position.lat,
              lon: place.position.lon
            },
            type: place.type || 'Address',
          };
          
          return suggestion;
        });
        
        console.log('Processed suggestions:', suggestions);
        setSearchSuggestions(suggestions);
        setShowSearchResults(true);
      } else {
        console.log('❌ No results found in API response');
        setSearchSuggestions([]);
        setShowSearchResults(false);
        
        // Add fallback mock results for testing
        if (query.toLowerCase().includes('test')) {
          const mockResults = [
            {
              id: 'mock-1',
              name: 'Sandton City Mall',
              address: 'Sandton, Johannesburg',
              position: { lat: -26.1076, lon: 28.0567 },
              type: 'POI'
            },
            {
              id: 'mock-2', 
              name: 'Nelson Mandela Square',
              address: 'Sandton, Johannesburg',
              position: { lat: -26.1070, lon: 28.0550 },
              type: 'POI'
            }
          ];
          setSearchSuggestions(mockResults);
          setShowSearchResults(true);
        }
      }
    } catch (error) {
      console.log("🔴 Search error:", error);
      
      // Fallback mock data for testing
      const mockResults = [
        {
          id: 'fallback-1',
          name: 'Sandton City',
          address: 'Sandton, Johannesburg',
          position: { lat: -26.1076, lon: 28.0567 },
          type: 'POI'
        },
        {
          id: 'fallback-2',
          name: 'Melrose Arch',
          address: 'Johannesburg', 
          position: { lat: -26.1306, lon: 28.0706 },
          type: 'POI'
        },
        {
          id: 'fallback-3',
          name: 'Maboneng Precinct',
          address: 'Johannesburg CBD',
          position: { lat: -26.2039, lon: 28.0456 },
          type: 'POI'
        }
      ];
      
      setSearchSuggestions(mockResults);
      setShowSearchResults(true);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (text) => {
    console.log('Search text changed:', text);
    setSearchQuery(text);
    
    // Show loading and results container if we have text
    if (text.trim().length > 0) {
      setShowSearchResults(true);
    }
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout with debouncing
    searchTimeoutRef.current = setTimeout(() => {
      if (text.trim().length >= 2) {
        console.log('🚀 Triggering search for:', text);
        searchLocations(text.trim());
      } else {
        console.log('Clearing suggestions - text too short');
        setSearchSuggestions([]);
        if (text.trim().length === 0) {
          setShowSearchResults(false);
        }
      }
    }, 500); // Slightly increased debounce time to prevent too many API calls
  };

  // Select a search result as destination
  const selectSearchResult = (place) => {
    console.log('📍 Selected location:', place);
    
    if (!place.position || !place.position.lat || !place.position.lon) {
      console.error('Invalid place coordinates:', place);
      Alert.alert("Error", "Invalid location selected. Please try again.");
      return;
    }
    
    const coord = {
      latitude: place.position.lat,
      longitude: place.position.lon,
    };
    
    console.log('Setting destination coordinates:', coord);
    setDest(coord);
    
    // Set search query to the full location name
    const displayText = place.name + (place.address ? ` - ${place.address}` : '');
    setSearchQuery(displayText);
    
    setShowSearchResults(false);
    setSearchSuggestions([]);
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Update map region to show the selected destination
    const newRegion = { 
      ...coord, 
      latitudeDelta: 0.02, 
      longitudeDelta: 0.02 
    };
    setRegion(newRegion);
    goTo(coord);
    
    // Show confirmation with more detailed location info
    Alert.alert(
      "Destination Set", 
      `You're going to:\n${place.name}\n${place.address || ''}`,
      [{ text: "OK" }]
    );
    
    // Automatically move to step 3 (routes) if we have both start and destination
    if (start && coord) {
      setTimeout(() => {
        setStep(3);
        // Fit the map to show both points
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([start, coord], {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true
          });
        }
      }, 1000);
    }
  };

  // Focus search input
  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Only show results if we have a query and suggestions
    if (searchQuery.length >= 2) {
      setShowSearchResults(true);
      // Trigger a new search to refresh results
      searchLocations(searchQuery);
    }
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // Small delay to allow for item selection
    setTimeout(() => {
      if (!isSearchFocused) {
        setShowSearchResults(false);
      }
    }, 300);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchSuggestions([]);
    setShowSearchResults(false);
    focusSearchInput();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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
      // Async function to handle route scoring with TomTom API
      const analyzeRoutes = async () => {
        setIsAnalyzing(true);
        
        // Try to get real routes from TomTom Routing API first
        console.log('Fetching routes from TomTom Routing API...');
        const tomtomRoutes = await fetchMultipleTomTomRoutes(start, dest);
        
        let rts;
        let usingRealRoutes = false;
        
        if (tomtomRoutes && tomtomRoutes.length > 0) {
          // Use real TomTom routes
          console.log(`✅ Got ${tomtomRoutes.length} real routes from TomTom`);
          rts = tomtomRoutes.map(r => r.points);
          usingRealRoutes = true;
        } else {
          // Fallback to simulated grid routes
          console.log('⚠️ Using simulated routes');
          rts = genGridRoutes(start, dest);
        }
        
        // Score all routes (async with TomTom API calls)
        const scoringPromises = rts.map(async (pts, index) => {
          const routeData = await scoreRoute(pts);
          
          // If using real TomTom routes, use their metadata
          const routeInfo = usingRealRoutes && tomtomRoutes[index] ? tomtomRoutes[index] : null;
          
          return {
            points: pts,
            score: routeData.score,
            trafficData: routeData.trafficData,
            totalDistance: routeInfo ? routeInfo.distance.toFixed(2) : routeData.totalDistance,
            peopleDetected: routeData.peopleDetected,
            dataSource: usingRealRoutes ? 'tomtom-routing' : routeData.dataSource,
            duration: routeInfo ? routeInfo.duration.toFixed(0) : null,
            trafficDelay: routeInfo ? routeInfo.trafficDelay : 0,
            routeType: routeInfo ? routeInfo.routeType : ['Main St', 'Highway', 'Scenic', 'Business', 'Residential'][index]
          };
        });
        
        const withScores = await Promise.all(scoringPromises);
        
        // Sort by safety score (best first - least people detected)
        withScores.sort((a, b) => b.score - a.score);
        
        setRoutes(rts);
        setScored(withScores);
        setSelectedIndex(0);
        setIsAnalyzing(false);
        setStep(3);
        
        // Show route analysis in console for debugging
        console.log('Route Analysis:');
        console.log('Route Source:', usingRealRoutes ? 'TomTom Real Routes' : 'Simulated Routes');
        console.log('Data Source:', useSimulation ? 'Simulation Mode' : 'TomTom Traffic API');
        withScores.forEach((route, idx) => {
          console.log(`Route ${idx + 1} (${route.routeType}):`, {
            score: route.score,
            peopleDetected: route.peopleDetected,
            distance: route.totalDistance + 'km',
            hotspots: route.trafficData.segmentData.filter(s => s.isHotspot).length,
            dataSource: route.dataSource
          });
        });
        
        // frame routes
        setTimeout(() => fitAllRoutes(withScores.map((r) => r.points)), 200);
      };
      
      analyzeRoutes();
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
      if (!currentLocation) {
        await getCurrentLocationForStart();
        return;
      }
      setStart(currentLocation);
      setRegion({ ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      goTo(currentLocation);
      setStep(2); // Move to destination selection step
      
      // Focus the search input after a short delay to allow the UI to update
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 500);
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

  /* --------------------------- Search Components -------------------------- */

  const SearchBar = () => (
    <View style={[
      styles.searchContainer,
      step === 2 && styles.searchContainerProminent
    ]}>
      <Pressable 
        style={[
          styles.searchInputContainer,
          step === 2 && styles.searchInputContainerProminent
        ]}
        onPress={focusSearchInput}
      >
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={step === 2 ? "Search for your destination..." : "Search for destinations..."}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#999"
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="sentences"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </Pressable>

      {loadingSearch && (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="small" color="#ce0e68" />
          <Text style={styles.searchLoadingText}>Searching locations...</Text>
        </View>
      )}

      {showSearchResults && searchSuggestions.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.suggestionsTitle}>
            {step === 2 ? "Select your destination" : "Search Results"}
          </Text>
          <ScrollView 
            style={styles.searchResultsScrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {searchSuggestions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => selectSearchResult(item)}
                style={({ pressed }) => [
                  styles.searchResultItem,
                  pressed && styles.searchResultItemPressed,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#ce0e68"
                  style={{ marginRight: 12 }}
                />
                <View style={styles.searchResultTextContainer}>
                  <Text style={styles.searchResultMainText}>{item.name}</Text>
                  {item.address ? (
                    <Text style={styles.searchResultSecondaryText} numberOfLines={2}>
                      {item.address}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {showSearchResults && searchSuggestions.length === 0 && !loadingSearch && searchQuery.length >= 2 && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="location" size={32} color="#ccc" />
          <Text style={styles.noResultsText}>No locations found</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
        </View>
      )}
    </View>
  );
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

  /* ------------------------- Real-time GPS Navigation ---------------------- */

  const startDrive = async () => {
    if (!scored[selectedIndex]) return;
    const points = scored[selectedIndex].points;
    if (!points || points.length < 2) return;

    setStep(4);
    setIsRunning(true);

    try {
      // Request location permission for navigation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for real-time navigation.');
        setIsRunning(false);
        return;
      }

      // Get initial position
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCarCoord({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      });

      // Start watching position in real-time
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every 1 second
          distanceInterval: 5, // Or every 5 meters
        },
        (location) => {
          if (!isRunningRef.current) return;

          const currentPos = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setCarCoord(currentPos);

          // Calculate heading based on movement direction
          if (location.coords.heading !== null && location.coords.heading !== undefined) {
            setCarHeading(location.coords.heading);
          }

          // Follow user with camera
          mapRef.current?.animateCamera(
            {
              center: currentPos,
              zoom: 18,
              heading: location.coords.heading || 0,
              pitch: Platform.OS === 'ios' ? 60 : 45,
            },
            { duration: 500 }
          );

          // Check if destination reached (within 20 meters)
          const distToDest = haversine(currentPos, points[points.length - 1]) * 1000; // meters
          if (distToDest < 20) {
            Alert.alert('Destination Reached', 'You have arrived at your destination!');
            locationSubscription.remove();
            setIsRunning(false);
          }
        }
      );

      // Store subscription in ref so we can clean it up
      animTimer.current = locationSubscription;
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to start navigation. Please check your location settings.');
      setIsRunning(false);
    }
  };

  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      // Cleanup location subscription
      if (animTimer.current && typeof animTimer.current.remove === 'function') {
        animTimer.current.remove();
      } else if (animTimer.current) {
        clearInterval(animTimer.current);
      }
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

  const RoutePill = ({ route, active, onPress, index }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.routePill, active && { borderColor: scoreColor(route.score) }]}
    >
      <Text style={styles.routePillText}>
        {route.routeType}
      </Text>
      <Text style={styles.routePillSubtext}>
        <Text style={{ color: scoreColor(route.score), fontWeight: "700" }}>
          {labelForScore(route.score)}
        </Text>{" "}
        • {route.score}
      </Text>
      <Text style={styles.routePillDetails}>
        👥 {route.peopleDetected} • {route.totalDistance}km
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
        onPress={(e) => {
          // Only allow map tapping for start point in step 1
          if (step === 1) {
            const coord = e.nativeEvent.coordinate;
            setStart(coord);
            setRegion({ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 });
            setTimeout(() => {
              setStep(2);
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }, 200);
          }
        }}
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
            title={step === 4 ? "📍 Your Live Location" : "You"}
            description={step === 4 ? "GPS Tracking Active" : ""}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={carHeading}
          >
            <View style={styles.liveMarker}>
              <View style={styles.liveMarkerPulse} />
              <View style={styles.liveMarkerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Search Bar with Real-time Suggestions - Only visible after start location is selected */}
      {(step >= 2) && <SearchBar />}

      {/* Bottom sheet card */}
      <View style={styles.sheet}>
        <StepHeader />

        {step === 0 && (
          <Card title="SafeRoute - Intelligent Route Planning">
            <Text style={styles.subtle}>
              🛡️ AI-powered route safety using real-time people & device detection.
              Find the safest path through the city with minimal foot traffic.
            </Text>
            <View style={{ height: 12 }} />
            <PrimaryButton title="Start SafeRoute" onPress={() => setStep(1)} />
            <View style={{ height: 8 }} />
          </Card>
        )}

        {step === 1 && (
          <Card title="Set Your Starting Point">
            <Text style={styles.subtle}>
              Where would you like to start your journey?
            </Text>
            <View style={{ height: 12 }} />
            <PrimaryButton
              title="Use My Current Location"
              onPress={onPickCurrentStart}
            />
            <View style={{ height: 8 }} />
            <GhostButton
              title="Tap on Map to Set Start"
              onPress={onPickStartOnMap}
            />
            <View style={{ height: 8 }} />
            <Text style={[styles.subtle, { textAlign: 'center', marginTop: 8 }]}>
              Or search for a start location above
            </Text>
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
            {start && dest && !isAnalyzing && (
              <PrimaryButton title="See Routes" onPress={() => setStep(3)} />
            )}
            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <Text style={styles.analyzingText}>
                  �️ Fetching real routes from TomTom API...
                </Text>
              </View>
            )}
          </Card>
        )}

        {step === 3 && scored.length > 0 && (
          <Card title="SafeRoute Analysis - Top 5 Routes">
            <Text style={styles.subtle}>
              📊 Analyzed {scored.length} routes • {useSimulation ? '🔧 Simulation Mode' : '🌐 Live Traffic Data'}
            </Text>
            <View style={{ height: 8 }} />
            
            {/* Show top 3 routes in pills */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              {scored.slice(0, 3).map((route, idx) => (
                <RoutePill
                  key={`pill-${idx}`}
                  route={route}
                  active={idx === selectedIndex}
                  onPress={() => {
                    setSelectedIndex(idx);
                    fitAllRoutes([scored[idx].points]);
                  }}
                />
              ))}
            </View>
            
            {/* Selected route details */}
            {scored[selectedIndex] && (
              <View style={styles.routeDetails}>
                <Text style={styles.routeDetailsTitle}>
                  🛣️ {scored[selectedIndex].routeType} Route Selected
                </Text>
                <View style={styles.routeStats}>
                  <Text style={styles.statItem}>
                    👥 People Detected: {scored[selectedIndex].peopleDetected}
                  </Text>
                  <Text style={styles.statItem}>
                    📏 Distance: {scored[selectedIndex].totalDistance} km
                  </Text>
                  <Text style={styles.statItem}>
                    🔥 Hotspots: {scored[selectedIndex].trafficData.segmentData.filter(s => s.isHotspot).length}
                  </Text>
                  <Text style={styles.statItem}>
                    🛡️ Safety Score: {scored[selectedIndex].score}/100
                  </Text>
                </View>
              </View>
            )}
            
            <PrimaryButton title="Start SafeRoute Navigation" onPress={startDrive} />
            <View style={{ height: 8 }} />
            <GhostButton title="Show All 5 Routes" onPress={() => fitAllRoutes(scored.map(r => r.points))} />
            <View style={{ height: 4 }} />
            <GhostButton title="Adjust Destination" onPress={() => setStep(2)} />
          </Card>
        )}

        {step === 4 && (
          <Card title="🚗 Live GPS Navigation">
            <Text style={styles.subtle}>
              📍 Real-time tracking • Following the safest route
            </Text>
            <View style={{ height: 8 }} />
            
            {scored[selectedIndex] && (
              <View style={styles.activeRouteInfo}>
                <Text style={styles.activeRouteTitle}>
                  {scored[selectedIndex].routeType} - {scored[selectedIndex].dataSource === 'tomtom-routing' ? 'TomTom Route' : 'Optimized Route'}
                </Text>
                <View style={styles.activeRouteStats}>
                  <Text style={styles.activeStatItem}>
                    🛡️ Safety: {scored[selectedIndex].score}/100
                  </Text>
                  <Text style={styles.activeStatItem}>
                    👥 Traffic: {scored[selectedIndex].peopleDetected} detected
                  </Text>
                </View>
                {scored[selectedIndex].duration && (
                  <Text style={styles.activeStatItem}>
                    ⏱️ ETA: {scored[selectedIndex].duration} min • {scored[selectedIndex].totalDistance} km
                  </Text>
                )}
              </View>
            )}
            
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="End Navigation"
              title="End Navigation"
              onPress={() => {
                setIsRunning(false);
                // Stop location tracking
                if (animTimer.current && typeof animTimer.current.remove === 'function') {
                  animTimer.current.remove();
                } else if (animTimer.current) {
                  clearInterval(animTimer.current);
                }
                setCarCoord(null);
                setStep(3);
              }}
              style={{ backgroundColor: "#ef4444" }}
            />
            <View style={{ height: 8 }} />
            <GhostButton title="Change Route" onPress={() => setStep(3)} />
          </Card>
        )}
      </View>
    </View>
  );
}

/* ------------------------------ Apple-ish map ---------------------------- */

const appleLikeMapStyle = [
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

  // Search Styles
  searchContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchContainerProminent: {
    top: Platform.OS === "ios" ? 40 : 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#ce0e68",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  searchInputContainerProminent: {
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2.5,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
    padding: 0,
    paddingVertical: 2,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchLoading: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
  },
  searchLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: '500',
  },
  searchResultsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    borderWidth: 2,
    borderColor: "#ce0e68",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  searchResultsScrollView: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultItemPressed: {
    backgroundColor: "#f8f8f8",
  },
  searchResultTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  searchResultMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#1C1C1E",
    marginBottom: 4,
  },
  searchResultSecondaryText: {
    fontSize: 14,
    color: "#666666",
  },
  noResultsContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ce0e68",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },

  // New styles for step 2
  searchPrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 12,
  },
  searchPromptText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  destinationSet: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  destinationSetText: {
    marginTop: 8,
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },

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
    marginBottom: 2,
  },
  routePillSubtext: {
    fontWeight: "600",
    color: "#6b7280",
    fontSize: 10,
    marginBottom: 2,
  },
  routePillDetails: {
    fontWeight: "500",
    color: "#9ca3af",
    fontSize: 9,
  },

  routeDetails: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  routeDetailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  routeStats: {
    gap: 4,
  },
  statItem: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  activeRouteInfo: {
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  activeRouteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 6,
  },
  activeRouteStats: {
    flexDirection: "row",
    gap: 16,
  },
  activeStatItem: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
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
  
  analyzingContainer: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#3b82f6",
    alignItems: "center",
  },
  analyzingText: {
    fontSize: 13,
    color: "#1e40af",
    fontWeight: "600",
  },
  
  liveMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  liveMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
});
