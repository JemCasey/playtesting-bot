FROM node:16
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY database.db ./
COPY src /app/src
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
