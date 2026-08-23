FROM python:3.11-slim

WORKDIR /app

# Install CPU-only PyTorch (pinned to 2.6.0) — must happen before requirements.txt.
# Version is pinned so torch_geometric wheels match exactly. Never use unpinned torch.
RUN pip install --no-cache-dir torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu

# Copy and install remaining dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the full project (backend code + models/saved + data)
COPY . .

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
