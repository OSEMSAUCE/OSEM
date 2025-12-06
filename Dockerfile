# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create Docker-specific svelte config using adapter-node
RUN echo 'import adapter from "@sveltejs/adapter-node";' > svelte.config.docker.js && \
    echo 'import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";' >> svelte.config.docker.js && \
    echo 'const config = {' >> svelte.config.docker.js && \
    echo '  preprocess: vitePreprocess({ postcss: true }),' >> svelte.config.docker.js && \
    echo '  kit: {' >> svelte.config.docker.js && \
    echo '    adapter: adapter({ out: "build" }),' >> svelte.config.docker.js && \
    echo '    alias: { "$lib": "./src/lib" }' >> svelte.config.docker.js && \
    echo '  }' >> svelte.config.docker.js && \
    echo '};' >> svelte.config.docker.js && \
    echo 'export default config;' >> svelte.config.docker.js && \
    mv svelte.config.js svelte.config.vercel.js && \
    mv svelte.config.docker.js svelte.config.js

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

# Copy built files from builder (adapter-node outputs to build/)
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

# Expose port
EXPOSE 5174

# Set port for adapter-node
ENV PORT=5174

# Start the app (adapter-node outputs to build/index.js)
CMD ["node", "build/index.js"]
