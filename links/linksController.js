const urlRegex = require('url-regex');
const { getTitle, getLogo } = require('../utils');
const { Link, Category } = require('./models');



// FOR TESTING CALLS, DELETE BEFORE PUSHING TO PRODUCTION
// (async () => {
//    const testLogo = await getLogo('https://www.foxnews.com/us/nj-supreme-court-rules-more-than-20000-dwi-convictions-could-be-tossed');
//    const testTitle = await getTitle('https://www.foxnews.com/us/nj-supreme-court-rules-more-than-20000-dwi-convictions-could-be-tossed');
//    console.log("TEST LOGO", testLogo);
//    console.log("TEST TITLE", testTitle);
//   })();

exports.createLink = async function( req, res ) {
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
    if (req.query && Object.keys(req.query).length) {
        console.log("QUERY FOUND", req.query);
        query = '?' + Object.keys(req.query).map(key => key + '=' + req.query[key]).join('&');
        path += query;
    }

    // create a variable for category and title in case we need to save it into the link below
    let category, link, title, favIcon;

    try {
        title = await getTitle(path);
        favIcon = await (getLogo(path));
        if (list) {        
            category = await Category.findOne({name: list.toLowerCase()});           
            if (!category) {
                category = await Category.create({ name: list.toLocaleLowerCase() })           
            }           

            link = await Link.create({ href: path, category: category._id, title, favIcon });
            if (link) {
                return res.status(201).json({ link })
            }  else {
                return res.status(500).json({ error: 'Unable to create link'});
            }                                    
        } else {
            link = await Link.create({ href: path, title, favIcon });          
            return res.status(201).json({ link });
        }
    } catch(err) {
        return res.status(500).json({ error: err.message })
    }
  };
  