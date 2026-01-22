
FROM node:18-alpine

WORKDIR /listener

COPY package*.json ./
RUN npm install --production

COPY . ./


EXPOSE 4000
CMD ["node", "listener.js"]