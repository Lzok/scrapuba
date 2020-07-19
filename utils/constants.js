const ROOT_URL = 'https://campus.exactas.uba.ar/course/index.php?categoryid=3';

const NOTALLOWEDMSG =
  'los invitados no pueden entrar a este curso. por favor acceda con sus datos.';
const NOTALLOWEDMSGEN = 'guests cannot access this course. please log in.';
const NOTALLOWEDMSGFORM =
  'los invitados no pueden entrar a este curso. por favor acceda con sus datos.';

const BASE_DOWNLOAD_PATH = 'downloads';

const FORM_DOWNLOAD_URL = 'https://campus.exactas.uba.ar/mod/folder/download_folder.php';
const DOWNLOAD_FOLDER_SELECTOR = `form[action="${FORM_DOWNLOAD_URL}"] input[type="submit"]`;
const SELECTOR_FOLDER_MATERIAL = 'li.activity.folder div.activityinstance > a';
const SELECTOR_INDIVIDUAL_MATERIAL = 'li.activity.resource';

// Begin selectors I used to try and test things with downloads
const URLDOWNLOAD = 'https://campus.exactas.uba.ar/mod/folder/view.php?id=60277';

const URL_TEST_NO_FOLDER_DOWNLOAD =
  'https://campus.exactas.uba.ar/course/view.php?id=1790&section=8';
const URL_TEST_VARIOUS_WAYS_DOWNLOADS =
  'https://campus.exactas.uba.ar/course/view.php?id=1756&section=2';
const URL_TEST_FOLDER_CLICK = 'https://campus.exactas.uba.ar/course/view.php?id=1297';

const SELECTOR_DOWNLOAD_INDIVIDUAL_MATERIAL = `${SELECTOR_INDIVIDUAL_MATERIAL} div.activityinstance > a`;

// These are external links to the campus so I will store them in a json file.
const SELECTOR_URL_MATERIAL = 'li.activity.url';
// End selectors

module.exports = {
  ROOT_URL,
  NOTALLOWEDMSG,
  NOTALLOWEDMSGEN,
  NOTALLOWEDMSGFORM,
  BASE_DOWNLOAD_PATH,
  FORM_DOWNLOAD_URL,
  DOWNLOAD_FOLDER_SELECTOR,
  SELECTOR_FOLDER_MATERIAL,
  SELECTOR_INDIVIDUAL_MATERIAL,
};
