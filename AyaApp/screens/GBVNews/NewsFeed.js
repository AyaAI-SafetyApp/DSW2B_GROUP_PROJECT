import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { fetchNews } from "./newsService";

export default function NewsFeed({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNews(query);
      setArticles(data || []);
    } catch (err) {
      setError("Failed to load news. Please try again.");
      console.error("Error loading news:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNews(search);
    } finally {
      setRefreshing(false);
    }
  }, [search, loadNews]);

  const handleSearch = useCallback(() => {
    if (search.trim()) {
      loadNews(search.trim());
    }
  }, [search, loadNews]);

  const renderEmptyState = useCallback(() => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadNews(search)}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {search
            ? `No GBV-related articles found for "${search}"`
            : "No articles available"}
        </Text>
      </View>
    );
  }, [error, search, loadNews]);

  const renderArticle = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ArticleScreen", { url: item.url })}
        activeOpacity={0.7}
      >
        {item.urlToImage ? (
          <Image
            source={{ uri: item.urlToImage }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text numberOfLines={3} style={styles.desc}>
              {item.description}
            </Text>
          )}
          {item.source?.name && (
            <Text style={styles.source}>{item.source.name}</Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  const keyExtractor = useCallback((item, index) => {
    return item.url || `article-${index}`;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GBV News</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search GBV topics..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* News List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D81B60" />
          <Text style={styles.loadingText}>Loading GBV News...</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={keyExtractor}
          renderItem={renderArticle}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D81B60"
              colors={["#D81B60"]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            articles.length === 0 && styles.emptyListContent
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D81B60",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#333",
  },
  searchBtn: {
    backgroundColor: "#D81B60",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#D81B60",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
  },
  placeholderImage: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  textContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    lineHeight: 22,
  },
  desc: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
    lineHeight: 20,
  },
  source: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontWeight: "500",
  },
});
