const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')
const moment = require('moment')

// load config
dotenv.config({ path: './config/config.env' })

// passport config
require('./config/passport')(passport)

connectDB()

const app = express()

// body parser
// helps get data from req.body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// method override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        let method = req.body._method
        delete req.body._method
        return method
    }
}))

// ejs locals (helpers)
app.locals.formatDate = (date, format) => {
    return moment(date).format(format)
}
app.locals.truncate = (str, len) => {
    if (str.length > len && str.length > 0) {
        let new_str = str + ' '
        new_str = str.substr(0, len)
        new_str = str.substr(0, new_str.lastIndexOf(' '))
        new_str = new_str.length > 0 ? new_str : str.substr(0, len)
        return new_str + '...'
    }
    return str
}
app.locals.stripTags = (input) => {
    return input.replace(/<(?:.|\n)*?>/gm, '')
}
app.locals.editIcon = (storyUser, loggedUser, storyId, floating = true) => {
    if (storyUser._id.toString() == loggedUser._id.toString()) {
        if (floating) {
            // fa-small is not actual font-awesome class; therefore, create in local style.css
            return `<a href="/stories/edit/${storyId}" class="btn-floating halfway-fab blue"><i class="fas fa-edit fa-small"></i></a>`
        } else {
            return `<a href="/stories/edit/${storyId}"><i class="fas fa-edit"></i></a>`
        }
    } else {
        return ''
    }
}

// ejs (not handlebars like in traversy tut @ 19 minutes)
app.set('view engine', 'ejs')

// sessions (must be above passport middleware)
app.use(session({
    // any password
    secret: 'keyboard cat',
    // false = don't want to save session if nothing is modified
    resave: false,
    // false = don't create a session until something is stored 
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI})
}))

// passport middleware
app.use(passport.initialize())
app.use(passport.session())

// set global variable
app.use(function (req, res, next) {
    // access current user within our templates
    res.locals.user = req.user || null
    next()
})

// static folder
app.use(express.static(path.join(__dirname, 'public')))

// routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

// logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

const PORT = process.env.PORT || 8000

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))