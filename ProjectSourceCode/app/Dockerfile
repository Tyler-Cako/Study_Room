FROM node:latest
WORKDIR /home/node/app
COPY package.json ./
RUN npm i
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]