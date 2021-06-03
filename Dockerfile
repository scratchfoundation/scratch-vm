# PlayspotScratch
#
# VERSION 1.0.1

FROM node:slim
MAINTAINER Van Simmons <van.simmons@computecycles.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app/

COPY ./ /usr/src/app/

RUN apt-get -y update
RUN npm install || true
RUN apt-get autoremove

ENTRYPOINT [ node, src/index.js, "--host", "10.8.0.28" ]
