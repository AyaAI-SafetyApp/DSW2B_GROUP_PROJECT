  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator 
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// Initial team structure with GitHub usernames
const teamData = [
  {
    id: "1",
    firstName: "Nkosinathi",
    lastName: "Nkomo",
    githubUsername: "Nkosi-ui",
    icon: <Ionicons name="person-circle-outline" size={60} color="#2563eb" />,
  },
  {
    id: "2",
    firstName: "Laduma",
    lastName: "Ngxobo",
    githubUsername: "Ladu244-ui",
    icon: <MaterialIcons name="person-pin" size={60} color="#7c3aed" />,
  },
  // ...add other team members
];

export default function AboutUsScreen({ navigation }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeamCommits();
  }, []);

  const fetchTeamCommits = async () => {
    try {
      const membersWithCommits = await Promise.all(
        teamData.map(async (member) => {
          try {
            const response = await fetch(
              `https://api.github.com/users/${member.githubUsername}/events/public`
            );
            
            if (!response.ok) {
              throw new Error('GitHub API error');
            }

            const events = await response.json();
            const commits = events
              .filter(e => e.type === "PushEvent")
              .reduce((total, event) => total + (event.payload.commits?.length || 0), 0);

            const recentCommits = events
              .filter(e => e.type === "PushEvent")
              .slice(0, 3)
              .map(e => ({
                repo: e.repo.name,
                message: e.payload.commits[0]?.message || 'No commit message'
              }));

            return {
              ...member,
              commits,
              recentCommits,
            };
          } catch (error) {
            console.error(`Error fetching data for ${member.githubUsername}:`, error);
            return {
              ...member,
              commits: 0,
              recentCommits: [],
              error: true
            };
          }
        })
      );

      setTeamMembers(membersWithCommits);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch team data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
        <Text style={styles.loadingText}>Loading team data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meet the Team</Text>
      </View>

      <FlatList
        data={teamMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatarContainer}>{item.icon}</View>

            <View style={styles.infoContainer}>
              <Text style={styles.name}>
                {item.firstName} {item.lastName}
              </Text>
              
              <Text style={styles.commits}>
                {item.error 
                  ? "Unable to load commits" 
                  : `${item.commits} total commits`
                }
              </Text>

              {!item.error && item.recentCommits.length > 0 && (
                <View style={styles.recentCommits}>
                  <Text style={styles.recentTitle}>Recent Contributions:</Text>
                  {item.recentCommits.map((commit, index) => (
                    <Text key={index} style={styles.commitMessage} numberOfLines={1}>
                      • {commit.message}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF1493",
  },
  subText: {
    textAlign: "center",
    color: "#6b7280",
    marginVertical: 16,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  commits: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
    marginVertical: 6,
  },
  features: {
    marginTop: 4,
  },
  featureItem: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 2,
  },
});