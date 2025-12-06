# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for env vars
ARG PUBLIC_MAPBOX_TOKEN
ARG PUBLIC_API_URL

# Create .env file for build
RUN echo "PUBLIC_MAPBOX_TOKEN=${PUBLIC_MAPBOX_TOKEN}" > .env && \
    echo "PUBLIC_API_URL=${PUBLIC_API_URL}" >> .env

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files from builder (SvelteKit outputs to .svelte-kit/output)
COPY --from=builder /app/.svelte-kit/output ./
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

# Expose port
EXPOSE 5174

# Start the app (adapter-vercel outputs to server/index.js)
CMD ["node", "server/index.js"]
