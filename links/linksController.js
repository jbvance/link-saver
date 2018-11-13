const urlRegex = require('url-regex');
const metascraper = require('metascraper')([
    require('metascraper-title')(),
  ])
const got = require('got');


const { Link, Category } = require('./models');

async function getMeta (targetUrl){
    try {
        const { body: html, url } = await got(targetUrl);
        const metadata = await metascraper({ html, url })
        console.log(metadata);
        return Promise.resolve(metadata.title);
    }
    catch(err) {
        console.log(err);
    }
}

// function getMeta (url){
//     junk = url;
//   (async () => {
//     const { body: html, url } = await got(url);
//     const metadata = await metascraper({ html, url })
//     console.log(metadata)
//   })()

getMeta('https://www.google.com').then(val => console.log("VAL", val));
  

exports.createLink = function( req, res ) {
    const split = req.path.split('--');
    let list = '';
    let path = '';
    if (split.length > 1) {
      list = split[0].replace(/^\/+/g, '');
      path = split[1];
    } else {
      path = split[0].replace(/^\/+/g, '');
    }
    // If path is not a valid url, send error response 
    if (!urlRegex({exact: true}).test(path)) {
        return res.status(400).json({
            error: {
                message: `path ${path} is not a valid url`
            }
        })
    }
    let query = '';
    if (req.query) {
      query = '?' + Object.keys(req.query).map(key => key + '=' + req.query[key]).join('&');
    }

    // create a variable for category in case we need to save it into the link below
    let category = {};
    if (list) {
        Category.findOne({name: list.toLowerCase()})
        .then(foundCat => {
            if (!foundCat) {
                return Category.create({ name: list.toLocaleLowerCase() })
            } else {
                return Promise.resolve(foundCat);
            }
        })
        .then(linkCat => {
            return Link.create({ href: path, category: linkCat })
        })
        .then(link => {
            return res.status(201).json({ link })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message});
        });
    } else {
        Link.create({ href: path })
        .then(link => {
            return res.status(201).json({ link });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        });
    }

    // Link.create({
    //     href: path
    // })
    // .then(link => {
    //     return res.status(201).json({ link })
    // })
    // .catch(err => {
    //     return res.status(500).json({ error: err.message});
    // })
    // return res.json({
    //     path: `${path}${query}`,
    //     list
    //   });
  };
  