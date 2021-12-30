FROM node:8-alpine as base

WORKDIR /app
RUN apk add --no-cache tzdata

COPY package.json ./
COPY src ./src

# Dependencies and build
FROM base as dependencies_and_build

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
        avahi-dev \
    && npm install \
    && apk del .gyp

# Release
FROM base as release

COPY --from=dependencies_and_build /app/node_modules ./node_modules
COPY --from=dependencies_and_build /app/src ./src

RUN mkdir /app/data

VOLUME ["/app/data"]

CMD [ "npm", "start" ]

