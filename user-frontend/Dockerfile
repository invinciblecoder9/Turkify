# --- Stage 1: Dependencies and Build ---
# Use a Node.js image to install dependencies and build the Next.js application
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# This step is cached by Docker. If these files don't change,
# Docker won't re-run 'npm install'.
COPY package*.json ./

# Install dependencies
# 'npm ci' is recommended for CI/CD as it uses package-lock.json directly,
# ensuring reproducible builds. 'npm install' is also fine.
RUN npm install

# Copy the rest of your user-frontend application code
# This step runs if any other files in your user-frontend directory change
COPY . .

# Build the Next.js application for production
# This command should match your 'npm run build' script in package.json
RUN npm run build

# --- Stage 2: Runner ---
# Use a smaller, production-ready image to run the Next.js application
FROM node:20-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy necessary files from the builder stage
# Only copy what's needed for production to keep the final image small and secure
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# If you have environment variables that are needed at runtime (e.g., NEXT_PUBLIC_BACKEND_URL)
# you should set them in your deployment platform (Vercel/Render)
# or pass them during 'docker run' / Kubernetes manifests.

# Expose the port Next.js listens on (default is 3000)
EXPOSE 3000

# Command to start the Next.js production server
# This command should match your 'npm start' script in package.json
CMD ["npm", "start"]