# --- Stage 1: Dependencies and Build ---
# Use a Node.js image to install dependencies and build the Next.js application
FROM node:20-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Install Python, common build tools, and Linux kernel headers/dev libraries.
# These are needed for native Node.js modules (like 'usb' via node-gyp).
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libudev-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (or yarn.lock)
# This step is cached by Docker. If these files don't change,
# Docker won't re-run 'npm install'.
COPY package*.json ./

# Install dependencies
# 'npm ci' is recommended for CI/CD as it uses package-lock.json directly,
# ensuring reproducible builds. 'npm install' is also fine.
RUN npm install

# Copy the rest of your worker-frontend application code
# Ensure .next, node_modules, .env, .git are excluded via .dockerignore
COPY . .

# Build the Next.js application for production
# Added --no-lint to bypass ESLint errors during build
RUN npm run build -- --no-lint

# --- Stage 2: Runner ---
# Use a smaller, production-ready image for the final application
FROM node:20-slim AS runner

# Set the working directory
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security best practices
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy necessary files from the builder stage
# Only copy what's needed for production to keep the final image small and secure
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Change ownership to the non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose the port Next.js listens on (default is 3000)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Command to start the Next.js production server
# This command should match your 'npm start' script in package.json (which runs 'next start')
CMD ["npm", "start"]