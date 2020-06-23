const fs = require('fs');
const path = require('path');

const { sleep } = require('./common');

const fsPromises = fs.promises;

const waitForFileToDownload = async (downloadPath) => {
    console.log(`Checking to download file in ${downloadPath}...`);
    let filename;

    try {
        while (!filename || filename.endsWith('.crdownload')) {
            filename = fs.readdirSync(downloadPath)[0];
            await sleep(1);
        }

        return filename;
    } catch (error) {
        throw error;
    }
}

const download = async (page, selector, pathToDownload) => {
    const downloadPath = path.resolve(pathToDownload, Math.random().toString(36).substr(2, 8));

    try {
        await fsPromises.mkdir(downloadPath, { recursive: true });
        console.log('Downloading file to:', downloadPath);
        await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath });
        await page.click(selector);
        const filename = await waitForFileToDownload(downloadPath);

        return path.resolve(downloadPath, filename);
    } catch (error) {
        throw error;
    }
}

const downloadWithElementHandle = async (page, elemHandle, pathToDownload) => {
    const downloadPath = path.resolve(pathToDownload, Math.random().toString(36).substr(2, 8));

    try {
        await fsPromises.mkdir(downloadPath, { recursive: true });
        console.log('Downloading file to:', downloadPath);
        await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath });
        await elemHandle.click();
        const filename = await waitForFileToDownload(downloadPath);

        return path.resolve(downloadPath, filename);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    download,
    waitForFileToDownload,
    downloadWithElementHandle,
};
