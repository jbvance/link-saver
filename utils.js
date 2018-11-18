const metascraper = require('metascraper')([
    require('metascraper-title')(),
    require('metascraper-logo')()
])
const got = require('got');
const Url = require('url-parse');

async function getTitle(targetUrl) {
    try {
        const {
            body: html,
            url
        } = await got(targetUrl);
        const metadata = await metascraper({
            html,
            url
        })
        return Promise.resolve(metadata.title || null);
    } catch (err) {
        console.error(`ERROR GETTING TITLE FROM ${targetUrl}`, err);
        //Don't throw an error. The title may not be able to be scraped, so
        // just return an empty title string if it doesn't work
        return Promise.resolve('');
    }
}

// Get the favicon for a website given the url
async function getLogo(targetUrl) {
    try {
        const originUrl = new Url(targetUrl).origin; // The domain only (no path)
        const {
            body: html,
            url
        } = await got(originUrl);
        const metadata = await metascraper({
            html,
            url
        })
        //console.log("LOGO", metadata.logo);
        return Promise.resolve(metadata.logo || '');
    } catch (err) {
        console.error(`ERROR GETTING FAVICON FROM ${targetUrl}`, err);
        //Don't throw an error. The title may not be able to be scraped, so
        // just return null if it doesn't work
        return Promise.resolve('');
    }

}

module.exports = {
    getTitle,
    getLogo
};