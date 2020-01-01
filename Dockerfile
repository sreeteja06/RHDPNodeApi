FROM node:10-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN wget -qO- "https://github.com/dustinblackman/phantomized/releases/download/2.1.1a/dockerized-phantomjs.tar.gz" | tar xz -C /

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
COPY . .

EXPOSE 1337
CMD [ "node", "server.js" ]

# docker build -t sreeteja06/rhdpnodeapi .
# docker push sreeteja06/rhdpnodeapi