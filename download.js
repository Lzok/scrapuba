const puppeteer = require('puppeteer');

const completeData = require('./data/crawled.json');
const { downloadWithElementHandle } = require('./utils/download');
const { sleep } = require('./utils/common');
const {
  BASE_DOWNLOAD_PATH,
  DOWNLOAD_FOLDER_SELECTOR,
  SELECTOR_FOLDER_MATERIAL,
} = require('./utils/constants');

const prepareDataToDownload = (grossData) => {
  return grossData.flatMap((byYear) => {
    const publicSubjects = byYear.periods.flatMap((period) =>
      period.content.filter((ss) => !ss.needAuth)
    );

    return {
      year: byYear.year,
      url: byYear.href,
      subjects: publicSubjects,
    };
  });
};

// Big issue with interesting information about puppeteer and file downloads
// https://github.com/puppeteer/puppeteer/issues/299
(async () => {
  const processedData = prepareDataToDownload(completeData);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1200,800'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(0);

    // Walk through all the subjects year by year
    for (const yearData of processedData) {
      for (const subject of yearData.subjects) {
        for (const subjectTab of subject.tabs) {
          await page.goto(subjectTab.href || subject.href);

          await page.waitForSelector('div[role="main"]');

          // In case the loaded page is https://campus.exactas.uba.ar/user/policy.php
          const selector =
            '#notice > div > div:nth-child(1) > form > div > input[type=submit]:nth-child(1)';
          if ((await page.$(selector)) !== null) {
            await page.click(selector);
            await page.waitForSelector('div[role="main"]');
          }

          //  If no elements match the selector, the return value resolves to []
          const downloadFolderLinks = await page.$$(DOWNLOAD_FOLDER_SELECTOR);
          console.log('Direct folders to download: ', downloadFolderLinks.length);
          if (downloadFolderLinks.length) {
            for (const el of downloadFolderLinks) {
              await downloadWithElementHandle(
                page,
                el,
                `${BASE_DOWNLOAD_PATH}/${yearData.year}/${subject.subject}`
              );
              await sleep(3);
            }
          }

          const foldersToDownload = await page.$$(SELECTOR_FOLDER_MATERIAL);
          console.log('Folders to navigate and then download quantity: ', foldersToDownload.length);
          if (foldersToDownload.length) {
            for (const el of foldersToDownload) {
              const tabHref = await el.evaluate((p) => p.href);
              const tab = await browser.newPage();
              await tab.goto(tabHref);

              if (
                (await page.$(
                  '#notice > div > div:nth-child(1) > form > div > input[type=submit]:nth-child(1)'
                )) !== null
              ) {
                await page.click(
                  '#notice > div > div:nth-child(1) > form > div > input[type=submit]:nth-child(1)'
                );
                await page.waitForSelector('div[role="main"]');
              }

              // We can bring the tab to the front if we want to see it
              // await tab.bringToFront();

              await tab.waitForSelector(`div[role="main"] ${DOWNLOAD_FOLDER_SELECTOR}`);
              const submitElement = await tab.$(DOWNLOAD_FOLDER_SELECTOR);
              await downloadWithElementHandle(
                tab,
                submitElement,
                `${BASE_DOWNLOAD_PATH}/${yearData.year}/${subject.subject}`
              );

              await sleep(3);
              await tab.close();
            }
          }
          // Sleep 3 secs between subject tabs
          await sleep(3);
        }
        // Sleep 5 secs between subjects
        await sleep(5);
      }
    }

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`);
    await browser.close();
    process.exit(1);
  }
})();
