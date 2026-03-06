FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json package-lock.json ./
RUN npm ci
COPY . .
RUN rm -f tsconfig.tsbuildinfo && npm run build && test -f dist/main.js

FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
