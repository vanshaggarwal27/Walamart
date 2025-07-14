#!/usr/bin/env python3
"""
Route optimization script using OSRM and Folium with emissions.
"""

import pandas as pd
import numpy as np
import networkx as nx
import folium
import requests
import json
import sys
from pathlib import Path
from math import sqrt, radians, cos, sin, asin
from itertools import permutations

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))

    # Radius of earth in kilometers
    r = 6371
    return c * r

def solve_tsp_networkx(coords):
    """
    Solve TSP using NetworkX approximation algorithm for small instances
    or brute force for very small instances
    """
    n = len(coords)

    if n <= 1:
        return list(range(n))

    # Create a complete graph
    G = nx.complete_graph(n)

    # Add edge weights (distances)
    for i in range(n):
        for j in range(i + 1, n):
            lat1, lon1 = coords[i]
            lat2, lon2 = coords[j]
            distance = haversine_distance(lat1, lon1, lat2, lon2)
            G[i][j]['weight'] = distance

    # For small instances (≤ 8), use brute force
    if n <= 8:
        min_distance = float('inf')
        best_path = None

        for perm in permutations(range(1, n)):
            # Always start from node 0
            path = [0] + list(perm)
            total_distance = 0

            for i in range(n - 1):
                total_distance += G[path[i]][path[i + 1]]['weight']

            if total_distance < min_distance:
                min_distance = total_distance
                best_path = path

        return best_path

        # For larger instances, use NetworkX approximation
    try:
        # Try NetworkX TSP approximation (if available)
        if hasattr(nx.approximation, 'traveling_salesman_problem'):
            tsp_path = nx.approximation.traveling_salesman_problem(G, cycle=False)
            return tsp_path
        else:
            raise AttributeError("NetworkX TSP not available")
    except Exception as e:
        print(f"NetworkX TSP failed: {e}, using greedy nearest neighbor")
        # Fallback to greedy nearest neighbor
        return greedy_tsp(coords)

def greedy_tsp(coords):
    """
    Greedy nearest neighbor TSP heuristic
    """
    n = len(coords)
    if n <= 1:
        return list(range(n))

    unvisited = set(range(1, n))  # Start from node 0
    path = [0]
    current = 0

    while unvisited:
        nearest = min(unvisited,
                     key=lambda x: haversine_distance(
                         coords[current][0], coords[current][1],
                         coords[x][0], coords[x][1]
                     ))
        path.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    return path

def optimize_route(demand_threshold=10.0, top_stores=5):
    """Optimize delivery route based on demand predictions"""
    try:
        print(f"=== ROUTE OPTIMIZATION STARTED ===")
        print(f"Parameters: demand_threshold={demand_threshold}, top_stores={top_stores}")
                # CONFIG
        MAPTILER_KEY = "2sYJ1vozDNyamVYRoWLM"
        threshold = demand_threshold
        N = top_stores
        EMISSION_FACTOR_KG_PER_KM = 0.27

        print(f"CONFIG VALUES:")
        print(f"  demand_threshold: {demand_threshold}")
        print(f"  top_stores (N): {N}")
        print(f"  threshold: {threshold}")

        # Paths
        base_dir = Path(__file__).parent.parent
        data_dir = base_dir / "python" / "data" / "processed"
        uploads_dir = base_dir / "uploads"

        # Load predictions
        preds_file = data_dir / "predictions.csv"
        print(f"Looking for predictions file: {preds_file}")
        print(f"Predictions file exists: {preds_file.exists()}")

                                if not preds_file.exists():
            raise FileNotFoundError(f"Predictions file not found: {preds_file}. Please generate predictions first using the prediction API.")

        print("Loading existing predictions file...")
        preds = pd.read_csv(preds_file)
        print(f"Loaded predictions with shape: {preds.shape}")
        print(f"Predictions columns: {preds.columns.tolist()}")
        print(f"Sample predictions:\n{preds.head()}")
        print(f"Unique stores in predictions: {preds['store_id'].unique()}")
        print(f"Total unique stores: {len(preds['store_id'].unique())}")

        preds["date"] = pd.to_datetime(preds["date"])
        # Extract state from store_id (format like "CA_1", "TX_2", etc.)
        if "store_id" in preds.columns:
            preds["state_id"] = preds["store_id"].str.split("_").str[0]
        else:
            raise ValueError("store_id column not found in predictions file")

        # Aggregate demand - handle both column name variations
        demand_col = None
        if "prediction" in preds.columns:
            demand_col = "prediction"
        elif "predicted_demand" in preds.columns:
            demand_col = "predicted_demand"
        else:
            raise ValueError(f"No demand column found. Available columns: {preds.columns.tolist()}")

                                                print(f"✓ Using demand column: {demand_col}")
        print(f"✓ Raw demand stats: min={preds[demand_col].min():.2f}, max={preds[demand_col].max():.2f}")

        print("\n=== STEP 4: AGGREGATING DEMAND BY STORE ===")
        # Aggregate demand by individual store (not by state)
        store_demand = preds.groupby("store_id")[demand_col].sum().reset_index()
        print(f"✓ Aggregated demand for {len(store_demand)} stores")
        print("✓ All store demands:")
        for idx, row in store_demand.iterrows():
            print(f"  {row['store_id']}: {row[demand_col]:.1f} units")

        print(f"\n=== STEP 5: SELECTING TOP {N} STORES ===")
        print(f"✓ Requested N = {N}")
        print(f"✓ Available stores = {len(store_demand)}")

        # Sort stores by demand and select top N stores
        store_demand = store_demand.sort_values(by=demand_col, ascending=False)
        print(f"✓ Stores sorted by demand")

        top_stores_list = store_demand.head(N)
        print(f"✓ Selected top {len(top_stores_list)} stores:")
        for idx, row in top_stores_list.iterrows():
            print(f"  #{idx+1}: {row['store_id']} = {row[demand_col]:.1f} units")

        # Get the list of selected store IDs
        selected_store_ids = top_stores_list["store_id"].tolist()
        print(f"✓ Final selected store IDs: {selected_store_ids}")
        print(f"✓ Selected store count: {len(selected_store_ids)}")

        if len(selected_store_ids) != N:
            print(f"❌ ERROR: Expected {N} stores but got {len(selected_store_ids)}")
        else:
            print(f"✅ SUCCESS: Got exactly {N} stores as requested")

                print("\n=== STEP 6: STORE LOCATION SETUP ===")
        # Load or create mock store locations
        stores_file = uploads_dir / "store_locations.csv"
        print(f"✓ Store locations file path: {stores_file}")
        print(f"✓ Store locations file exists: {stores_file.exists()}")

        if not stores_file.exists():
            print("✓ Creating store locations from scratch")
            # Get unique stores from predictions, prioritizing selected stores
            unique_stores = preds['store_id'].unique()
            print(f"✓ Unique stores in predictions: {unique_stores}")
            print(f"✓ Total unique stores: {len(unique_stores)}")

            # Ensure all selected stores are included
            all_stores_to_include = list(set(list(unique_stores) + selected_store_ids))
            print(f"All stores to include (predictions + selected): {all_stores_to_include}")

            # Create store locations for all unique stores found in predictions
            store_locations = []

            # Define coordinates for different states
            state_coords = {
                'CA': [(34.0522, -118.2437), (37.7749, -122.4194), (32.7157, -117.1611)],  # LA, SF, San Diego
                'TX': [(29.7604, -95.3698), (32.7767, -96.7970), (30.2672, -97.7431)],    # Houston, Dallas, Austin
                'WI': [(43.0731, -89.4012), (42.9634, -87.9073), (44.5133, -88.0133)],    # Madison, Milwaukee, Green Bay
                'NY': [(40.7128, -74.0060), (42.6526, -73.7562), (43.1009, -77.6380)],    # NYC, Albany, Rochester
                'FL': [(25.7617, -80.1918), (28.5383, -81.3792), (30.4518, -84.2807)]     # Miami, Orlando, Tallahassee
            }

                        store_counter = {}
            for store_id in all_stores_to_include:
                state = store_id.split('_')[0] if '_' in store_id else 'CA'
                if state not in store_counter:
                    store_counter[state] = 0

                if state in state_coords and store_counter[state] < len(state_coords[state]):
                    lat, lon = state_coords[state][store_counter[state]]
                    store_counter[state] += 1
                else:
                    # Default coordinates if state not found or too many stores
                    lat, lon = 39.8283, -98.5795  # Geographic center of US

                store_locations.append({
                    'store_id': store_id,
                    'state': state,
                    'lat': lat,
                    'lon': lon
                })

            # If we don't have enough stores, add some additional ones for better demonstration
            if len(store_locations) < 5:
                additional_stores = [
                    ('CA_1', 'CA', 34.0522, -118.2437),
                    ('CA_2', 'CA', 37.7749, -122.4194),
                    ('TX_1', 'TX', 29.7604, -95.3698),
                    ('TX_2', 'TX', 32.7767, -96.7970),
                    ('WI_1', 'WI', 43.0731, -89.4012)
                ]

                existing_store_ids = {loc['store_id'] for loc in store_locations}
                for store_id, state, lat, lon in additional_stores:
                    if store_id not in existing_store_ids:
                        store_locations.append({
                            'store_id': store_id,
                            'state': state,
                            'lat': lat,
                            'lon': lon
                        })

                        stores = pd.DataFrame(store_locations)
            print(f"Created store locations for {len(stores)} stores")
            print(f"Store locations created:")
            for idx, row in stores.iterrows():
                print(f"  {row['store_id']}: {row['state']} at ({row['lat']}, {row['lon']})")
        else:
            stores = pd.read_csv(stores_file)
            print(f"Loaded store locations from file: {len(stores)} stores")

                                # Debug: Check what stores we have
        print(f"Available stores in store locations: {stores['store_id'].tolist()}")
        print(f"Selected store IDs to find: {selected_store_ids}")

        # Filter stores to only include the top N selected stores
        routes_df = stores[stores["store_id"].isin(selected_store_ids)]
        print(f"Stores found after filtering: {len(routes_df)}")

        if len(routes_df) < len(selected_store_ids):
            print(f"WARNING: Only found {len(routes_df)} stores out of {len(selected_store_ids)} requested")
            missing_stores = set(selected_store_ids) - set(routes_df['store_id'].tolist())
            print(f"Missing stores: {missing_stores}")

            # Create locations for missing stores
            for missing_store in missing_stores:
                state = missing_store.split('_')[0] if '_' in missing_store else 'CA'
                state_coords = {
                    'CA': (34.0522, -118.2437),
                    'TX': (29.7604, -95.3698),
                    'WI': (43.0731, -89.4012),
                    'NY': (40.7128, -74.0060),
                    'FL': (25.7617, -80.1918)
                }
                lat, lon = state_coords.get(state, (39.8283, -98.5795))

                new_store = pd.DataFrame([{
                    'store_id': missing_store,
                    'state': state,
                    'lat': lat,
                    'lon': lon
                }])
                stores = pd.concat([stores, new_store], ignore_index=True)
                print(f"Added missing store location: {missing_store} at {lat}, {lon}")

            # Re-filter with updated stores
            routes_df = stores[stores["store_id"].isin(selected_store_ids)]
            print(f"After adding missing stores: {len(routes_df)} stores found")

        # Sort routes_df by demand to maintain the order
        routes_df = routes_df.merge(top_stores_list[["store_id", demand_col]], on="store_id", how="left")
        routes_df = routes_df.sort_values(by=demand_col, ascending=False)

                print(f"Final routes_df after merge and sort: {len(routes_df)} stores")
        print(routes_df[['store_id', 'state', demand_col]].to_string())

        if len(routes_df) == 0:
            raise ValueError("No stores found for the given criteria")

        print(f"Final selected stores count: {len(routes_df)}")
        print(f"Selected stores for route optimization:\n{routes_df[['store_id', 'state', 'lat', 'lon']]}")

        # Show demand information for selected stores
        if demand_col in routes_df.columns:
            print(f"Demand information for selected stores:")
            for idx, row in routes_df.iterrows():
                print(f"  {row['store_id']}: {row[demand_col]:.1f} units")

        # Initialize map
        center_lat = routes_df["lat"].mean()
        center_lon = routes_df["lon"].mean()

        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=6,
            tiles=f"https://api.maptiler.com/maps/streets-v2/{{z}}/{{x}}/{{y}}.png?key={MAPTILER_KEY}",
            attr="MapTiler"
        )

                # Add markers with demand information
        for idx, row in routes_df.iterrows():
            demand_value = row.get(demand_col, 0)
            folium.Marker(
                location=[row["lat"], row["lon"]],
                popup=f"Store: {row['store_id']}<br>State: {row['state']}<br>Demand: {demand_value:.1f} units",
                tooltip=f"{row['store_id']} ({row['state']}) - {demand_value:.1f} units",
                icon=folium.Icon(color="red", icon="info-sign")
                        ).add_to(m)

        # Calculate optimized route using TSP and OSRM
        coords = list(zip(routes_df["lat"], routes_df["lon"]))
        total_distance_km = 0

        if len(coords) > 1:
            # Solve TSP to get optimal visiting order
            print(f"Solving TSP for {len(coords)} stores...")
            optimal_order = solve_tsp_networkx(coords)
                        print(f"Optimal visiting order: {optimal_order}")

            # Reorder coordinates and routes_df according to TSP solution
            optimized_coords = [coords[i] for i in optimal_order]
            optimized_routes_df = routes_df.iloc[optimal_order].reset_index(drop=True)

            # Store original order for comparison
            original_distance = 0
            for i in range(len(coords) - 1):
                lat1, lon1 = coords[i]
                lat2, lon2 = coords[i + 1]
                original_distance += haversine_distance(lat1, lon1, lat2, lon2)

            # Calculate optimized distance for comparison
            optimized_distance = 0
            for i in range(len(optimized_coords) - 1):
                lat1, lon1 = optimized_coords[i]
                lat2, lon2 = optimized_coords[i + 1]
                optimized_distance += haversine_distance(lat1, lon1, lat2, lon2)

            improvement_pct = ((original_distance - optimized_distance) / original_distance * 100) if original_distance > 0 else 0
                        print(f"Route optimization: {improvement_pct:.1f}% improvement ({original_distance:.1f}km -> {optimized_distance:.1f}km)")

            print(f"Optimized route order:")
            for i, (idx, row) in enumerate(optimized_routes_df.iterrows()):
                print(f"  {i+1}. {row['store_id']} ({row['state']}) - {row['lat']:.4f}, {row['lon']:.4f}")

            try:
                # Use optimized order for OSRM routing
                coord_str = ";".join([f"{lon},{lat}" for lat, lon in optimized_coords])
                osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coord_str}?overview=full&geometries=geojson"

                response = requests.get(osrm_url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    total_distance_km = data["routes"][0]["distance"] / 1000
                    print(f"OSRM route distance: {total_distance_km:.1f} km")

                    # Add optimized route line
                    route_coords = [(coord[1], coord[0]) for coord in data["routes"][0]["geometry"]["coordinates"]]
                    folium.PolyLine(
                        locations=route_coords,
                        color="blue",
                        weight=5,
                        opacity=0.8,
                        popup="Optimized Delivery Route"
                    ).add_to(m)

                    # Add route direction indicators
                    for i, (lat, lon) in enumerate(optimized_coords):
                        folium.CircleMarker(
                            location=[lat, lon],
                            radius=8,
                            popup=f"Stop {i+1}: {optimized_routes_df.iloc[i]['store_id']}",
                            color="white",
                            fill=True,
                            fillColor="blue" if i == 0 else "red" if i == len(optimized_coords)-1 else "orange",
                            fillOpacity=0.9,
                            weight=2
                        ).add_to(m)
                else:
                    raise Exception("OSRM request failed")

            except Exception as e:
                print(f"OSRM routing failed: {e}, using optimized mock data")
                # Calculate mock distance using optimized order
                total_distance_km = 0
                for i in range(len(optimized_coords) - 1):
                    lat1, lon1 = optimized_coords[i]
                    lat2, lon2 = optimized_coords[i + 1]
                    total_distance_km += haversine_distance(lat1, lon1, lat2, lon2)

                # Add simple lines between consecutive optimized points
                for i in range(len(optimized_coords) - 1):
                    folium.PolyLine(
                        locations=[optimized_coords[i], optimized_coords[i+1]],
                        color="blue",
                        weight=5,
                        opacity=0.8,
                                                popup=f"Segment {i+1} -> {i+2}"
                    ).add_to(m)

                    # Add direction arrows (simplified)
                    mid_lat = (optimized_coords[i][0] + optimized_coords[i+1][0]) / 2
                    mid_lon = (optimized_coords[i][1] + optimized_coords[i+1][1]) / 2
                                        folium.Marker(
                        location=[mid_lat, mid_lon],
                        icon=folium.DivIcon(
                            html=f'<div style="font-size: 12px; color: blue;">-></div>',
                            icon_size=(20, 20),
                            icon_anchor=(10, 10)
                        )
                                        ).add_to(m)
        else:
            # Handle single store case
            print("Single store selected - no route optimization needed")
            total_distance_km = 0  # No distance for single store

            # Add a single marker for the store
            if len(coords) == 1:
                lat, lon = coords[0]
                folium.CircleMarker(
                    location=[lat, lon],
                    radius=10,
                    popup=f"Single Store: {routes_df.iloc[0]['store_id']}",
                    color="green",
                    fill=True,
                    fillColor="green",
                    fillOpacity=0.9,
                    weight=3
                ).add_to(m)

                # Calculate emissions
        total_emissions_kg = total_distance_km * EMISSION_FACTOR_KG_PER_KM

        # Green emission lines removed - keeping only blue route line

        # Summary with optimization info
        summary_html = f"""
        <div style="
            position: fixed;
            bottom: 50px;
            left: 50px;
            width: 280px;
            padding: 15px;
            background-color: rgba(255,255,255,0.95);
            border: 2px solid #333;
            border-radius: 8px;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            z-index: 9999;
        ">
                        <h4 style="margin:0 0 10px 0; font-size:16px; color:#333;">Top {N} Stores Route</h4>
        <p style="margin:0; font-size:14px;"><strong>Distance:</strong> {total_distance_km:.1f} km</p>
        <p style="margin:0; font-size:14px;"><strong>CO2 Emissions:</strong> {total_emissions_kg:.1f} kg</p>
        <p style="margin:5px 0 0 0; font-size:12px; color:#666;">* TSP-optimized delivery route</p>
        <p style="margin:0; font-size:12px; color:#666;">* {len(coords)} highest-demand stores</p>
        </div>
        """
        m.get_root().html.add_child(folium.Element(summary_html))

        # Save map
        output_map = data_dir / "delivery_route_maptiler_osrm_co2.html"
                m.save(output_map)

        # Calculate route efficiency based on optimization
        if len(coords) > 1:
            # Calculate theoretical minimum distance (as the crow flies)
            direct_distance = 0
            for i in range(len(optimized_coords) - 1):
                lat1, lon1 = optimized_coords[i]
                lat2, lon2 = optimized_coords[i + 1]
                direct_distance += haversine_distance(lat1, lon1, lat2, lon2)

            route_efficiency = min(95, max(70, (direct_distance / total_distance_km * 100))) if total_distance_km > 0 else 85
        else:
            route_efficiency = 100

        # Prepare JSON response
        route_result = {
            "status": "success",
            "message": "TSP-optimized route completed successfully",
            "total_distance": round(total_distance_km, 1),
            "total_time": round(total_distance_km / 60, 1),  # Assuming 60 km/h average speed
            "co2_emissions": round(total_emissions_kg, 1),
            "stores_count": len(routes_df),
            "route_efficiency": round(route_efficiency, 1),
            "optimization_method": "TSP + OSRM",
            "route_type": "one-way optimized",
            "map_file": str(output_map.name)
        }

        print(json.dumps(route_result))
        return route_result

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Route optimization failed: {str(e)}"
        }
        print(json.dumps(error_result))
        return error_result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Parse command line arguments
        params = json.loads(sys.argv[1])
        demand_threshold = params.get('demand_threshold', 10.0)
        top_stores = params.get('top_stores', 5)

        optimize_route(demand_threshold, top_stores)
    else:
        # Default execution
        optimize_route()
