const metascraper = require('metascraper')([
    require('metascraper-title')(),
  ])
const got = require('got');

async function getTitle (targetUrl){
    try {        
        const { body: html, url } = await got(targetUrl);
        const metadata = await metascraper({ html, url })
        //console.log(metadata);
        return Promise.resolve(metadata.title || '');
    }
    catch(err) {
        //console.error(err);
        throw new Error(err);
    }
}

module.exports = { getTitle };
