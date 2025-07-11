#!/usr/bin/env python3
"""
Check if all required Python dependencies are installed.
"""

import sys
import json

def check_dependencies():
    """Check if all required packages are available."""
    required_packages = [
        ('pandas', 'pandas'),
        ('numpy', 'numpy'), 
        ('lightgbm', 'lightgbm'),
        ('sklearn', 'scikit-learn'),
        ('joblib', 'joblib'),
        ('requests', 'requests')
    ]
    
    missing_packages = []
    installed_packages = []
    
    for import_name, package_name in required_packages:
        try:
            __import__(import_name)
            installed_packages.append(package_name)
        except ImportError:
            missing_packages.append(package_name)
    
    result = {
        'status': 'success' if not missing_packages else 'error',
        'installed': installed_packages,
        'missing': missing_packages,
        'message': 'All dependencies installed!' if not missing_packages else f'Missing packages: {", ".join(missing_packages)}'
    }
    
    print(json.dumps(result))
    return len(missing_packages) == 0

if __name__ == "__main__":
    success = check_dependencies()
    sys.exit(0 if success else 1)
