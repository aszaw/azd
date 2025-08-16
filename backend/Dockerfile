# Use Node 18 base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if any) and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source
COPY . .

# Create uploads directory inside container
RUN mkdir -p /app/uploads

# Set environment defaults (can override in Docker Compose)
ENV PORT=4000
ENV UPLOAD_DIR=/app/uploads

# Expose the app port
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]
