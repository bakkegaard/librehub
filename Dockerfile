FROM node:alpine

COPY src /home/node


EXPOSE 3000

CMD node /home/node/main.js
