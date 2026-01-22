
FROM node:18-alpine

WORKDIR /sender

COPY package*.json ./
RUN npm install --production

COPY . ./


EXPOSE 3000
CMD ["node", "sender.js"]