# lighthouse-monitor

Monitor Lighthouse performance metrics over time. Uses Node.js, TypeScript, Puppeteer, sqlite, and the `lighthouse` npm package for the script. Uses Next.js App Router and React Server Components for the dashboard web app. Credit and blame to "Edit with Copilot" + Claude 3.7 for significant portions of code.

- run Lighthouse repeatedly using Docker Compose's `restart` (or cron if not using Docker)
- store metrics in sqlite
- display graphs of data over time
- separate cached vs. non-cached behavior
- save HTML reports to S3
- set cookies to hide OneTrust cookie consent banner
- measure
  - Overall Lighthouse performance score
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Total Blocking Time (TBT)
  - Cumulative Layout Shift (CLS)
  - Speed Index


## Usage (single run)

- install Node.js (tested with v22)
- `cd /my/working/directory`
- `git clone https://github.com/saltycrane/lighthouse-monitor.git`
- `cp .env.example .env`
- edit environment variables
- `npm install`
- `npm run lh`


## Usage (run continuously WITH Docker)

Set environment variables in `docker-compose.yml` and/or `.env` files.

### Start

`docker-compose up --build -d`

### View logs

`docker-compose logs -f`

### Stop

`docker-compose down`

### Interact with running container

`docker-compose exec -it lighthouse-monitor bash`

### Start just one service

`docker-compose up dashboard`

### Add S3 credentials

``` sh
docker-compose up --build -d dashboard
docker-compose exec -it dashboard bash
vim /app/data/.env
# add S3 credentials, exit vi
exit
docker-compose down
```

### Migrate db

``` sh
docker-compose up -d dashboard
docker-compose exec -it dashboard bash
npx tsx migrations/250305-add-inp-browser-env-to-metrics.ts
exit
docker-compose down
```

### Override web server port when running locally

Create a `docker-compose.override.yml` file with the following contents and run docker-compose as usual. (It automatically uses this file with this name.)

```
services:
  dashboard:
    ports:
      - "3000:3000"
```


## Usage (run continuously with cron WITHOUT Docker)

- install Node.js (tested with v22)
- `cd /my/working/directory`
- `git clone https://github.com/saltycrane/lighthouse-monitor.git`
- `cp .env.example .env`
- edit environment variables
- `npm install`


### Run web app

- `npm run dev`
- go to http://localhost:3000 in the browser
- add at least 1 host and 1 pathname in the UI


### Run script with cron

- `crontab -e`
- add something similar to:
  ``` 
  */15 * * * * PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/opt/node@22/bin /my/working/directory/lighthouse-monitor/node_modules/.bin/tsx /my/working/directory/lighthouse-monitor/lighthouse-script.ts > /my/working/directory/lighthouse-monitor/script-output.log 2>&1
  ```


## Alternatives

- use PageSpeed Insights API instead of running Lighthouse if your website is publicly available. It is free for 25,000 requests per day.
