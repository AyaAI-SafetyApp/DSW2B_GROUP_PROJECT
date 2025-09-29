import { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import { supabase } from "../lib/supabaseClient";


export default function StatusFeed() {
  const [statuses, setStatuses] = useState([]);
  const [inputText, setInputText] = useState("");


  const fetchStatuses = async () => {
    console.log("Fetching statuses...");
    const { data, error } = await supabase
      .from("status")
      .select("*")
      .eq("isdeleted", false)
      .order("servertimestamp", { ascending: false });

    console.log("Fetch result - data:", data, "error:", error);
    if (error) {
      console.error("Fetch error:", error);
    } else {
      console.log("Fetched statuses count:", data?.length || 0);
      setStatuses(data);
    }
  };


  const testConnection = async () => {
    console.log("Testing Supabase connection...");
    
   
    const { data: countData, error: countError } = await supabase.from("status").select("count", { count: "exact" });
    console.log("Connection test result:", { countData, countError });
    
 
    const { data: sampleData, error: sampleError } = await supabase.from("status").select("*").limit(1);
    console.log("Sample data structure:", { sampleData, sampleError });
    
   
    if (sampleData && sampleData.length > 0) {
      console.log("Available columns:", Object.keys(sampleData[0]));
    }
  };

  useEffect(() => {
    testConnection();
    fetchStatuses();
  }, []);

 
  const addStatus = async () => {
    console.log("addStatus called, inputText:", inputText);
    
    if (inputText.trim() === "") {
      console.log("Input text is empty, returning");
      return;
    }

    console.log("Attempting to insert status...");
    
   
    const newStatus = {
      content: inputText,
    };
    
    console.log("New status object:", newStatus);

    const { data, error } = await supabase.from("status").insert([newStatus]).select();

    console.log("Insert result - data:", data, "error:", error);

    if (error) {
      console.error("Supabase error:", error);
      Alert.alert('Error', `Could not post status: ${error.message}`);
    } else {
      console.log("Success! Data:", data);
      setStatuses([...data, ...statuses]); 
      setInputText("");
      Alert.alert('Success', 'Status posted successfully!');
    }
  };

  return (
    <View style={styles.container}>
    
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.button} onPress={() => {
          console.log("Post button pressed!");
          addStatus();
        }}>
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>

     
      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.statusCard}>
            <Text style={styles.text}>{item.content}</Text>
            <Text style={styles.meta}>
              {item.syncstatus} • {new Date(item.servertimestamp).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  inputRow: { flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginLeft: 8,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  statusCard: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  text: { fontSize: 16 },
  meta: { fontSize: 12, color: "#555", marginTop: 4 },
});