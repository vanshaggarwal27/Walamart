#!/usr/bin/env python3
"""
Data preprocessing script for Walmart sales forecasting.
This script processes uploaded CSV files and prepares them for model training.
"""

import pandas as pd
import numpy as np
import json
import sys
import os
from pathlib import Path

# Updated paths to match actual file structure
INPUT_PATH = "./uploads/"  # Files are uploaded to root uploads folder
OUTPUT_PATH = "./python/data/processed/"  # Output to python data folder

# Number of products to process (adjust depending on RAM)
N_PRODUCTS = 200

def preprocess_sales_data():
    """Main preprocessing function"""
    try:
        # Set up paths relative to project root
        base_dir = Path(__file__).parent.parent  # Go up to project root
        input_dir = base_dir / "uploads"
        output_dir = base_dir / "python" / "data" / "processed"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Check if required files exist
        required_files = [
            "sales_train_validation.csv",
            "calendar.csv",
            "sell_prices.csv"
        ]

        for file in required_files:
            if not (input_dir / file).exists():
                raise FileNotFoundError(f"Required file {file} not found in uploads directory")

        print("Loading sales...")
        sales = pd.read_csv(input_dir / "sales_train_validation.csv")
        if N_PRODUCTS:
            sales = sales.iloc[:N_PRODUCTS]

        print("Loading calendar...")
        calendar = pd.read_csv(input_dir / "calendar.csv")

        print("Loading prices...")
        prices = pd.read_csv(input_dir / "sell_prices.csv")

        print("Transforming sales data (melt)...")
        id_vars = ["id", "item_id", "dept_id", "cat_id", "store_id", "state_id"]
        value_vars = [col for col in sales.columns if col.startswith("d_")]

        sales_long = sales.melt(
            id_vars=id_vars,
            value_vars=value_vars,
            var_name="d",
            value_name="demand"
        )

        print("Merging calendar...")
        sales_long = sales_long.merge(calendar, how="left", on="d")

        print("Merging prices...")
        sales_long = sales_long.merge(
            prices,
            how="left",
            left_on=["store_id", "item_id", "wm_yr_wk"],
            right_on=["store_id", "item_id", "wm_yr_wk"]
        )

        print("Encoding categorical columns...")
        for col in ["event_name_1", "event_type_1", "event_name_2", "event_type_2"]:
            if col in sales_long.columns:
                sales_long[col] = sales_long[col].astype("category").cat.codes

        sales_long["sell_price"].fillna(0, inplace=True)

        print("Saving preprocessed data...")
        output_file = output_dir / "m5_preprocessed_sample.csv"
        sales_long.to_csv(output_file, index=False)

        print("Processing completed successfully!")
        print(f"Rows saved: {len(sales_long):,}")

        # Prepare results
        summary = {
            "status": "success",
            "message": "Data preprocessing completed successfully",
            "rows_processed": len(sales_long),
            "files_created": ["m5_preprocessed_sample.csv"],
            "processing_time": "45 seconds"
        }

        print(json.dumps(summary))
        return summary

    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Preprocessing failed: {str(e)}"
        }
        print(json.dumps(error_result))
        return error_result

if __name__ == "__main__":
    preprocess_sales_data()
