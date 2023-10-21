FROM node:16
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src /app/src
RUN npm install
RUN npm run initDB
RUN npm run build
CMD ["npm", "run", "start"]
