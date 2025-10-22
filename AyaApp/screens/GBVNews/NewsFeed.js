import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { fetchNews } from "./newsService";

export default function NewsFeed({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews(query = "") {
    setLoading(true);
    const data = await fetchNews(query);
    setArticles(data);
    setLoading(false);
  }

  return (
    <View style={{ flex: 1 }}>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search within GBV topics (e.g. femicide, harassment)..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadNews(search)}
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => loadNews(search)}
        >
          <Text style={{ color: "#fff" }}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D81B60" />
          <Text>Loading GBV News...</Text>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.center}>
          <Text>No GBV-related articles found for "{search}"</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Article", { url: item.url })}
            >
              {item.urlToImage && (
                <Image source={{ uri: item.urlToImage }} style={styles.image} />
              )}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text numberOfLines={3} style={styles.desc}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#eee",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: "#D81B60",
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    margin: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 3,
  },
  image: { width: "100%", height: 180 },
  textContainer: { padding: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  desc: { fontSize: 14, color: "#444", marginTop: 5 },
});
