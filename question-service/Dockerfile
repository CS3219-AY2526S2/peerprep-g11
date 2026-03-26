# --- Build stage ---
FROM python:3.14-slim AS builder

WORKDIR /build

# Install essential build tools and python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# --- Run stage ---
FROM python:3.14-slim AS runtime

# Create a non-root user to prevent service running with root privileges
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

WORKDIR /app

# Pull the install packages in builder stage
COPY --from=builder /install /usr/local

# Copy all main files
COPY main.py ./
COPY schema.py ./
COPY .env ./

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the default port
EXPOSE 8000

# Start the service
CMD [ "python", "main.py" ]

