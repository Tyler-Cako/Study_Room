FROM node:latest
WORKDIR /home/node/app
COPY package*.json .
RUN npm ci
RUN npm install -g nodemon concurrently
EXPOSE 3000
CMD npm run dev