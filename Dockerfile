FROM node:14.17.3

LABEL maintainer="Ignatios Drakoulas"

ARG build=latest
ENV BUILD=${build:-latest}

# Update to the latest npm
RUN npm i -g npm

#####################################
# Code Copying
#####################################
# Copy the project files
COPY  --chown=node:node ./ /var/www/
# Change the user
USER node
# Set the default working directory
WORKDIR /var/www
# Install dependencies and build
RUN npm ci && npm run build-prod
#
# Expose the port the app runs in
EXPOSE 3000
