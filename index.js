const fs = require('fs');
const puppeteer = require('puppeteer');
const { getNthParent, sleep } = require('./utils/common');
const { ROOT_URL } = require('./utils/constants');

const fsPromises = fs.promises;

const CHILDRENLOADED = 'div.category.with_children.loaded[aria-expanded="true"]';

const getPaginatedContentIfExist = async (browser, page) => {
  // Check for pagination (more results)
  const selector = `${CHILDRENLOADED} ${CHILDRENLOADED} div.courses div.paging.paging-morelink > a`;
  const isPaginate = await page.$(selector);

  if (isPaginate !== null) {
    console.log('This course has pagination.');
    const tabHref = await page.evaluate((p) => p.href, isPaginate);
    const tab = await browser.newPage();
    await tab.goto(tabHref);

    // We can bring the tab to the front if we want to see it
    // await tab.bringToFront();

    await tab.waitForSelector('div[role="main"] div.content');

    const paginateContent = await tab.$$eval(
      'div[role="main"] div.content div.courses div.coursename > a',
      (xs) => xs.map((e) => ({ subject: e.innerHTML, href: e.href }))
    );

    await tab.close();
    return paginateContent;
  }

  return [];
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1200,800'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  try {
    await page.goto(ROOT_URL);
    await page.waitForSelector('div.subcategories');

    const years = await page.$$eval(
      'div.subcategories > div.category > div.info > h3.categoryname > a',
      (xs) => xs.map((e) => ({ year: e.innerHTML, href: e.href }))
    );

    const data = [];
    for (const { year, href } of years) {
      const link = await page.$(`a[href="${href}"]`);
      const row = await link.getProperty('parentNode');

      await row.click();
      await sleep(2);
      await page.waitForSelector(CHILDRENLOADED);

      const yearsContent = await page.$$eval(`${CHILDRENLOADED} h4.categoryname > a`, (xs) =>
        xs.map((e) => ({ period: e.innerHTML, href: e.href }))
      );

      const content = [];

      for (const { href: hrefYearsContent, period } of yearsContent) {
        console.log('Period: ', period);
        const periodLink = await page.$(`a[href="${hrefYearsContent}"]`);
        const periodRow = await periodLink.getProperty('parentNode');
        const parent = await getNthParent(periodRow, 2);
        const classes = await parent.getProperty('className');

        if (!classes._remoteObject.value.includes('with_children')) continue;

        // Specific focus here. If the page didn't focus the element before click, sometimes the periodRow.click
        // broke with the msg "Node is either not visible or not an HTMLElement"
        // Reference 1: https://github.com/puppeteer/puppeteer/issues/1769
        // Reference 2: https://github.com/puppeteer/puppeteer/issues/1805
        console.log('Pre periodRowClick');
        await page.focus(
          `${CHILDRENLOADED} div.category.notloaded.with_children.collapsed h4.categoryname`
        );
        await periodRow.click();
        await sleep(2);
        await page.waitForSelector(`${CHILDRENLOADED} ${CHILDRENLOADED}`);

        const periodContent = await page.$$eval(
          `${CHILDRENLOADED} ${CHILDRENLOADED} div.courses div.coursename > a`,
          (xs) => xs.map((e) => ({ subject: e.innerHTML, href: e.href }))
        );

        const paginatedContent = await getPaginatedContentIfExist(browser, page);
        periodContent.push(...paginatedContent);

        content.push({
          period,
          href,
          content: [...periodContent],
        });

        await periodRow.click();
        await sleep(3);
      }

      data.push({
        year,
        href,
        periods: [...content],
      });

      await row.click();
      await sleep(2);
    }

    const jsonContent = JSON.stringify(data, null, 4);
    await fsPromises.mkdir('data', { recursive: true });
    await fsPromises.writeFile('data/initial.json', jsonContent, 'utf8');

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
})();
