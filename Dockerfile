FROM node:8-alpine

WORKDIR /src/app
COPY . /src/app

RUN apk add --update python python-dev py-pip make gcc g++ && \
  npm install -q --unsafe-perm && \
  npm prune --production -q && \
  apk del python python-dev py-pip make gcc g++ && \
  rm -rf /var/cache/apk/* /root/.npm /root/.node-gyp

EXPOSE 8080
ENTRYPOINT [ "node", "cli.js" ]
