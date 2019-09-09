FROM node:10

LABEL Yeshvant Bhavnasi (devyeshvant@gmail.com)

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]

ENV GOOGLE_APPLICATION_CREDENTIALS '/secret/Transformers-cred.json'
