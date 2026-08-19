# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

# .npmrc precisa vir antes do npm ci (legacy-peer-deps=true)
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

# Vazio por padrão: o axios monta baseURL "/api" (chamadas relativas, mesma origem
# que o nginx). Assim trocar o IP/domínio da VM não exige rebuild da imagem.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# "npm run build" roda "tsc && vite build" — erro de tipo quebra a imagem
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
