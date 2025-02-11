# lighthouse-script

A script to automate Lighthouse performance testing of web pages. Uses Node.js, TypeScript, Puppeteer, and the `lighthouse` npm package. I used this for testing the performance of a page before and after making changes.

- measures
  - Overall Lighthouse performance score
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Total Blocking Time (TBT)
  - Cumulative Layout Shift (CLS)
  - Speed Index
- supports making multiple tests of multiple runs each
- provides statistics (mean, std dev, min, max)
- uses Puppeteer to test cached vs. non-cached behavior
- input configuration is in a JSON file
- saves results as a JSON file
- displays a table of results in the console

## Example results (console display)

``` 
📊 Lighthouse Metrics Google vs. Wikipedia

https://www.google.com/
  Timestamps: 2025-02-14T22:00:40.235Z - 2025-02-14T22:01:41.221Z
  Test count: 2 tests x 3 runs/test = 6 total
┌───────────────────────────┬───────┬────────┬───────┬──────┐
│ (index)                   │ mean  │ stdDev │ min   │ max  │
├───────────────────────────┼───────┼────────┼───────┼──────┤
│ performanceScore          │ 92    │ 2      │ 89    │ 94   │
│ firstContentfulPaintSec   │ 1.7   │ 0.49   │ 1.2   │ 2.3  │
│ largestContentfulPaintSec │ 2.2   │ 0.49   │ 1.5   │ 2.8  │
│ totalBlockingTimeMs       │ 218   │ 3.4    │ 212   │ 222  │
│ cumulativeLayoutShift     │ 0.018 │ 0.0156 │ 0.007 │ 0.04 │
│ speedIndexSec             │ 3.1   │ 0.34   │ 2.8   │ 3.6  │
└───────────────────────────┴───────┴────────┴───────┴──────┘

https://www.wikipedia.org/
  Timestamps: 2025-02-14T22:01:03.207Z - 2025-02-14T22:01:59.892Z
  Test count: 2 tests x 3 runs/test = 6 total
┌───────────────────────────┬──────┬────────┬─────┬─────┐
│ (index)                   │ mean │ stdDev │ min │ max │
├───────────────────────────┼──────┼────────┼─────┼─────┤
│ performanceScore          │ 100  │ 0.4    │ 99  │ 100 │
│ firstContentfulPaintSec   │ 1.2  │ 0      │ 1.2 │ 1.2 │
│ largestContentfulPaintSec │ 1.4  │ 0      │ 1.4 │ 1.4 │
│ totalBlockingTimeMs       │ 19   │ 42.5   │ 0   │ 114 │
│ cumulativeLayoutShift     │ 0    │ 0      │ 0   │ 0   │
│ speedIndexSec             │ 1.3  │ 0.17   │ 1.2 │ 1.6 │
└───────────────────────────┴──────┴────────┴─────┴─────┘
```

## Example config file

``` json
{
  "description": "Google vs. Wikipedia",
  "outputFilePath": "./lighthouse-results",
  "runCount": 2,
  "testCount": 2,
  "urls": ["https://www.google.com/", "https://www.wikipedia.org/"]
}
```

## Usage

- install Node.js (tested with v22)
- `npm install`
- edit config file at `./lighthouse-config.json` as needed
- `npm run lh`
- see results printed in the terminal and saved in a file like `./lighthouse-results.2025-02-14T22:01:59.892Z.json`

## Specifying a different config file on the command line

To use `./my-config-file.json`, pass it on the command line: `npm run lh -- ./my-config-file.json`
