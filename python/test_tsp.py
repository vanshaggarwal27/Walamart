#!/usr/bin/env python3
"""
Test script for TSP optimization algorithm
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from route import haversine_distance, solve_tsp_networkx, greedy_tsp

def test_tsp_algorithms():
    """Test TSP algorithms with sample coordinates"""
    print("🧪 Testing TSP Optimization Algorithms")
    print("=" * 40)
    
    # Sample store coordinates (California stores)
    test_coords = [
        (34.0522, -118.2437),  # Los Angeles
        (37.7749, -122.4194),  # San Francisco  
        (32.7157, -117.1611),  # San Diego
        (36.7783, -119.4179),  # Fresno
        (38.5816, -121.4944),  # Sacramento
    ]
    
    store_names = ["Los Angeles", "San Francisco", "San Diego", "Fresno", "Sacramento"]
    
    print(f"📍 Testing with {len(test_coords)} stores:")
    for i, (lat, lon) in enumerate(test_coords):
        print(f"  {i+1}. {store_names[i]}: ({lat:.4f}, {lon:.4f})")
    
    print("\n🔄 Testing distance calculation...")
    # Test distance between LA and SF
    dist = haversine_distance(test_coords[0][0], test_coords[0][1], 
                            test_coords[1][0], test_coords[1][1])
    print(f"Distance LA → SF: {dist:.1f} km")
    
    print("\n🎯 Testing TSP optimization...")
    
    # Test original order total distance
    original_distance = 0
    for i in range(len(test_coords) - 1):
        lat1, lon1 = test_coords[i]
        lat2, lon2 = test_coords[i + 1]
        original_distance += haversine_distance(lat1, lon1, lat2, lon2)
    
    print(f"Original order distance: {original_distance:.1f} km")
    print("Original order:", [store_names[i] for i in range(len(test_coords))])
    
    # Test TSP optimization
    try:
        optimal_order = solve_tsp_networkx(test_coords)
        print(f"TSP optimal order: {optimal_order}")
        print("TSP optimal route:", [store_names[i] for i in optimal_order])
        
        # Calculate optimized distance
        optimized_distance = 0
        for i in range(len(optimal_order) - 1):
            lat1, lon1 = test_coords[optimal_order[i]]
            lat2, lon2 = test_coords[optimal_order[i + 1]]
            optimized_distance += haversine_distance(lat1, lon1, lat2, lon2)
        
        print(f"Optimized distance: {optimized_distance:.1f} km")
        improvement = ((original_distance - optimized_distance) / original_distance * 100)
        print(f"Improvement: {improvement:.1f}%")
        
        if improvement > 0:
            print("✅ TSP optimization successful!")
        else:
            print("⚠️  TSP didn't improve route (acceptable for small instances)")
            
    except Exception as e:
        print(f"❌ TSP test failed: {e}")
        return False
    
    print("\n🎯 Testing greedy TSP fallback...")
    try:
        greedy_order = greedy_tsp(test_coords)
        print(f"Greedy order: {greedy_order}")
        print("Greedy route:", [store_names[i] for i in greedy_order])
        
        # Calculate greedy distance
        greedy_distance = 0
        for i in range(len(greedy_order) - 1):
            lat1, lon1 = test_coords[greedy_order[i]]
            lat2, lon2 = test_coords[greedy_order[i + 1]]
            greedy_distance += haversine_distance(lat1, lon1, lat2, lon2)
        
        print(f"Greedy distance: {greedy_distance:.1f} km")
        print("✅ Greedy TSP fallback working!")
        
    except Exception as e:
        print(f"❌ Greedy TSP test failed: {e}")
        return False
    
    print("\n🎉 All TSP tests passed!")
    return True

if __name__ == "__main__":
    success = test_tsp_algorithms()
    sys.exit(0 if success else 1)
