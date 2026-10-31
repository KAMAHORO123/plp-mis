# The PLP Hub (member, trainer, mentor and administrator workspaces) built from the repository root.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.ts tailwind.config.ts postcss.config.js tsconfig*.json ./
COPY public ./public
COPY src ./src
COPY scripts/prepare-vision.mjs ./scripts/prepare-vision.mjs
RUN npm run build
FROM nginx:alpine
COPY deploy/hub-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
