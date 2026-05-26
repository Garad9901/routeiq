FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

# Harden image security by running under non-root node user
RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD ["node", "dist/main"]
