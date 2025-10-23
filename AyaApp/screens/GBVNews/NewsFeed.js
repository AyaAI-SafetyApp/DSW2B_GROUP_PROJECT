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
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GBV News Feed</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search GBV topics..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadNews(search)}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => loadNews(search)}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D81B60" />
          <Text style={styles.loadingText}>Loading GBV News...</Text>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="newspaper-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            No articles found {search ? `for "${search}"` : ""}
          </Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ArticleScreen", { url: item.url })}
              activeOpacity={0.7}
            >
              {item.urlToImage && (
                <Image source={{ uri: item.urlToImage }} style={styles.image} />
              )}
              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text numberOfLines={3} style={styles.desc}>
                  {item.description}
                </Text>
                {item.source && (
                  <Text style={styles.source}>{item.source}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: "#D81B60",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { 
    width: "100%", 
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  textContainer: { 
    padding: 16,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "bold",
    color: "#000",
    lineHeight: 22,
  },
  desc: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 8,
    lineHeight: 20,
  },
  source: {
    fontSize: 12,
    color: "#D81B60",
    marginTop: 8,
    fontWeight: "500",
  },
});
