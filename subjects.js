const fs = require('fs');
const puppeteer = require('puppeteer');
const { sleep } = require('./utils/common');
const { NOTALLOWEDMSG, NOTALLOWEDMSGEN, NOTALLOWEDMSGFORM } = require('./utils/constants');

const fsPromises = fs.promises;
const subjectsByYear = require('./data/initial.json');

// In this case we do not have the #notice div.
const maybeLogInForm = async (page) => {
  const formWithMsg = await page.$(
    'form[action="https://campus.exactas.uba.ar/login/index.php"] div.felement.fstatic'
  );
  const formMsg = formWithMsg ? await page.evaluate((f) => f.textContent, formWithMsg) : null;

  // This case is here for example: https://campus.exactas.uba.ar/enrol/index.php?id=1471
  const formNoMsg = await page.$(
    'form[action="https://campus.exactas.uba.ar/enrol/index.php"] legend.ftoggler'
  );

  return (formMsg && NOTALLOWEDMSGFORM.trim().toLowerCase()) || formNoMsg;
};

const maybeLogInNotice = async (page) => {
  const guestsMaybeNotallowed = await page.$('#notice');
  const areGuestNotAllowedMsg = guestsMaybeNotallowed
    ? await page.evaluate((el) => el.textContent, guestsMaybeNotallowed)
    : null;

  return (
    areGuestNotAllowedMsg &&
    (areGuestNotAllowedMsg.trim().toLowerCase() === NOTALLOWEDMSG ||
      areGuestNotAllowedMsg.trim().toLowerCase() === NOTALLOWEDMSGEN)
  );
};

const needLogIn = async (page) => {
  const [loginForm, loginMsg] = await Promise.all([maybeLogInForm(page), maybeLogInNotice(page)]);

  if (loginForm || loginMsg) {
    const url = await page.url();
    console.log(`${url} needs to be logged in.`);
    return true;
  }

  return false;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1200,800'],
  });
  const page = await browser.newPage();
  // await page.setViewport({ width: 1280, height: 800 })
  page.setDefaultTimeout(0);

  try {
    for (const year of subjectsByYear) {
      for (const periods of year.periods) {
        for (const periodContent of periods.content) {
          await page.goto(periodContent.href);
          console.log(`Processing ${periodContent.href}`);

          // Another interesting approach where you can wait for multiple things.
          // await page.waitFor(() => !!document.querySelector('.foo'));
          // https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagewaitforselectororfunctionortimeout-options-args
          await page.waitForSelector('div[role="main"]');

          // In case the loaded page is https://campus.exactas.uba.ar/user/policy.php
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

          // If I need to log in, I can't obtain useful data, so skip this period subject.
          if (await needLogIn(page)) {
            periodContent.needAuth = true;
            continue;
          }

          await page.waitForSelector('div[role="main"] div.course-content');

          const tabs = await page.$$eval('div.course-content ul.nav.nav-tabs > li > a', (xs) =>
            xs.map((a) => ({ tab: a.title || 'Inicio', href: a.href || null }))
          );

          periodContent.needAuth = false;
          periodContent.tabs = tabs;
          await sleep(3);
        }
      }
    }

    const jsonContent = JSON.stringify(subjectsByYear, null, 4);
    await fsPromises.mkdir('data', { recursive: true });
    await fsPromises.writeFile('data/crawled.json', jsonContent, 'utf8');

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
})();
