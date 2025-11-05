import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { supabase } from "./lib/supabaseClient";

export default function App() {
  const [statuses, setStatuses] = useState([]);
  const [inputText, setInputText] = useState("");

  const fetchStatuses = async () => {
    const { data, error } = await supabase
      .from("status")
      .select("*")
      .eq("isdeleted", false)
      .order("servertimestamp", { ascending: false });

    if (error) console.error(error);
    else {
      const withReactions = data.map((item) => ({
        ...item,
        userReaction: null,
      }));
      setStatuses(withReactions);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const addStatus = async () => {
    if (inputText.trim() === "") return;

    const { data, error } = await supabase.from("status").insert([
      {
        content: inputText,
        syncstatus: "synced",
        isdeleted: false,
      },
    ]);

    if (error) console.error(error);
    else {
      const newStatus = {
        ...data[0],
        userReaction: null,
      };
      setStatuses([newStatus, ...statuses]);
      setInputText("");
    }
  };

  const handleReaction = (id, emoji) => {
    setStatuses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.userReaction === emoji) {
            return item;
          }
          return { ...item, userReaction: emoji };
        }
        return item;
      })
    );
  };

  const avatarUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const reactionEmojis = ["👍", "😆", "❤️", "🔥"];

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.button} onPress={addStatus}>
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.statusCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatarBorder}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{item.content}</Text>
                <Text style={styles.meta}>
                  {item.syncstatus} •{" "}
                  {new Date(item.servertimestamp).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.reactionRow}>
              {reactionEmojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => handleReaction(item.id, emoji)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.reactionText}>{emoji}</Text>
                  <Text style={styles.reactionCount}>
                    {item.userReaction === emoji ? 1 : 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
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
    backgroundColor: "#ff4da6",
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
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatarBorder: {
    borderWidth: 2,
    borderColor: "#ff4da6",
    borderRadius: 25,
    padding: 2,
    marginRight: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  text: { fontSize: 16, flexShrink: 1 },
  meta: { fontSize: 12, color: "#555", marginTop: 4 },
  reactionRow: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-around",
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  reactionText: { fontSize: 18, marginRight: 4 },
  reactionCount: { fontSize: 14, color: "#333" },
});
