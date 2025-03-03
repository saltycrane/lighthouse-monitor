FROM node:22.14-bullseye

# Install necessary dependencies for Chrome/Puppeteer and cron
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-kacst \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-symbola \
    fonts-thai-tlwg \
    cron \
    procps \
    sqlite3 \
    curl \
    git \
    vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the timezone to Los Angeles
RUN ln -sf /usr/share/zoneinfo/America/Los_Angeles /etc/localtime && \
    echo "America/Los_Angeles" > /etc/timezone

# Set environment variable to tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory, data directory, and empty .env file
WORKDIR /app
RUN mkdir -p /app/data
RUN mkdir -p /var/log
RUN touch /app/data/.env
RUN ln -s /app/data/.env /app/.env

# Install dependencies and copy application files
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci
COPY . ./

CMD ["/app/bin/run-lighthouse"]
