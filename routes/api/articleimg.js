const router = require('express').Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const auth = require('../auth');
const sizeOf = require('image-size');

// Preload article objects on routes with ':article'
router.param('article', function (req, res, next, slug) {
    Article.findOne({slug: slug})
        .then(function (article) {
            if (!article) {
                return res.sendStatus(404);
            }
            req.article = article;

            return next();
        }).catch(next);
});

// return a article image
router.get('/:article', auth.optional, function (req, res, next) {
    let userId = auth.getUserIdFromToken(req);
    Promise.all([
        userId ? User.findById(userId) : null
    ]).then(function (results) {
        const loggedUser = results[0];
        if (!req.article.published && loggedUser == null) {
            return res.sendStatus(403);
        }
        const base64Data = req.article.image.replace(/^data:image\/png;base64,/, '')
            .replace(/^data:image\/jpeg;base64,/, '');
        const img = Buffer.from(base64Data, 'base64');

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        res.end(img);
    }).catch(next);
});

module.exports = router;
