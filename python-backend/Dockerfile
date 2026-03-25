FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install the package in editable mode
RUN pip install -e .

# Default port (Railway sets PORT env var)
ENV PORT=8000
EXPOSE $PORT

# Run the application (shell form to expand $PORT)
CMD uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
