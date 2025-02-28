# lighthouse-monitor

Monitor Lighthouse performance metrics over time. Uses Node.js, TypeScript, Puppeteer, sqlite, and the `lighthouse` npm package for the script. Uses Next.js and React for the dashboard web app. I used "Edit with Copilot" Claude 3.7 to write a lot of the code. Thus, a lot of it is messier than I would normally write.

- run Lighthouse every 15 minutes using cron
- store metrics in sqlite
- display graphs of data over time
- uses Puppeteer to separate cached vs. non-cached behavior
- measures
  - Overall Lighthouse performance score
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Total Blocking Time (TBT)
  - Cumulative Layout Shift (CLS)
  - Speed Index


## Usage

- install Node.js (tested with v22)
- `cd /my/working/directory`
- `git clone https://github.com/saltycrane/lighthouse-monitor.git`
- `cp .env.example .env`
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


### To do

- save detailed reports to S3 and allow viewing them
- add more filtering (e.g. separate cached and uncached when comparing multiple hosts/pages)


### Alternatives

- use PageSpeed Insights API instead of running Lighthouse if your website is publicly available. It is free for 25,000 requests per day.
