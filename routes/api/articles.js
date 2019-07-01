const router = require('express').Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const Category = mongoose.model('Category');
const auth = require('../auth');

// Preload article objects on routes with ':article'
router.param('article', function (req, res, next, slug) {
    let populateQuery = ['author', 'categories'];
    Article.findOne({slug: slug})
        .populate(populateQuery)
        .then(function (article) {
            if (!article) {
                return res.sendStatus(404);
            }
            req.article = article;

            return next();
        }).catch(next);
});

router.get('/', function (req, res, next) {
    let query = {};
    let limit = 20;
    let offset = 0;

    if (typeof req.query.limit !== 'undefined') {
        limit = req.query.limit;
    }

    if (typeof req.query.offset !== 'undefined') {
        offset = req.query.offset;
    }

    if (typeof req.query.tag !== 'undefined') {
        query.tagList = {"$in": [req.query.tag]};
    }

    let userId = auth.getUserIdFromToken(req);

    Promise.all([
        req.query.category ? Category.findOne({slug: req.query.category}) : null,
        userId ? User.findById(userId) : null
    ]).then(function (results) {
        const category = results[0];
        const loggedUser = results[1];
        if (category) {
            query.categories = {"$in": [category]};
        }
        if (loggedUser) {
            query.published = {"$in": [true, false, undefined, null]};
        } else {
            query.published = {"$in": [true]};
        }

        return Promise.all([
            Article.find(query)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({createdAt: 'desc'})
                .populate('author')
                .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null,
        ]).then(function (results) {
            const articles = results[0];
            const articlesCount = results[1];
            const user = results[2];

            return res.json({
                articles: articles.map(function (article) {
                    return article.toJSONFor(user);
                }),
                articlesCount: articlesCount
            });
        });
    }).catch(next);
});

router.post('/', auth.required, function (req, res, next) {
    const slugCategories = req.body.article.categories.map(category => category.slug);
    Category.find({slug: {$in: slugCategories}}, function (err, categories) {
        if (!categories) {
            return res.sendStatus(401);
        }
        User.findById(req.payload.id).then(function (user) {
            if (!user) {
                return res.sendStatus(401);
            }
            let article = new Article(req.body.article);
            article.categories = categories;
            article.author = user;

            return article.save().then(function () {
                return res.json({article: article.toJSONFor(user)});
            });
        }).catch(next);
    });
});

// return a article
router.get('/:article', auth.optional, function (req, res, next) {
    let userId = auth.getUserIdFromToken(req);
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null,
        userId ? User.findById(userId) : null,
        req.article.populate('author').execPopulate()
    ]).then(function (results) {
        const user = results[0];
        const loggedUser = results[1];
        if (!req.article.published && loggedUser == null) {
            return res.sendStatus(403);
        }
        return res.json({article: req.article.toJSONFor(user)});
    }).catch(next);
});

// update article
router.put('/:article', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (req.article.author._id.toString() === req.payload.id.toString()) {
            if (typeof req.body.article.title !== 'undefined') {
                req.article.title = req.body.article.title;
            }

            if (typeof req.body.article.description !== 'undefined') {
                req.article.description = req.body.article.description;
            }

            if (typeof req.body.article.body !== 'undefined') {
                req.article.body = req.body.article.body;
            }

            if (typeof req.body.article.tagList !== 'undefined') {
                req.article.tagList = req.body.article.tagList
            }

            req.article.save().then(function (article) {
                return res.json({article: article.toJSONFor(user)});
            }).catch(next);
        } else {
            return res.sendStatus(403);
        }
    });
});

// delete article
router.delete('/:article', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }

        if (req.article.author._id.toString() === req.payload.id.toString()) {
            return req.article.remove().then(function () {
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(403);
        }
    }).catch(next);
});

module.exports = router;
