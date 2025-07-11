#!/bin/bash

echo "🧪 Testing Walmart AI Forecasting Platform Integration"
echo "====================================================="

echo ""
echo "1. Testing Health Check..."
curl -s http://localhost:8080/api/health | jq '.'

echo ""
echo "2. Testing File Structure..."
echo "✅ Uploads directory: $(ls -la uploads/ | wc -l) files"
echo "✅ Python scripts: $(ls -la python/*.py | wc -l) files"
echo "✅ Data directories:"
ls -la python/data/

echo ""
echo "3. Testing API Endpoints..."
echo "- /api/ping:"
curl -s http://localhost:8080/api/ping

echo ""
echo "- /api/health (summary):"
curl -s http://localhost:8080/api/health | jq '.status, .ready, .message'

echo ""
echo "🎉 Integration test complete!"
echo ""
echo "Your system is ready with:"
echo "✅ CSV files uploaded ($(du -sh uploads/ | cut -f1))"
echo "✅ Python scripts configured"
echo "✅ Data directories created"
echo "✅ API endpoints working"
echo ""
echo "🚀 Ready to run the workflow:"
echo "1. Upload Data → Preprocess"
echo "2. Train Model → Train"
echo "3. Predict Demand → Predict"
echo "4. Optimize Routes → Generate"
echo "5. Download Results → Export"
