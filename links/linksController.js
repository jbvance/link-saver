const urlRegex = require('url-regex');
const {
    getTitle,
    getLogo,    
} = require('../utils');
const {
    Link,
    Category
} = require('./models');
const { User } = require('../users/models');

//Gets links for a particular user - user's id is located via the jwt payload
exports.getLinks = function (req, res) {       
    Link.find({
            user: req.user.id
        })
        .populate('category')
        .lean().populate('user', '_id username firstName lastName')          
        .then(links => {            
            return res.status(200).json({
                data: links
            });
        })
        .catch(err => {
            const message = `Unable to retrieve links for user ${req.user.id}`
            console.error(message);
            return res.status(500).json({
                code: 500,
                reason: 'ValidationError',
                message,
                location: 'Get Links'
            });
        });
}

exports.deleteLink = function (req, res) {
    const id = req.params.id;    
    Link.findByIdAndRemove(id)
        .then((link) => {
            if (!link) {
                return res.status(422).json({
                    code: 422,
                    reason: 'ValidationError',
                    message: `No link with id ${id} was found.`,
                    location: 'Delete Link'
                });
            }
            return res.status(204).send();
        })
        .catch(err => {
            const message = `Unable to delete link with id of ${id}`
            console.error(err);
            return res.status(500).json({
                code: 500,
                reason: 'ServerError',
                message,
                location: 'Delete Link'
            });
        })
}

exports.updateLink = async function(req, res) {    
    const id = req.params.id;
    const userId = req.user.id;
    let link, user

    const requiredFields = ['url', 'title', 'note'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: missingField
        });
    }

    link = await Link.findOne({ _id: id, user: req.user.id });    
    if (!link) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: `Cannot delete link. No link with id ${id} found for the user.`,
            location: 'Update Link (link)'
        });
    }   
    
    link = await Link.findByIdAndUpdate(id, req.body, { new: true });   
    if(!link) {
        return res.status(422).json({
           message: "Unable to update link"
        });
    }

    return res.status(200).json({
        data: link
    });
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
    const catToFind = req.body.category || 'none';

    // verify user exists    
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'User does not exist',
            location: "Create Link"
        });
    }

    // If url is not a valid url, send error response 
    if (!urlRegex({
            exact: true
        }).test(url)) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: `URL '${url}' is not formatted properly`,
            location: 'url'
        });
    }

    // create a variable for category and title in case we need to save it into the link below
    let category, link, title, favIcon;

    try {        
        title = req.body.title || await getTitle(url);        
        favIcon = await (getLogo(url));            
        category = await Category.findOne({
            name: catToFind.toLowerCase()
        });       
        if (!category) {                                 
            category = await Category.create({
                name: catToFind.toLowerCase(),
                user: req.user.id
            });           
        }        
        link = await Link.create({
            url,
            category: category._id,
            user: req.user.id,
            title,
            favIcon
        });
        if (link) {
            return res.status(201).json({
                data: link
            })
        } else {
            return res.status(500).json({
                error: 'Unable to create link'
            });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500,
            reason: 'ServerError',
            message: 'Unable to Create Link',
            location: 'Create Link'
        });
    }
};

