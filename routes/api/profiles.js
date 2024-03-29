const router = require('express').Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const auth = require('../auth');

// Preload user profile on routes with ':username'
router.param('username', function (req, res, next, username) {
    User.findOne({username: username}).then(function (user) {
        if (!user) {
            return res.sendStatus(404);
        }

        req.profile = user;

        return next();
    }).catch(next);
});

router.get('/:username', auth.optional, function (req, res, next) {
    if (req.payload) {
        User.findById(req.payload.id).then(function (user) {
            if (!user) {
                return res.json({profile: undefined});
            }

            return res.json({profile: req.profile.toProfileJSONFor(user)});
        });
    } else {
        return res.json({profile: undefined});
    }
});

module.exports = router;
