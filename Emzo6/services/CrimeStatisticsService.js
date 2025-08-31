// Crime Statistics Service for React Native Frontend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Change to your deployed URL in production

class CrimeStatisticsService {
  
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get API information
  async getApiInfo() {
    try {
      const response = await this.api.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching API info:', error);
      throw error;
    }
  }

  // Get crime summary data
  async getCrimeSummary() {
    try {
      const response = await this.api.get('/api/crime/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching crime summary:', error);
      throw error;
    }
  }

  // Get crime data by province
  async getCrimeByProvince(province = '') {
    try {
      const params = province ? { province } : {};
      const response = await this.api.get('/api/crime/by-province', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching crime data by province:', error);
      throw error;
    }
  }

  // Get mobile-optimized crime data
  async getMobileCrimeData(limit = 50) {
    try {
      const response = await this.api.get('/api/crime/mobile-data', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mobile crime data:', error);
      throw error;
    }
  }

  // Get crime predictions
  async getCrimePredictions() {
    try {
      const response = await this.api.get('/api/crime/predictions');
      return response.data;
    } catch (error) {
      console.error('Error fetching crime predictions:', error);
      throw error;
    }
  }

  // Get police stations data
  async getPoliceStations() {
    try {
      const response = await this.api.get('/api/police/stations');
      return response.data;
    } catch (error) {
      console.error('Error fetching police stations:', error);
      throw error;
    }
  }

  // Search crime data
  async searchCrimeData(query = '', crimeType = '', limit = 100) {
    try {
      const params = {};
      if (query) params.q = query;
      if (crimeType) params.type = crimeType;
      if (limit) params.limit = limit;

      const response = await this.api.get('/api/crime/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching crime data:', error);
      throw error;
    }
  }
}

export default new CrimeStatisticsService();
