FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server.mjs ./
COPY --chown=node:node assets ./assets
USER node
EXPOSE 8083
CMD ["node","server.mjs"]
