FROM node:10-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app/

EXPOSE 80

CMD ["npm", "start"]