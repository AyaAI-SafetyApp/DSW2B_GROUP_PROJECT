import HomeScreen from "../screens/HomeScreen";
import CommunityScreen from "../screens/NewsFeed/Newsfeed";
import SOSScreen from "../screens/SosScreen";
import LearningScreen from "../screens/Learning/LearningScreen";
import TherapistScreen from "../screens/TherapistScreen";

export const COLORS = {
  ACTIVE: "#de0973ff",
  INACTIVE: "gray",
};

export const TABS = [
  {
    name: "Home",
    component: HomeScreen,
    icons: { active: "home", inactive: "home-outline" },
  },
  {
    name: "Newsfeed",
    component: CommunityScreen,
    icons: { active: "newspaper", inactive: "newspaper-outline" },
  },
  {
    name: "SOS",
    component: SOSScreen,
    icons: { active: "alert-circle", inactive: "alert-circle-outline" },
  },
  {
    name: "Learning",
    component: LearningScreen,
    icons: { active: "book", inactive: "book-outline" },
  },
  {
    name: "Therapist",
    component: TherapistScreen,
    icons: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  },
];
