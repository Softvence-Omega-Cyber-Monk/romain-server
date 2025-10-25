FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# FIX: Copy the entire 'prisma' directory and its contents
COPY prisma ./prisma

# Run generate to download the Linux-specific query engine
RUN npx prisma generate

# Copy the rest of the application files (now excluding node_modules due to .dockerignore)
COPY . .

# The CMD to run your application
CMD ["npm", "run", "dev"]
