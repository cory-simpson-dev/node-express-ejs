const express = require('express')
const router = express.Router()
const { ensureAuth, ensureGuest } = require('../middleware/auth')

const Story = require('../models/Story')

// @desc        Login/Landing page
// @route       GET /
router.get('/', ensureGuest, (req, res) => {
    res.render('login.ejs')
})

// @desc        Dashboard
// @route       GET /dashboard
router.get('/dashboard', ensureAuth, async (req, res) => {
    try {
        const stories = await Story.find({ user: req.user.id }).lean()
        res.render('main.ejs', {
            name: req.user.firstName,
            stories
        })
    } catch (err) {
        console.error(err)
        // may need 500.ejs
        res.render('error/500')
    }
})

module.exports = router