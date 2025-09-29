import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NEWS_API_KEY = "39edacbed9f54464b95d41f24f2ba82a";
const BASE_URL = "https://newsapi.org/v2/everything";

const GBV_KEYWORDS = [
  "gender-based violence",
  "domestic abuse",
  "sexual assault",
  "rape",
  "femicide",
  "harassment",
  "human trafficking",
];

export async function fetchNews(userQuery = "") {
  try {
    
    const isGBVQuery = GBV_KEYWORDS.some((kw) =>
      userQuery.toLowerCase().includes(kw.toLowerCase())
    );

    
    if (userQuery && !isGBVQuery) {
      return [];
    }

    let allArticles = [];

    if (userQuery) {
      const response = await axios.get(BASE_URL, {
        params: {
          q: userQuery,
          language: "en",
          sortBy: "publishedAt",
          apiKey: NEWS_API_KEY,
        },
      });

      if (response.data.articles) {
        allArticles = response.data.articles;
      }
    } else {
      
      for (const keyword of GBV_KEYWORDS) {
        const response = await axios.get(BASE_URL, {
          params: {
            q: keyword,
            language: "en",
            sortBy: "publishedAt",
            apiKey: NEWS_API_KEY,
          },
        });

        if (response.data.articles) {
          allArticles = [...allArticles, ...response.data.articles];
        }
      }
    }

    const uniqueArticles = Array.from(
      new Map(allArticles.map((a) => [a.url, a])).values()
    );

    await AsyncStorage.setItem("cachedNews", JSON.stringify(uniqueArticles));

    return uniqueArticles;
  } catch (error) {
    console.log("API failed, loading cache...");
    const cached = await AsyncStorage.getItem("cachedNews");
    return cached ? JSON.parse(cached) : [];
  }
}
