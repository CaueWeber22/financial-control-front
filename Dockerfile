# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS build

WORKDIR /workspace

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/front-end-control/browser /usr/share/nginx/html

EXPOSE 80
