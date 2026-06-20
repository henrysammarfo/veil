FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY packages/execution-engine ./packages/execution-engine
COPY packages/walrus-reporter ./packages/walrus-reporter
COPY packages/sdk ./packages/sdk
COPY packages/veil-enclave ./packages/veil-enclave
RUN npm install -g tsx
EXPOSE 8080
ENV VEIL_ENCLAVE_PORT=8080
CMD ["tsx", "packages/veil-enclave/src/server.ts"]
