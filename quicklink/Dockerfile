# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy client package files
COPY client/package*.json ./client/

# Install dependencies for both backend and frontend build
RUN npm install
RUN cd client && npm install

# Copy all project files
COPY . .

# Build the React production client
RUN cd client && npm run build

# Remove development dependencies and frontend sources to shrink container footprint
RUN rm -rf client/node_modules client/src client/public
RUN npm prune --production

# Expose port
EXPOSE 8080

# Start command
CMD [ "node", "server.js" ]
