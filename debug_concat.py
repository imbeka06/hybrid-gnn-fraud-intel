import pandas as pd

df = pd.read_csv('data/processed/final_model_data.csv')
probs_df = pd.read_csv('data/processed/gnn_probabilities.csv')

print(f'final_model_data.csv: {len(df)} rows')
print(f'gnn_probabilities.csv: {len(probs_df)} rows')
print(f'Rows match: {len(df) == len(probs_df)}')
print()

# Check columns
print('Columns in final_model_data:', list(df.columns))
print()
print('Columns in gnn_probabilities:', list(probs_df.columns))
print()

# Check if is_fraud column has NaNs in either file
print(f'is_fraud NaNs in final_model_data: {df["is_fraud"].isna().sum()}')
print()

# Simulate the concat
hybrid_df = pd.concat([df, probs_df], axis=1)
print(f'After concat: {len(hybrid_df)} rows')
print(f'is_fraud NaNs after concat: {hybrid_df["is_fraud"].isna().sum()}')
print()
print('First few rows of is_fraud after concat:')
print(hybrid_df['is_fraud'].head(10))
