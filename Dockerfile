FROM python:3.11-slim

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the full project
COPY . .

# Build the React frontend
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps && npm run build
WORKDIR /app

# Expose port (Koyeb sets PORT env var)
EXPOSE 8000

# Start with gunicorn
CMD gunicorn backend.api_server:app --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
