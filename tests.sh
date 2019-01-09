#!/usr/bin/env bash
set -ex

# All the steps run by CI. Should work locally too!
docker build -t fbapp-test .

docker run -v"$(pwd):/mnt/workspace" fbapp-test bash -c \
    "cp -r /mnt/workspace ~/fbapp &&
     cd ~/fbapp && \
     npm install && \
     ./node_modules/.bin/npx fitbit-build && \
     ls -lh build/app.fba"
