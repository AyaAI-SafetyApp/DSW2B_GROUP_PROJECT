import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDIASTACK_API_KEY = "d4bbcde93ba428e2b4e62d7c377dad60"; 
const BASE_URL = "http://api.mediastack.com/v1/news";

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
    const cachedData = await AsyncStorage.getItem("cachedNews");
    const cacheTimestamp = await AsyncStorage.getItem("cacheTimestamp");
    
    if (cachedData && cacheTimestamp) {
      const hoursSinceCache = (Date.now() - parseInt(cacheTimestamp)) / (1000 * 60 * 60);
      if (hoursSinceCache < 1) {
        console.log("Using cached news (cache is fresh)");
        return JSON.parse(cachedData);
      }
    }

    const isGBVQuery = GBV_KEYWORDS.some((kw) =>
      userQuery.toLowerCase().includes(kw.toLowerCase())
    );

    if (userQuery && !isGBVQuery) {
      return [];
    }

    let allArticles = [];

    async function fetchFromMediastack(keyword) {
      const response = await axios.get(BASE_URL, {
        params: {
          access_key: MEDIASTACK_API_KEY,
          countries: "za",
          languages: "en",
          keywords: keyword,
          sort: "published_desc",
          limit: 20,
        },
      });

      return response.data?.data || [];
    }

    if (userQuery) {
      allArticles = await fetchFromMediastack(userQuery);
    } else {
      for (const keyword of GBV_KEYWORDS) {
        const articles = await fetchFromMediastack(keyword);
        allArticles = [...allArticles, ...articles];
      }
    }

    const uniqueArticles = Array.from(
      new Map(allArticles.map((a) => [a.url, a])).values()
    );

    await AsyncStorage.setItem("cachedNews", JSON.stringify(uniqueArticles));
    await AsyncStorage.setItem("cacheTimestamp", Date.now().toString());

    return uniqueArticles;
  } catch (error) {
    console.log("Mediastack API failed, loading cache...", error.message);
    const cached = await AsyncStorage.getItem("cachedNews");
    return cached ? JSON.parse(cached) : [];
  }
}
