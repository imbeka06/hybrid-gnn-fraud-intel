# Hybrid GNN Fraud Intelligence System

> A production-ready fraud detection platform for mobile money ecosystems combining Graph Neural Networks (GNNs), XGBoost, and AI-powered explanations for analyst-driven investigations.

---

## 🚀 User Access Levels

### 👤 Common User / Mwananchi  
https://hybrid-gnn-fraud-intel.netlify.app/mobile

### 🕵️ Fraud Analyst / Expert  
https://hybrid-gnn-fraud-intel.netlify.app/

---

## 🛠️ Tech Stack

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-red)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135%2B-green)
![React](https://img.shields.io/badge/React-19%2B-cyan)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Models Overview](#models-overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Technology Stack](#technology-stack)
- [Dataset & Fraud Scenarios](#dataset--fraud-scenarios)
- [Contributing](#contributing)

## 🎯 Overview

This system implements a **hybrid ensemble approach** to fraud detection, combining the structural pattern recognition of Graph Neural Networks with the velocity-based detection capabilities of XGBoost. It's designed specifically for mobile money ecosystems and can detect complex fraud topologies including:

- **Agent Reversal Scam Rings** - Cyclic transactions with reversals
- **Mule Accounts & SIM Swap** - Star-shaped networks with shared devices
- **Fast Cash-out Explosions** - High-velocity bursts in small time windows
- **Loan Fraud (Synecdoche Circles)** - Dense covert communities with defaults
- **Fraudulent Business Transactions** - Unusual densification patterns

## ✨ Key Features

✅ **Real-time Fraud Detection** - FastAPI backend with live Neo4j graph updates  
✅ **Three Production Models** - Baseline XGBoost, GNN, and Stacked Hybrid ensemble  
✅ **AI-Powered Explanations** - Understand why transactions are flagged  
✅ **Multi-format File Upload** - CSV, PDF, and Word document parsing  
✅ **Live Model Comparison** - Execute and compare all 3 models simultaneously  
✅ **Interactive Dashboard** - React UI with real-time KPIs and analytics  
✅ **Graph Visualization** - Neo4j transaction network topology  
✅ **Alert Management** - Analyst-driven queue with approve/deny actions  
✅ **Compliance Reporting** - CBK AML format compliance dashboard  

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│  │ Dashboard│Transaction│ Network │ Models   │ AI Bot       │  │
│  │ Stats    │Simulator  │ Viz     │ Eval     │ & Explainer  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↕ (HTTP/WebSocket)
┌──────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • /predict - Core fraud detection                       │   │
│  │ • /live-graph - Neo4j visualization                     │   │
│  │ • /run-model-evaluation - Execute Python scripts        │   │
│  │ • /upload-transaction-file - Parse CSV/PDF/DOCX         │   │
│  │ • /run-transaction-comparison - All 3 models            │   │
│  │ • /ai-explain-* - Model & transaction explanations      │   │
│  │ • /dashboard-stats - Real-time KPIs                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                    Databases & Models                            │
│  ┌──────────────────┬──────────────────┬──────────────────┐    │
│  │   Neo4j Graph    │  SQLite History  │  ML Models       │    │
│  │  (Real-time)     │  (Persistence)   │  (Prediction)    │    │
│  └──────────────────┴──────────────────┴──────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## 🤖 Models Overview

### 1. **Baseline XGBoost** (`baseline_xgboost.py`)

**Purpose**: Tabular-only fraud detection baseline without graph intelligence.

**Features Used**:
- `amount` - Transaction amount
- `num_accounts_linked` - Account linkage count
- `shared_device_flag` - Device sharing indicator
- `avg_transaction_amount` - Average transaction size
- `transaction_frequency` - Activity frequency
- `num_unique_recipients` - Unique recipient count
- `transactions_last_24hr` - Recent activity count
- `round_amount_flag` - Round amount indicator
- `night_activity_flag` - Night-time activity flag

**Performance**: Fast, interpretable, effective for velocity-based fraud

**When to Use**: When graph data is unavailable or for real-time high-throughput scenarios

---

### 2. **Graph Neural Network (GNN)** (`evaluate_gnn.py`)

**Purpose**: Detect complex structural fraud patterns through graph topology analysis.

**Architecture**:
- **GNNEncoder**: SAGE layers for node embedding generation
- **EdgeClassifier**: Binary classification on transaction edges
- **HybridGNN**: Full heterogeneous graph model with multi-node-type support

**Node Types**: User, Agent, Device, Institution  
**Edge Types**: P2P Transfer, Withdrawal, Payment, Loan Disbursement, Reversal Request

**Performance**: High accuracy on ring/mule patterns, requires graph construction overhead

**When to Use**: For detecting organized fraud rings and complex network patterns

---

### 3. **Stacked Hybrid** (`stacked_hybrid.py`)

**Purpose**: Ensemble combining GNN embeddings as features into XGBoost for superior performance.

**Pipeline**:
1. Generate GNN embeddings for all users
2. Extract sender/receiver embedding vectors
3. Stack GNN features with tabular features
4. Train XGBoost on combined feature set

**Features**:
- All 9 tabular features from baseline
- GNN sender embeddings (64+ dimensions)
- GNN receiver embeddings (64+ dimensions)
- Auto-detects embedding dimensions

**Performance**: Best overall F1-score, combines structural + behavioral detection

**When to Use**: Production deployment requiring maximum accuracy

---

## 📦 Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- Neo4j 5.0+ (optional, for graph visualization)
- Docker & Docker Compose (optional, for containerized deployment)

### Step 1: Clone Repository

```bash
git clone https://github.com/imbeka06/hybrid-gnn-fraud-intel.git
cd hybrid-gnn-fraud-intel
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 4: Install PyTorch (Critical for ML Pipeline)

```bash
# CPU Version (Windows/Mac/Linux)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# GPU Version (Optional, if CUDA available)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Step 5: Install PyTorch Geometric

```bash
pip install torch-geometric
pip install pyg-lib torch-scatter torch-sparse torch-cluster torch-spline-conv -f https://data.pyg.org/whl/torch-2.0.0+cpu.html
```

### Step 6: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 7: Configure Environment

Create a `.env` file in the project root:

```env
# Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# API
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Model Paths
MODEL_BASELINE_PATH=models/saved/baseline_xgboost.pkl
MODEL_GNN_PATH=models/saved/gnn_edge_classifier.pt
```

## 🚀 Quick Start

### Terminal 1: Start Backend

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
Uvicorn running on http://0.0.0.0:8000
Application startup complete
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v4.X.X  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Terminal 3: Generate Data (Optional)

```bash
cd ml_pipeline/data_gen
python generate_data.py
```

This creates:
- 100,000 transactions
- 10,000 users
- 45-day period
- 2.5% fraud rate
- 5 distinct fraud scenarios

### Access the System

1. **Frontend**:open [http://localhost:5173](http://localhost:5173) (Local Dev)  
or https://hybrid-gnn-fraud-intel.netlify.app/mobile (Mwananchi / Mobile Frontend)
2. **API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
3. **Health Check**: Open [http://localhost:8000/health](http://localhost:8000/health)

## 📁 Project Structure

```
hybrid-gnn-fraud-intel/
├── backend/                          # FastAPI backend
│   ├── main.py                       # 11 API endpoints
│   └── requirements.txt               # Python dependencies
│
├── frontend/                         # React UI
│   ├── src/
│   │   ├── pages/                    # 8 main pages
│   │   ├── components/               # Reusable components
│   │   └── context/                  # State management
│   ├── package.json                  # NPM dependencies
│   └── vite.config.js                # Build configuration
│
├── ml_pipeline/                      # ML models & training
│   ├── models/
│   │   ├── baseline_xgboost.py       # ✅ Baseline model
│   │   ├── evaluate_gnn.py           # ✅ GNN model
│   │   ├── stacked_hybrid.py         # ✅ Hybrid ensemble
│   │   ├── config.py                 # Model configuration
│   │   └── edge_weights.py           # Edge weight calculation
│   ├── features/
│   │   ├── feature_engineering.py    # Feature extraction
│   │   └── graph_features.py         # Graph-based features
│   ├── graph_builder/
│   │   └── neo4j_loader.py           # Neo4j integration
│   ├── data_gen/
│   │   └── generate_data.py          # Synthetic data generation
│   └── training/
│       └── train_gnn.py              # GNN training script
│
├── data/                             # Data directory
│   ├── raw/                          # Original data files
│   │   ├── users.csv
│   │   ├── transactions.csv
│   │   ├── devices.csv
│   │   ├── agents.csv
│   │   └── institutions.csv
│   └── processed/                    # Processed data
│       ├── final_model_data.csv
│       ├── user_embeddings.csv
│       ├── hetero_graph.pt
│       └── gnn_probabilities.csv
│
├── models/                           # Trained models
│   └── saved/
│       ├── baseline_xgboost.pkl      # XGBoost model
│       ├── gnn_edge_classifier.pt    # GNN model
│       └── latest_gnn_metrics.json   # Evaluation metrics
│
├── tests/                            # Test suite
│   ├── test_api.py
│   ├── test_gnn.py
│   ├── test_hybrid_pipeline.py
│   └── run_tests.py
│
├── docs/                             # Documentation
│   ├── System_Design_Document.md
│   ├── IMPLEMENTATION_DETAILS.md
│   ├── QUICK_START_GUIDE.md
│   └── TESTING_CHECKLIST.md
│
├── notebooks/                        # Jupyter notebooks
│   ├── 01_data_exploration.ipynb
│   └── 02_gnn_baseline.ipynb
│
├── docker-compose.yml                # Docker orchestration
├── Dockerfile                        # Container configuration
└── README.md                         # This file
```

## 🔌 API Endpoints

### Core Prediction

```http
POST /predict
Content-Type: application/json

{
  "amount": 50000,
  "velocity": 2,
  "sender_id": "U123",
  "receiver_id": "U456",
  "hour": 14
}
```

**Response**: XGBoost fraud score (0-1)

---

### Real Model Evaluation

```http
GET /run-model-evaluation/{model_type}
```

**Supported Models**: `xgboost`, `gnn`, `stacked_hybrid`

**Response**:
```json
{
  "model": "stacked_hybrid",
  "precision": 0.92,
  "recall": 0.88,
  "f1_score": 0.90,
  "accuracy": 0.95,
  "roc_auc": 0.96,
  "cases_caught": 1850,
  "cases_missed": 250
}
```

---

### File Upload & Parsing

```http
POST /upload-transaction-file
Content-Type: multipart/form-data

[CSV/PDF/DOCX file]
```

**Response**: Array of extracted transactions

---

### Multi-Model Comparison

```http
POST /run-transaction-comparison
Content-Type: application/json

{
  "amount": 25000,
  "velocity": 3,
  "sender_id": "U789",
  "receiver_id": "U999",
  "hour": 23
}
```

**Response**:
```json
{
  "xgboost_score": 0.75,
  "gnn_score": 0.82,
  "hybrid_score": 0.89,
  "consensus_verdict": "FRAUD",
  "agreement_count": 3
}
```

---

### AI Explanations

```http
GET /ai-explain-model/{model_type}
GET /ai-explain-transaction/{tx_id}
```

---

### Dashboard & Monitoring

```http
GET /dashboard-stats
GET /health
GET /live-graph
```

📖 **Full API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (when backend is running)

## 💡 Usage Examples

### Example 1: Run Baseline XGBoost Model

```bash
cd ml_pipeline/models
python baseline_xgboost.py
```

Output:
```
Training Baseline XGBoost (Tabular Features Only)...
Saved model: models/saved/baseline_xgboost.pkl

Classification Report:
              precision    recall  f1-score   support
           0       0.98      0.99      0.98     97500
           1       0.87      0.72      0.79      2500
    accuracy                           0.97    100000
```

---

### Example 2: Run GNN Model Evaluation

```bash
cd ml_pipeline/models
python evaluate_gnn.py
```

Output:
```
Using auto-detected embedding dimension: 64
Loading Graph...
GNN Model on Test Set:
              precision    recall  f1-score   support
           0       0.94      0.96      0.95     97500
           1       0.85      0.78      0.81      2500
Accuracy: 0.94
ROC AUC: 0.91
```

---

### Example 3: Run Stacked Hybrid Ensemble

```bash
cd ml_pipeline/models
python stacked_hybrid.py
```

Output:
```
STACKED HYBRID: running (detailed mode)
Loading Tabular features...
Loading GNN Embeddings (The Stacked Feature)...
Auto-detected embedding dimensions: 64

Classification Report:
              precision    recall  f1-score   support
           0       0.97      0.98      0.97     97500
           1       0.90      0.87      0.88      2500
Accuracy: 0.97
ROC AUC: 0.96
```

---

### Example 4: Frontend - Test Multiple Models

1. Navigate to **Models** page
2. Click **"Run Real Model Evaluation"**
3. Select model: XGBoost → GNN → Stacked Hybrid
4. Compare metrics side-by-side
5. View cases caught vs. missed

---

### Example 5: Upload Transaction File & Compare

1. Go to **Transactions** page
2. Upload CSV/PDF/Word document
3. System auto-extracts transactions
4. Select a transaction
5. Click **"Process & Compare Models"**
6. View XGBoost, GNN, and Hybrid predictions
7. See consensus verdict

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.135+
- **ML**: PyTorch 2.0+, PyTorch Geometric, XGBoost, Scikit-Learn
- **Database**: Neo4j 6.1+, SQLite3
- **Async**: Asyncio, Uvicorn
- **Data**: Pandas, NumPy

### Frontend
- **Framework**: React 19+
- **Build Tool**: Vite 8+
- **Styling**: Tailwind CSS 4+
- **Visualization**: Recharts 3.8+, React Force Graph 2D
- **HTTP**: Axios 1.14+
- **Routing**: React Router 7+

### DevOps
- **Containerization**: Docker, Docker Compose
- **Deployment**: Railway.app, Netlify
- **Testing**: Pytest 9+
- **Linting**: ESLint 9+

## 📊 Dataset & Fraud Scenarios

### Dataset Specifications
- **Total Transactions**: 100,000
- **Unique Users**: 10,000
- **Time Period**: 45 days
- **Fraud Rate**: 2.5% (2,500 fraudulent transactions)
- **Graph Nodes**: 10,000 users + agents + devices + institutions
- **Graph Edges**: 100,000+ transactions

### 5 Modeled Fraud Scenarios

| Scenario | Pattern | Detection | % of Fraud |
|----------|---------|-----------|-----------|
| **Agent Reversal Rings** | Cyclic txns + reversals | Graph cycles + temporal | 25% |
| **Mule/SIM Swap** | Star topology + shared device | Degree centrality + device clustering | 20% |
| **Fast Cash-out** | High-velocity bursts | Velocity features + temporal | 20% |
| **Loan Fraud** | Dense communities + defaults | Community detection | 15% |
| **Business Till Fraud** | Densification patterns | Edge weight analysis | 20% |

## 🧪 Testing

### Run All Tests

```bash
cd tests
python run_tests.py
```

### Individual Test Suites

```bash
# Test API endpoints
pytest test_api.py -v

# Test GNN pipeline
pytest test_gnn.py -v

# Test hybrid model
pytest test_hybrid_pipeline.py -v

# Test file upload
pytest test_file_upload.py -v
```

## 📈 Performance Metrics

### Model Comparison

| Metric | Baseline XGBoost | GNN | Stacked Hybrid |
|--------|-----------------|-----|----------------|
| **Precision** | 0.87 | 0.85 | 0.90 |
| **Recall** | 0.72 | 0.78 | 0.87 |
| **F1-Score** | 0.79 | 0.81 | 0.88 |
| **Accuracy** | 0.97 | 0.94 | 0.97 |
| **ROC AUC** | 0.82 | 0.91 | 0.96 |
| **Latency (ms)** | 5 | 50 | 30 |

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow

```bash
# Install dev dependencies
pip install -r backend/requirements.txt
npm install --prefix frontend

# Run linter
npm run lint --prefix frontend

# Run tests
pytest tests/

# Format code
black ml_pipeline/models/
autopep8 -i backend/main.py
```

## 📝 License

This project is licensed under the MIT License .

## 👥 Collaborators

- [Musa Imbeka](https://github.com/imbeka06)
- [Victor Morara](https://github.com/Morasho)
- [Terry Wambui](https://github.com/wambuiterry)
- [Sidney Muriuki](https://github.com/mathncode-sid)
- [Caro Kitonga](https://github.com/CaroMusangi1)

## 📞 Support & Contact

- **Documentation**: See [docs/](docs/) folder
- **Issues**: [GitHub Issues](https://github.com/imbeka06/hybrid-gnn-fraud-intel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/imbeka06/hybrid-gnn-fraud-intel/discussions)

## 🔗 Related Resources

- [PyTorch Geometric Documentation](https://pytorch-geometric.readthedocs.io/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Documentation](https://react.dev/)
- [Neo4j Python Driver](https://neo4j.com/docs/api/python-driver/current/)

---

Last Updated: May 2026
