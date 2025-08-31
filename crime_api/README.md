# Crime Statistics API

A Flask-based REST API for serving South African crime statistics data to mobile applications.

## Features

- RESTful API endpoints for crime data
- CORS enabled for frontend integration
- Mobile-optimized data endpoints
- Province-based filtering
- Search functionality
- Crime prediction data
- Police station information

## API Endpoints

### Base URL
```
http://localhost:5000
```

### Available Endpoints

1. **GET /** - API information and available endpoints
2. **GET /api/crime/summary** - General crime statistics summary
3. **GET /api/crime/by-province?province=<name>** - Crime data by province
4. **GET /api/crime/mobile-data?limit=<number>** - Mobile-optimized crime data
5. **GET /api/crime/predictions** - Crime prediction data
6. **GET /api/police/stations** - Police station locations
7. **GET /api/crime/search?q=<query>&type=<crime_type>&limit=<number>** - Search crime data

## Setup and Installation

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Navigate to the crime_api directory:
```bash
cd crime_api
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the API server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Development Mode
```bash
export FLASK_ENV=development
python app.py
```

### Production Deployment
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Usage Examples

### Get Crime Summary
```bash
curl http://localhost:5000/api/crime/summary
```

### Get Crime Data for Specific Province
```bash
curl "http://localhost:5000/api/crime/by-province?province=Gauteng"
```

### Get Mobile Data (Limited)
```bash
curl "http://localhost:5000/api/crime/mobile-data?limit=10"
```

### Search Crime Data
```bash
curl "http://localhost:5000/api/crime/search?q=murder&limit=5"
```

## Data Sources

The API serves data from the following files in `../Emzo6/SA-CRIME-STATISTIC/`:
- `cleaned_crime_data.csv`
- `crime_summary_mobile.csv/json`
- `SouthAfricaCrimeStats_v2.csv`
- `prediction_api_template.json`
- Police shapefiles (`.shp`, `.dbf`, etc.)

## Response Format

All endpoints return JSON in the following format:
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "timestamp": "2025-08-31T10:30:00"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Frontend Integration

To connect with React Native frontend:

1. Install axios in your React Native project:
```bash
npm install axios
```

2. Use the API in your components:
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Get crime summary
const getCrimeSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/crime/summary`);
    return response.data;
  } catch (error) {
    console.error('Error fetching crime data:', error);
  }
};
```

## Notes

- The API includes CORS headers for frontend integration
- Data is served from CSV/JSON files in the SA-CRIME-STATISTIC folder
- For production, consider adding authentication and rate limiting
- Shapefile parsing requires additional setup with geopandas
