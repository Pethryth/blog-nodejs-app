const router = require('express').Router();
const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const User = mongoose.model('User');
const auth = require('../auth');

// Preload category objects on routes with ':category'
router.param('category', function (req, res, next, slug) {
    Category.findOne({slug: slug})
        .populate('author')
        .then(function (category) {
            if (!category) {
                return res.sendStatus(404);
            }

            req.category = category;

            return next();
        }).catch(next);
});

router.get('/', auth.optional, function (req, res, next) {
    let query = {};

    return Promise.all([
        Category.find(query).exec(),
        Category.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null,
    ]).then(function (results) {
        const categories = results[0];
        const categoriesCount = results[1];
        return res.json({
            categories: categories.map(function (category) {
                return category.toJSONFor();
            }),
            categoriesCount: categoriesCount
        });
    }).catch(next);
});

router.get('/header', auth.optional, function (req, res, next) {
    let query = {};
    query.parentCategory = {"$in": [null]};

    return Promise.all([
        Category.find(query).populate("childrenCategories").exec(),
        Category.count(query).exec()
    ]).then(function (results) {
        const categories = results[0];
        const categoriesCount = results[1];

        return res.json({
            categories: categories.map(function (category) {
                return category.toJSONForHeader();
            }),
            categoriesCount: categoriesCount
        });
    }).catch(next);
});

router.post('/', auth.required, function (req, res, next) {
    Promise.all([req.body.category.parentCategory ? Category.findOne({slug: req.body.category.parentCategory}) : null,
    User.findById(req.payload.id)]).then(function (results) {
        const parentCategory = results[0];
        const user = results[1];
        if (!user) {
            return res.sendStatus(401);
        }

        let category = new Category(req.body.category);
        if(parentCategory) {
            category.parentCategory = parentCategory._id;
        }
        return category.save().then(function (category) {
            if(parentCategory) {
                parentCategory.childrenCategories.push(category);
                parentCategory.save();
            }
            return res.json({category: category.toJSONFor()});
        });
    }).catch(next);
});

// return a category
router.get('/:category', auth.optional, function (req, res, next) {
    Promise.all([
        req.category.populate('author').execPopulate()
    ]).then(function () {
        return res.json({category: req.category.toJSONFor()});
    }).catch(next);
});

// update category
router.put('/:category', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        if (req.category.author._id.toString() === req.payload.id.toString()) {
            if (typeof req.body.category.title !== 'undefined') {
                req.category.title = req.body.category.title;
            }

            if (typeof req.body.category.description !== 'undefined') {
                req.category.description = req.body.category.description;
            }

            req.category.save().then(function (category) {
                return res.json({category: category.toJSONFor()});
            }).catch(next);
        } else {
            return res.sendStatus(403);
        }
    });
});

// delete category
router.delete('/:category', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return req.category.remove().then(function () {
            return res.sendStatus(204);
        });
    }).catch(next);
});

module.exports = router;
