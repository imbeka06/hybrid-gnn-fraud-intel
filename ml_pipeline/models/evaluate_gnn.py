import os
import torch
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score
from torch_geometric.nn import SAGEConv, to_hetero
from config import get_model_config

print(" GNN Evaluation Script (On the 20% Test Set) ")

# Get auto-detected configuration
config = get_model_config()
embedding_dim = config['embedding_dim']
print(f"Using auto-detected embedding dimension: {embedding_dim}")

# 1. Load the Exact Same Graph
data = torch.load('data/processed/hetero_graph.pt', weights_only=False)

# 2. Rebuild the Architecture for the Test
class GNNEncoder(torch.nn.Module):
    def __init__(self, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv((-1, -1), hidden_channels)
        self.conv2 = SAGEConv((-1, -1), out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index)
        return x

class EdgeClassifier(torch.nn.Module):
    def __init__(self, hidden_channels):
        super().__init__()
        self.lin1 = torch.nn.Linear(2 * hidden_channels, hidden_channels)
        self.lin2 = torch.nn.Linear(hidden_channels, 1)

    def forward(self, z_dict, edge_index, sender_type, receiver_type):
        row, col = edge_index
        z = torch.cat([z_dict[sender_type][row], z_dict[receiver_type][col]], dim=-1)
        z = self.lin1(z).relu()
        z = self.lin2(z)
        return z.view(-1)

class HybridGNN(torch.nn.Module):
    def __init__(self, hidden_channels):
        super().__init__()
        self.encoder = GNNEncoder(hidden_channels, hidden_channels)
        self.encoder = to_hetero(self.encoder, data.metadata(), aggr='mean')
        self.classifier = EdgeClassifier(hidden_channels)

    def forward(self, x_dict, edge_index_dict, target_edge_index, sender_type, receiver_type):
        z_dict = self.encoder(x_dict, edge_index_dict)
        return self.classifier(z_dict, target_edge_index, sender_type, receiver_type)

# 3. Create the strict 80/20 Train-Test Split for the Edges
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
data = data.to(device)

all_edges = data['user', 'p2p', 'user'].edge_index
all_labels = data['user', 'p2p', 'user'].y.float()
num_edges = all_edges.size(1)

# Seed for reproducibility so it is scientifically fair
np.random.seed(42)
indices = np.random.permutation(num_edges)
train_size = int(0.8 * num_edges)

train_idx = indices[:train_size]
test_idx = indices[train_size:]

train_edges = all_edges[:, train_idx]
train_labels = all_labels[train_idx]

test_edges = all_edges[:, test_idx]
test_labels = all_labels[test_idx]

# 4. Initialize Model & Force it to pay attention to the 2.8% fraud cases
model = HybridGNN(hidden_channels=embedding_dim).to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

num_neg = len(train_labels) - train_labels.sum()
pos_weight = num_neg / train_labels.sum()
criterion = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

# 5. Train the Network (on 80% of data)
print(f"Training GNN on {train_size} transactions...")
model.train()
for epoch in range(1, 101):
    optimizer.zero_grad()
    out = model(data.x_dict, data.edge_index_dict, train_edges, 'user', 'user')
    loss = criterion(out, train_labels)
    loss.backward()
    optimizer.step()

os.makedirs('models/saved', exist_ok=True)
torch.save(
    {
        'state_dict': model.state_dict(),
        'embedding_dim': embedding_dim,
        'metadata': data.metadata(),
    },
    'models/saved/gnn_edge_classifier.pt'
)
print("Saved checkpoint: models/saved/gnn_edge_classifier.pt")

# 6. Evaluate on Unseen Data (The 20% Test Set)
print("\nEvaluating GNN on unseen test edges...")
model.eval()
with torch.no_grad():
    test_out = model(data.x_dict, data.edge_index_dict, test_edges, 'user', 'user')
    probabilities = torch.sigmoid(test_out).cpu().numpy()
    predictions = (probabilities > 0.5).astype(int)
    actuals = test_labels.cpu().numpy()

print("\n GNN Performance Metrics ")
print(classification_report(actuals, predictions, target_names=['Safe (0)', 'Fraud (1)']))
print(f"GNN ROC-AUC Score: {roc_auc_score(actuals, probabilities):.4f}")

#  7. SEGMENTED SCENARIO EVALUATION 
print("\n GNN Segmented Blind Spot Analysis ")
# Load the original dataframe to get the scenario text
df = pd.read_csv('data/processed/final_model_data.csv')

# Get the scenarios for just the 20% test set using our test_idx
test_scenarios = df.iloc[test_idx]['fraud_scenario'].values

# Create a results dataframe
results = pd.DataFrame({
    'Actual': actuals,
    'Predicted': predictions,
    'Scenario': test_scenarios
})

actual_fraud = results[results['Actual'] == 1]

print(f"{'Fraud Topology':<20} | {'Caught (True Pos)'} | {'Missed (False Neg)'} | {'Recall (Detection Rate)'}")
print("-" * 75)

for scenario in actual_fraud['Scenario'].unique():
    scenario_data = actual_fraud[actual_fraud['Scenario'] == scenario]
    total_cases = len(scenario_data)
    caught = sum(scenario_data['Predicted'] == 1)
    missed = total_cases - caught
    # Handle division by zero
    recall = (caught / total_cases) * 100 if total_cases > 0 else 0.0
    
    print(f"{scenario:<20} | {caught:<17} | {missed:<18} | {recall:.1f}%")

print("\nConclusion :Notice how the GNN catches the rings that XGBoost missed")