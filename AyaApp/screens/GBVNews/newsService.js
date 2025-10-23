import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDIASTACK_API_KEY = "f78b2b82908863f103894ab589f2127f"; 
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

    return uniqueArticles;
  } catch (error) {
    console.log("Mediastack API failed, loading cache...", error.message);
    const cached = await AsyncStorage.getItem("cachedNews");
    return cached ? JSON.parse(cached) : [];
  }
}
