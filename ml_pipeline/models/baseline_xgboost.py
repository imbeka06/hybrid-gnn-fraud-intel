import os
import pickle
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

print("Our proposal Proof: Baseline XGBoost Evaluation ")

# 1. Load the Enriched Data
df = pd.read_csv('data/processed/final_model_data.csv')

# 2. Strip away the Graph intelligence to create a "Tabular Only" baseline
# We intentionally hide the NetworkX features and we are NOT using the GNN embeddings
graph_features = ['triad_closure_score', 'pagerank_score', 'in_degree', 'out_degree', 'cycle_indicator']
baseline_df = df.drop(columns=graph_features)

# Define our basic tabular features
tabular_features = [
    'amount', 'num_accounts_linked', 'shared_device_flag', 'avg_transaction_amount',
    'transaction_frequency', 'num_unique_recipients', 'transactions_last_24hr',
    'round_amount_flag', 'night_activity_flag'
]

X = baseline_df[tabular_features]
y = baseline_df['is_fraud']

# Keep track of the scenarios for our segmented evaluation
scenarios = baseline_df['fraud_scenario']

# 3. Split the Data (Keeping the scenarios aligned)
X_train, X_test, y_train, y_test, scen_train, scen_test = train_test_split(
    X, y, scenarios, test_size=0.2, random_state=42, stratify=y
)

# 4. Train the Baseline XGBoost Model
print("Training Baseline XGBoost (Tabular Features Only)...")
# Handle class imbalance
pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)
baseline_model = XGBClassifier(
    n_estimators=100, max_depth=6, learning_rate=0.1, scale_pos_weight=pos_weight, random_state=42
)
baseline_model.fit(X_train, y_train)

os.makedirs('models/saved', exist_ok=True)
with open('models/saved/baseline_xgboost.pkl', 'wb') as artifact_file:
    pickle.dump(baseline_model, artifact_file)
print("Saved model: models/saved/baseline_xgboost.pkl")

# 5. Segmented Evaluation (The Proof for your Thesis)
print("\n XGBoost Blind Spot Analysis ")
predictions = baseline_model.predict(X_test)

# Create a results dataframe to see exactly what it missed
results = pd.DataFrame({
    'Actual': y_test,
    'Predicted': predictions,
    'Scenario': scen_test
})

# Filter only the actual fraud cases in the test set
actual_fraud = results[results['Actual'] == 1]

print(f"{'Fraud Topology':<20} | {'Caught (True Pos)'} | {'Missed (False Neg)'} | {'Recall (Detection Rate)'}")
print("-" * 75)

for scenario in actual_fraud['Scenario'].unique():
    scenario_data = actual_fraud[actual_fraud['Scenario'] == scenario]
    total_cases = len(scenario_data)
    caught = sum(scenario_data['Predicted'] == 1)
    missed = total_cases - caught
    recall = (caught / total_cases) * 100
    
    print(f"{scenario:<20} | {caught:<17} | {missed:<18} | {recall:.1f}%")

print("\nConclusion for Research Proposal by group 15:")
print("Look at the Recall for 'fraud_ring' vs 'fast_cashout'. This is our proof.")