# Stage 1: build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve with Express (injects NR Browser snippet at runtime)
FROM node:20-alpine
WORKDIR /app
RUN npm install express
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 3000
ENV NR_BROWSER_AGENT=""
CMD ["node", "server/index.cjs"]
