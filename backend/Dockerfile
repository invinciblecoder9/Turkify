# --- Stage 1: Builder ---

# Use a Node.js image to build the application

FROM node:20-alpine AS builder
# Set the working directory inside the container

WORKDIR /app
# Copy package.json and package-lock.json (or yarn.lock) first

# This allows Docker to cache dependency installation if these files don't change

COPY package*.json ./
# Install production and dev dependencies

# We need dev dependencies for 'prisma' and 'typescript' during build stage

RUN npm install

# Copy Prisma schema and migrations

# This is needed for 'prisma generate' and 'prisma migrate deploy'

COPY prisma ./prisma/

# Copy all your source code

COPY src ./src/

COPY tsconfig.json ./

COPY tsconfig.tsbuildinfo ./



# Generate Prisma Client

# This command generates the Prisma Client code based on your schema

RUN npx prisma generate



# Build the TypeScript code

# This command should match your 'npm run build' script in package.json

# (assuming you have a 'build' script that runs 'npx tsc')

RUN npx tsc



# --- Stage 2: Runner ---

# Use a smaller, production-ready image for the final application

FROM node:20-alpine AS runner



# Set the working directory

WORKDIR /app



# Copy only production dependencies from the builder stage

# This ensures a smaller final image

COPY --from=builder /app/node_modules ./node_modules



# Copy Prisma schema (needed for migrations at runtime/post-deploy)

COPY --from=builder /app/prisma ./prisma/



# Copy the compiled JavaScript code from the builder stage

# Assuming your TypeScript compiles to a 'dist' folder

COPY --from=builder /app/dist ./dist



# Copy package.json (needed for 'npm start' and 'npm install --production' if applicable)

COPY --from=builder /app/package.json ./package.json



# Expose the port your Express app listens on (e.g., 3000, or process.env.PORT)

EXPOSE 3000



# Command to run the application when the container starts

# This command should match your 'npm start' script (e.g., 'node dist/index.js')

CMD ["node", "dist/index.js"]