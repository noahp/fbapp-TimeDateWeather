FROM ubuntu:bionic

RUN apt-get update && apt-get install -y \
    libsecret-1-dev \
    libssl1.0-dev \
    node-gyp \
    nodejs-dev \
    npm \
    sudo
