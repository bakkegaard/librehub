FROM node

WORKDIR /home/node/

RUN npm install nodegit

RUN npm install -g nodemon

RUN npm install isomorphic-git

RUN npm install crypto-js

COPY ./ .

EXPOSE 3000

CMD nodemon --ignore git/ /home/node/src/main.js
