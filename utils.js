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
        return Promise.resolve(metadata.title || '');
    } catch (err) {
        //console.error(err);
        throw new Error(err);
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
        throw new Error(err);
    }

}

module.exports = {
    getTitle,
    getLogo
};