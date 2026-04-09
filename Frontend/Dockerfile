FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build do Vite - aceita build args para variáveis de ambiente
ARG VITE_API_URL=http://localhost:5001
# O Vite precisa que variáveis VITE_* estejam disponíveis durante o build
ENV VITE_API_URL=$VITE_API_URL

# Build do Vite
RUN npm run build

EXPOSE 5173

# Usa Vite preview (NÃO dev)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
