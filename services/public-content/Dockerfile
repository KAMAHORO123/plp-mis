FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs announcement.json ./
USER node
EXPOSE 8080
CMD ["node","server.mjs"]
