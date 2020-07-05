FROM ubuntu:focal

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    software-properties-common

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | \
    tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update && apt-get install -y \
    libsecret-1-0 \
    node-gyp \
    yarn

# get user id from build arg, so we can have read/write access to directories
# mounted inside the container. only the UID is necessary, UNAME just for
# cosmetics
ARG UID=1010
ARG UNAME=builder

RUN useradd --uid $UID --create-home --user-group ${UNAME} && \
    echo "${UNAME}:${UNAME}" | chpasswd && adduser ${UNAME} sudo

USER ${UNAME}
