const { Category } = require('./models');

exports.createCategory = async function(req, res) {        

    let category = null;
    
    if (!req.body.name) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: 'name'
        });
    }    

    category = await Category.create({
        name: req.body.name,
        user: req.user.id
    });
    if (category) {
        return res.status(201).json({
            data: category
        })
    } else {
        return res.status(500).json({
            error: 'Unable to create category'
        });
    }
};

exports.deleteCategory = async function(req, res) {
    let category = null;

    if (!req.params.id) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: 'id'
        });
    }

    category =  await Category.findOneAndRemove({
        _id: req.params.id,
        user: req.user.id
    })
    
    if (!category) {
        return res.status(422).json({
            message:'Unable to delete. Could not find that category for the user'
        });
    }
    return res.status(200).json({
        message: `Category '${category.name}' successfully deleted.`
    });
};

exports.updateCategory = async function(req, res) {

    let category = null;

    if (!req.params.id) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: 'id'
        });
    }

    category = await Category.findOneAndUpdate({
        _id: req.params.id,
        user: req.user.id
    }, {
        name: req.body.name
    },{
        new: true
    })

    if (!category) {
        return res.status(422).json({
            message:'Unable to delete. Could not find that category for the user'
        });
    }
    return res.status(200).json({
        data: category
    });
 
};

exports.getCategories = async function(req, res) {
    const categories = await Category.find({ user: req.user.id });
    return res.status(200).json({
        data: categories
    });
};