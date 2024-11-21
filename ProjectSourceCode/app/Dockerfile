FROM node:latest
WORKDIR /home/node/app
COPY package.json .
RUN npm install
#RUN npm install -g nodemon concurrently
EXPOSE 3000
CMD npm run build && npm run start