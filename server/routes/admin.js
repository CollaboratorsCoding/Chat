const express = require('express');
const router = new express.Router();
const User = require('mongoose').model('User');

router.get('/getusers', (req, res) => {
    if (res.locals.user.isAdmin) {
        User.find({}, (err, users) => {
            return res.json({users: users})
        })
    } else {
        return res.json('COOLHASKER SHOLE EPTA?')
    }

});

module.exports = router