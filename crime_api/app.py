from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native frontend

# Path to the SA-CRIME-STATISTIC data
DATA_PATH = '../Emzo6/SA-CRIME-STATISTIC'

@app.route('/')
def home():
    return jsonify({
        "message": "Crime Statistics API",
        "version": "1.0",
        "endpoints": [
            "/api/crime/summary",
            "/api/crime/by-province",
            "/api/crime/mobile-data",
            "/api/crime/predictions",
            "/api/police/stations"
        ]
    })

@app.route('/api/crime/summary', methods=['GET'])
def get_crime_summary():
    """Get general crime statistics summary"""
    try:
        # Check if directory exists
        if not os.path.exists(DATA_PATH):
            return jsonify({
                "success": False,
                "error": f"Data directory not found: {DATA_PATH}",
                "absolute_path": os.path.abspath(DATA_PATH)
            }), 404
        
        # Load the mobile summary data
        mobile_data_path = os.path.join(DATA_PATH, 'crime_summary_mobile.json')
        print(f"Looking for file at: {os.path.abspath(mobile_data_path)}")
        
        if os.path.exists(mobile_data_path):
            with open(mobile_data_path, 'r') as f:
                data = json.load(f)
            return jsonify({
                "success": True,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
        else:
            # Try CSV file instead
            csv_path = os.path.join(DATA_PATH, 'crime_summary_mobile.csv')
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                data = df.to_dict('records')
                return jsonify({
                    "success": True,
                    "data": data,
                    "source": "CSV file",
                    "timestamp": datetime.now().isoformat()
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Crime summary data not found",
                    "checked_paths": [mobile_data_path, csv_path],
                    "available_files": os.listdir(DATA_PATH) if os.path.exists(DATA_PATH) else []
                }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data_path": DATA_PATH,
            "absolute_path": os.path.abspath(DATA_PATH)
        }), 500

@app.route('/api/crime/by-province', methods=['GET'])
def get_crime_by_province():
    """Get crime statistics by province"""
    try:
        province = request.args.get('province', '').strip()
        
        # Load the cleaned crime data
        csv_path = os.path.join(DATA_PATH, 'cleaned_crime_data.csv')
        print(f"Looking for crime data at: {os.path.abspath(csv_path)}")
        
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            print(f"Loaded CSV with columns: {df.columns.tolist()}")
            print(f"CSV shape: {df.shape}")
            
            if province:
                # Filter by specific province
                if 'Province' in df.columns:
                    filtered_df = df[df['Province'].str.contains(province, case=False, na=False)]
                else:
                    # Find province-like column
                    province_cols = [col for col in df.columns if 'province' in col.lower()]
                    if province_cols:
                        filtered_df = df[df[province_cols[0]].str.contains(province, case=False, na=False)]
                    else:
                        return jsonify({
                            "success": False,
                            "error": "No province column found",
                            "available_columns": df.columns.tolist()
                        }), 400
                data = filtered_df.to_dict('records')
            else:
                # Return sample data or summary
                data = df.head(20).to_dict('records')
            
            return jsonify({
                "success": True,
                "data": data,
                "count": len(data),
                "total_records": len(df),
                "columns": df.columns.tolist(),
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Crime data not found",
                "checked_path": csv_path,
                "available_files": os.listdir(DATA_PATH) if os.path.exists(DATA_PATH) else []
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": str(e)
        }), 500

@app.route('/api/crime/mobile-data', methods=['GET'])
def get_mobile_crime_data():
    """Get mobile-optimized crime data"""
    try:
        csv_path = os.path.join(DATA_PATH, 'crime_summary_mobile.csv')
        alt_csv_path = os.path.join(DATA_PATH, 'SouthAfricaCrimeStats_v2.csv')
        
        # Try mobile CSV first
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        elif os.path.exists(alt_csv_path):
            df = pd.read_csv(alt_csv_path)
        else:
            return jsonify({
                "success": False,
                "error": "Mobile crime data not found",
                "checked_paths": [csv_path, alt_csv_path],
                "available_files": os.listdir(DATA_PATH) if os.path.exists(DATA_PATH) else []
            }), 404
        
        # Limit results for mobile performance
        limit = request.args.get('limit', 50, type=int)
        data = df.head(limit).to_dict('records')
        
        return jsonify({
            "success": True,
            "data": data,
            "count": len(data),
            "total_records": len(df),
            "columns": df.columns.tolist(),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/crime/predictions', methods=['GET'])
def get_crime_predictions():
    """Get crime prediction data"""
    try:
        template_path = os.path.join(DATA_PATH, 'prediction_api_template.json')
        if os.path.exists(template_path):
            with open(template_path, 'r') as f:
                data = json.load(f)
            return jsonify({
                "success": True,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Prediction data not found"
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/police/stations', methods=['GET'])
def get_police_stations():
    """Get police station locations (from shapefile data)"""
    try:
        # For now, return a sample response
        # In production, you'd parse the .shp files using geopandas
        return jsonify({
            "success": True,
            "message": "Police station data available - shapefile parsing required",
            "data": {
                "note": "Shapefile data exists but requires geopandas for parsing",
                "files": ["Police_points.shp", "Police_bounds.shp"]
            },
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/crime/search', methods=['GET'])
def search_crime_data():
    """Search crime data by various criteria"""
    try:
        query = request.args.get('q', '').strip()
        crime_type = request.args.get('type', '').strip()
        
        csv_path = os.path.join(DATA_PATH, 'SouthAfricaCrimeStats_v2.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            
            # Apply filters
            if query:
                df = df[df.apply(lambda row: row.astype(str).str.contains(query, case=False).any(), axis=1)]
            
            if crime_type:
                df = df[df['Category'].str.contains(crime_type, case=False, na=False)]
            
            # Limit results
            limit = request.args.get('limit', 100, type=int)
            data = df.head(limit).to_dict('records')
            
            return jsonify({
                "success": True,
                "data": data,
                "count": len(data),
                "query": query,
                "crime_type": crime_type,
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "success": False,
                "error": "Crime statistics data not found"
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
