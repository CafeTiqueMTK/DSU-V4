# Base image with Node.js 22
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy project files (respecting .dockerignore)
COPY . .

# Expose the web dashboard port
EXPOSE 3000

# Start the bot
CMD ["node", "src/index.js"]
