import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import CrimeStatisticsService from './services/CrimeStatisticsService';

const CrimeStatisticsComponent = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [crimeSummary, setCrimeSummary] = useState(null);
  const [provinceData, setProvinceData] = useState([]);
  const [mobileData, setMobileData] = useState([]);
  const [selectedTab, setSelectedTab] = useState('summary');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCrimeSummary(),
        loadProvinceData(),
        loadMobileData(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load crime statistics data');
    } finally {
      setLoading(false);
    }
  };

  const loadCrimeSummary = async () => {
    try {
      const response = await CrimeStatisticsService.getCrimeSummary();
      if (response.success) {
        setCrimeSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading crime summary:', error);
    }
  };

  const loadProvinceData = async () => {
    try {
      const response = await CrimeStatisticsService.getCrimeByProvince();
      if (response.success) {
        setProvinceData(response.data);
      }
    } catch (error) {
      console.error('Error loading province data:', error);
    }
  };

  const loadMobileData = async () => {
    try {
      const response = await CrimeStatisticsService.getMobileCrimeData(10);
      if (response.success) {
        setMobileData(response.data);
      }
    } catch (error) {
      console.error('Error loading mobile data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const renderTabButton = (tabName, title) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tabName && styles.activeTabButton,
      ]}
      onPress={() => setSelectedTab(tabName)}
    >
      <Text
        style={[
          styles.tabButtonText,
          selectedTab === tabName && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderSummaryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Crime Statistics Summary</Text>
      {crimeSummary ? (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {Array.isArray(crimeSummary) 
              ? `Loaded ${crimeSummary.length} crime categories`
              : 'Crime statistics loaded successfully'
            }
          </Text>
          <Text style={styles.summaryDetail}>
            Data source: SA Crime Statistics Database
          </Text>
          <Text style={styles.timestamp}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
          
          {Array.isArray(crimeSummary) && crimeSummary.length > 0 && (
            <View style={styles.quickStats}>
              <Text style={styles.quickStatsTitle}>Quick Overview:</Text>
              <Text style={styles.quickStatsText}>
                • Provinces covered: {[...new Set(crimeSummary.map(item => item.Province))].length}
              </Text>
              <Text style={styles.quickStatsText}>
                • Crime categories: {[...new Set(crimeSummary.map(item => item.Category))].length}
              </Text>
              <Text style={styles.quickStatsText}>
                • Years: 2014-2015 to 2015-2016
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.noDataText}>Loading summary data...</Text>
      )}
    </View>
  );

  const renderProvinceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Crime by Province</Text>
      {provinceData.length > 0 ? (
        <ScrollView style={styles.dataContainer}>
          {provinceData.slice(0, 10).map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <Text style={styles.provinceName}>
                {item.Province || 'Unknown Province'}
              </Text>
              <Text style={styles.crimeType}>
                {item.Category || item.crime_type || 'Crime Category'}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.crimeCount}>
                  2014-15: {item['2014-2015']?.toLocaleString() || 'N/A'}
                </Text>
                <Text style={styles.crimeCount}>
                  2015-16: {item['2015-2016']?.toLocaleString() || 'N/A'}
                </Text>
              </View>
              {item.trend_2015_vs_2014 && (
                <Text style={[
                  styles.trend,
                  { color: item.trend_2015_vs_2014 > 0 ? '#e74c3c' : '#27ae60' }
                ]}>
                  Trend: {item.trend_2015_vs_2014 > 0 ? '+' : ''}{item.trend_2015_vs_2014}%
                </Text>
              )}
            </View>
          ))}
          {provinceData.length > 10 && (
            <Text style={styles.moreDataText}>
              Showing 10 of {provinceData.length} records
            </Text>
          )}
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>Loading province data...</Text>
      )}
    </View>
  );

  const renderMobileTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Crime Data</Text>
      {mobileData.length > 0 ? (
        <ScrollView style={styles.dataContainer}>
          {mobileData.slice(0, 8).map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <Text style={styles.crimeType}>
                {item.Category || item.crime_type || 'Crime Data'}
              </Text>
              <Text style={styles.crimeDetail}>
                Province: {item.Province || item.Location || 'Unknown'}
              </Text>
              {item.Station && (
                <Text style={styles.crimeDetail}>
                  Station: {item.Station}
                </Text>
              )}
              <View style={styles.statsRow}>
                {item['2014-2015'] && (
                  <Text style={styles.yearData}>
                    2014-15: {item['2014-2015'].toLocaleString()}
                  </Text>
                )}
                {item['2015-2016'] && (
                  <Text style={styles.yearData}>
                    2015-16: {item['2015-2016'].toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          ))}
          {mobileData.length > 8 && (
            <Text style={styles.moreDataText}>
              Showing 8 of {mobileData.length} records
            </Text>
          )}
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>Loading crime data...</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading crime statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SA Crime Statistics</Text>
      
      <View style={styles.tabContainer}>
        {renderTabButton('summary', 'Summary')}
        {renderTabButton('province', 'Provinces')}
        {renderTabButton('mobile', 'Recent')}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'summary' && renderSummaryTab()}
        {selectedTab === 'province' && renderProvinceTab()}
        {selectedTab === 'mobile' && renderMobileTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#007AFF',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  summaryDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quickStats: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quickStatsText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  yearData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  moreDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
    padding: 10,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  dataContainer: {
    maxHeight: 400,
  },
  dataItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  provinceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  crimeCount: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 3,
  },
  population: {
    fontSize: 14,
    color: '#666',
  },
  crimeType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  crimeDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default CrimeStatisticsComponent;
