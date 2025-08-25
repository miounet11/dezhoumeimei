FROM node:18-alpine

WORKDIR /app

# Install k6
RUN apk add --no-cache ca-certificates gnupg curl && \
    curl -s https://dl.k6.io/key.gpg | gpg --dearmor | tee /usr/share/keyrings/k6-archive-keyring.gpg && \
    echo "https://dl.k6.io/alpine/main" | tee /etc/apk/repositories && \
    apk add --no-cache k6 || true

# Copy test scripts
COPY . .

# Install dependencies
RUN npm install axios

CMD ["node", "load-test.js"]