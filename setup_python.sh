#!/bin/bash

echo "Setting up Python environment for Walmart Forecasting Platform..."

# Create virtual environment if it doesn't exist
if [ ! -d "python/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv python/venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source python/venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r python/requirements.txt

echo "Python setup complete!"
echo ""
echo "To activate the environment manually:"
echo "source python/venv/bin/activate"
echo ""
echo "Your full-stack Walmart dashboard is ready!"
echo "Frontend: http://localhost:8080"
echo "Backend API: http://localhost:8080/api"
