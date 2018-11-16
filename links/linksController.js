const urlRegex = require('url-regex');
const {
    getTitle,
    getLogo
} = require('../utils');
const {
    Link,
    Category
} = require('./models');



// FOR TESTING CALLS, DELETE BEFORE PUSHING TO PRODUCTION
// (async () => {
//    const testLogo = await getLogo('https://www.foxnews.com/us/nj-supreme-court-rules-more-than-20000-dwi-convictions-could-be-tossed');
//    const testTitle = await getTitle('https://www.foxnews.com/us/nj-supreme-court-rules-more-than-20000-dwi-convictions-could-be-tossed');
//    console.log("TEST LOGO", testLogo);
//    console.log("TEST TITLE", testTitle);
//   })();


//Gets links for a particular user - userId is located via the jwt payload
exports.getLinks = function (req, res) {
    Link.find({
            userId: req.user.id
        })
        .then(links => {
            return res.status(200).json({
                data: links
            });
        })
        .catch(err => {
            const message = `Unable to retrieve links for user ${req.user.id}`
            console.error(message);
            return res.status(500).json({
                error: {
                    message
                }
            })
        });
}

exports.deleteLink = function (req, res) {
    const id = req.params.id;
    console.log("ID TO DELETE", id);
    Link.findByIdAndRemove(id)
        .then((link) => {
            if (!link) {
                return res.status(400).json({
                    message: `Unable to delete. No link with id ${id} found.`
                })
            }
            return res.status(200).json({
                message: 'Record Deleted'
            });
        })
        .catch(err => {
            const message = `Unable to delete link with id of ${id}`
            console.error(err);
            return res.status(500).json({
                error: {
                    message
                }
            })
        })
}

exports.createLink = async function (req, res) {    
    const requiredFields = ['url'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: missingField
        });
    }

    const url = req.body.url;
    const catToFind = req.body.url || 'none';

    // If url is not a valid url, send error response 
    if (!urlRegex({
            exact: true
        }).test(url)) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: `URL ${url} is not formatted properly`,
            location: url
        });
    }

    // create a variable for category and title in case we need to save it into the link below
    let category, link, title, favIcon;

    try {        
        title = await getTitle(url);        
        favIcon = await (getLogo(url));            
        category = await Category.findOne({
            name: catToFind.toLowerCase()
        });
        if (!category) {
            category = await Category.create({
                name: catToFind.toLowerCase()
            });
        }

        link = await Link.create({
            href: url,
            category: category._id,
            userId: req.user.id,
            title,
            favIcon
        });
        if (link) {
            return res.status(201).json({
                link
            })
        } else {
            return res.status(500).json({
                error: 'Unable to create link'
            });
        }

    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
};