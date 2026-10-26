FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 8082
CMD ["node","src/server.mjs"]
