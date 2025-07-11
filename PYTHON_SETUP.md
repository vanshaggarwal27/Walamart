# Python Setup Instructions

## Quick Setup

To get the Python ML components working, you need to install the required dependencies.

### Option 1: Automatic Setup (Recommended)

Run the setup script:

```bash
chmod +x setup_python.sh
./setup_python.sh
```

### Option 2: Manual Installation

1. Install Python dependencies:

```bash
pip install -r python/requirements.txt
```

2. Or install individual packages:

```bash
pip install pandas>=1.5.0 numpy>=1.21.0 lightgbm>=3.3.0 scikit-learn>=1.1.0 joblib>=1.1.0 requests>=2.28.0
```

### Option 3: Using Virtual Environment (Recommended for production)

```bash
# Create virtual environment
python3 -m venv python/venv

# Activate virtual environment
source python/venv/bin/activate  # On Linux/Mac
# or
python/venv/Scripts/activate     # On Windows

# Install dependencies
pip install -r python/requirements.txt
```

## Verification

After installation, you can verify the setup by running:

```bash
python3 python/check_dependencies.py
```

Or refresh the dashboard - the Python status should turn green if everything is installed correctly.

## Troubleshooting

### Common Issues:

1. **"ModuleNotFoundError: No module named 'pandas'"**

   - Run: `pip install pandas`

2. **"Python3 not found"**

   - Make sure Python 3 is installed
   - On some systems, use `python` instead of `python3`

3. **Permission errors**
   - Use `pip install --user` for user-level installation
   - Or use a virtual environment (recommended)

### System-specific Notes:

- **Ubuntu/Debian**: `sudo apt-get install python3-pip`
- **macOS**: Use Homebrew: `brew install python3`
- **Windows**: Download from python.org

## What Gets Installed

The requirements.txt includes:

- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computing
- **lightgbm**: Gradient boosting framework
- **scikit-learn**: Machine learning library
- **joblib**: Lightweight pipelining
- **requests**: HTTP library

These packages are essential for the forecasting and route optimization features.
