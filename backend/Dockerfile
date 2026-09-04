FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_HTTP_TIMEOUT=300

WORKDIR /app

# Install system dependencies if required (e.g. build tools, libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv for ultra-fast dependency installation, or fallback to pip
RUN pip install --no-cache-dir uv

# Copy dependency definition
COPY pyproject.toml .

# Install dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy project files
COPY . .

EXPOSE 8000

# Dev (compose): uvicorn --reload. Prod (hosts): no reload, respect $PORT.
# Hosts set ENVIRONMENT=production and PORT.
CMD ["sh", "-c", "if [ \"$ENVIRONMENT\" = \"production\" ]; then uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}; else uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload; fi"]
