FROM oven/bun:latest AS base
WORKDIR /usr/src/app

# Copy project files
COPY ./build ./build

# Define the command to run the app
CMD ["bun", "run", "./build/index.js"]
