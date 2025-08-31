#!/bin/bash

echo "Testing Crime Statistics API..."

API_URL="http://localhost:5000"

echo "1. Testing API Info:"
curl -s "$API_URL/" | python -m json.tool

echo -e "\n\n2. Testing Crime Summary:"
curl -s "$API_URL/api/crime/summary" | python -m json.tool | head -20

echo -e "\n\n3. Testing Province Data:"
curl -s "$API_URL/api/crime/by-province" | python -m json.tool | head -20

echo -e "\n\n4. Testing Mobile Data:"
curl -s "$API_URL/api/crime/mobile-data?limit=5" | python -m json.tool | head -20

echo -e "\n\nAPI testing complete!"
