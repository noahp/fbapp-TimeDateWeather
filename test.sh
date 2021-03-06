#!/usr/bin/env bash

# Simple test script to run the tests in docker

# Error on any non-zero command, and print the commands as they're run
set -ex

# Make sure we have the docker utility
if ! command -v docker; then
    echo "🐋 Please install docker first 🐋"
    exit 1
fi

# Set the docker image name to default to repo basename
DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME:-$(basename -s .git "$(git remote --verbose | awk 'NR==1 { print tolower($2) }')")}

# build the docker image
DOCKER_BUILDKIT=1 docker build -t "$DOCKER_IMAGE_NAME" --build-arg "UID=$(id -u)" -f Dockerfile .

# run the test build
# connect stdin if not in CI
if [[ $CI != true ]]; then
    INTERACTIVE_ARGS=-i
fi

docker run -t $INTERACTIVE_ARGS --rm \
    --volume "$(pwd):/mnt/workspace" \
    "$DOCKER_IMAGE_NAME" bash -c \
    "yarn install && \
     export PATH=\$PWD/node_modules/.bin:\$PATH &&
     npx eslint . &&
     npx prettier --check . && \
     npx fitbit-build && \
     ls -lh build/app.fba"
