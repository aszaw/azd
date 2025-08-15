FROM node:20-alpine

# Create app dir
WORKDIR /app

# Install dependencies separately for better caching
COPY backend/package.json ./
RUN npm install --production

# Copy source
COPY backend/server.js ./server.js

# Create uploads directory inside container (still mount a volume)
RUN mkdir -p /app/uploads

# Env defaults (override in compose)
ENV PORT=3000
ENV UPLOAD_DIR=/app/uploads

EXPOSE 3000
CMD ["npm", "start"]
