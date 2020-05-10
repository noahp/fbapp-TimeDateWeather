#!/usr/bin/env bash

# Simple test script to run the tests in docker

# Error on any non-zero command, and print the commands as they're run
set -ex

# Make sure we have the docker utility
if ! command -v docker; then
    echo "🐋 Please install docker first 🐋"
    exit 1
fi

# This environment variable is set in github actions. When running on another
# host, set a default.
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-fbapp-timedateweather}

# build the docker image
DOCKER_BUILDKIT=1 docker build -t "$GITHUB_REPOSITORY" --build-arg "UID=$(id -u)" -f Dockerfile .

# run the test build
docker run -v"$(pwd):/mnt/workspace" -t "$GITHUB_REPOSITORY" bash -c \
    "cd /mnt/workspace && \
     npm install && \
     ./node_modules/.bin/npx fitbit-build && \
     ls -lh build/app.fba"
