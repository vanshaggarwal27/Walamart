#!/usr/bin/env python3
"""
LightGBM model training script for Walmart sales forecasting.
"""

import pandas as pd
import lightgbm as lgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from math import sqrt
import json
import sys
import os
import joblib
import time
from pathlib import Path

def train_model():
    """Train LightGBM model for sales forecasting"""
    try:
        start_time = time.time()

        # Project root
        base_dir = Path(__file__).parent.parent
        data_dir = base_dir / "python" / "data" / "processed"
        model_dir = base_dir / "python" / "models"
        model_dir.mkdir(parents=True, exist_ok=True)

        # Input file
        input_csv = data_dir / "m5_preprocessed_sample.csv"
        if not input_csv.exists():
            raise FileNotFoundError("Processed data not found. Please run preprocessing first.")

        print("Loading data...")
        df = pd.read_csv(input_csv)
        print(f"Rows loaded: {len(df):,}")
        print("Columns:", df.columns.tolist())

        # Encode date features
        if 'date' in df.columns:
            df["date"] = pd.to_datetime(df["date"])
            df["weekday"] = df["date"].dt.weekday
            df["month"] = df["date"].dt.month
            df["year"] = df["date"].dt.year
        else:
            df["weekday"] = 0
            df["month"] = 1
            df["year"] = 2024

        # Clean NaNs
        if 'sell_price' in df.columns:
            df["sell_price"] = df["sell_price"].fillna(0)
        else:
            df["sell_price"] = 10.0

        # Target column
        target_col = "demand"
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in data")

        df = df[df[target_col].notnull()]

        feature_cols = ["sell_price", "weekday", "month", "year"]

        # Split train/validation
        if 'date' in df.columns:
            cutoff_date = df["date"].max() - pd.Timedelta(days=28)
            train_df = df[df["date"] <= cutoff_date]
            val_df = df[df["date"] > cutoff_date]
        else:
            train_df = df.sample(frac=0.8, random_state=42)
            val_df = df.drop(train_df.index)

        print(f"Train rows: {len(train_df):,}")
        print(f"Validation rows: {len(val_df):,}")

        train_set = lgb.Dataset(train_df[feature_cols], label=train_df[target_col])
        val_set = lgb.Dataset(val_df[feature_cols], label=val_df[target_col])

        params = {
            "objective": "regression",
            "metric": "rmse",
            "verbosity": -1,
            "boosting_type": "gbdt",
            "learning_rate": 0.05,
            "num_leaves": 31,
            "seed": 42,
        }

        print("Training model...")
        model = lgb.train(
            params,
            train_set,
            num_boost_round=100,
            valid_sets=[val_set],
            callbacks=[
                lgb.early_stopping(stopping_rounds=10),
                lgb.log_evaluation(0)
            ]
        )

        print("Predicting...")
        val_preds = model.predict(val_df[feature_cols], num_iteration=model.best_iteration)

        rmse = sqrt(mean_squared_error(val_df[target_col], val_preds))
        mae = mean_absolute_error(val_df[target_col], val_preds)
        r2 = r2_score(val_df[target_col], val_preds)

        print(f"Validation RMSE: {rmse:.4f}")
        print(f"Validation MAE: {mae:.4f}")
        print(f"R² Score: {r2:.4f}")

        # Save model
        model_path = model_dir / "lgbm_model.txt"
        model.save_model(str(model_path))
        joblib_path = model_dir / "lightgbm_model.pkl"
        joblib.dump(model, joblib_path)

        # Save features
        feature_file = model_dir / "feature_names.json"
        with open(feature_file, "w") as f:
            json.dump(feature_cols, f)

        print(f"Model saved to {model_path}")

        training_time = time.time() - start_time

        # Print training completion info
        if training_time < 60:
            time_str = f"{training_time:.2f} seconds"
        else:
            time_str = f"{int(training_time // 60)} minutes {training_time % 60:.1f} seconds"

        print(f"Training completed in {time_str}")
        print(f"Model saved successfully!")

        # Must be LAST line: JSON output
        print(json.dumps({
            "status": "success",
            "message": "Model training completed successfully",
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "r2_score": round(r2, 3),
            "training_time": f"{training_time:.2f}s" if training_time < 60 else f"{int(training_time // 60)}m {training_time % 60:.1f}s",
            "model_file": "lgbm_model.txt",
            "features_used": feature_cols,
            "training_samples": len(train_df),
            "test_samples": len(val_df)
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))

if __name__ == "__main__":
    train_model()
