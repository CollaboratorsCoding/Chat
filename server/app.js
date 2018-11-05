var express = require('express');
var app = express();
var server = require('http').Server(app);
var socket = require('socket.io');
var mongoose = require('mongoose');
var Message = require('./models/Message');
var morgan = require('morgan');
var path = require('path');
var bodyParser = require('body-parser')
var passport = require('passport');
var config = require('./config');
// const session = require('express-session'); var cookieParser =
// require('cookie-parser'); const MongoStore =
// require('connect-mongo')(session);

app.use(morgan('[:date[clf]] ":method :url HTTP/:http-version" :status  :response-time ms'));

app.use(express.static(path.resolve(__dirname, '..', 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());

require('./models').connect(config.dbUri);
// app.use(session({     secret: 'mySecretString',     saveUninitialized: false,
//     resave: false,     cookie: {         maxAge: 1000 * 60 * 60 * 24 * 2 },
// // 2 days in milliseconds     store: new MongoStore({ mongooseConnection: db,
//         ttl: 2 * 24 * 60 * 60     })     //ttl: 2 days * 24 hours * 60
// minutes * 60 seconds }))
app.use(passport.initialize());
const localSignupStrategy = require('./passport/local-signup');
const localLoginStrategy = require('./passport/local-login');
passport.use('local-signup', localSignupStrategy);
passport.use('local-login', localLoginStrategy);
const authCheckMiddleware = require('./middleware/authCheck');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/admin', authCheckMiddleware, adminRoutes);

app.get('/check', authCheckMiddleware, (req, res) => {

    res.json({success: true, user: res.locals.user})
});
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
});

io = socket(server);

var storeData = {
    connections: []
};

io.on('connection', (socket) => {

    var r = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2), // red
        g = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2), // green
        b = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2); // blue
    var color = '#' + r + g + b;
    var socketId = socket.id;
    storeData
        .connections
        .push({id: socketId, color: color});
    Message
        .find({})
        .then(function (messages) {
            io.emit('INIT', {
                id: socketId,
                messages: messages,
                connections: storeData.connections
            });
        })

    socket.on('disconnect', () => {
        const oneClient = storeData
            .connections
            .filter(user => user.id === socketId);
        const index = storeData
            .connections
            .indexOf(oneClient[0]);
        storeData
            .connections
            .splice(index, 1);

        io.emit('DISC', {connections: storeData.connections});
    });

    socket.on('SEND_MESSAGE', function (data) {
        var mess = new Message(data);
        mess.save(function (err) {
            if (err) {
                return
            } else {
                io.emit('RECEIVE_MESSAGE', data);
            }
        })
    })
});
server.listen(8080, function () {
    console.log('server is running on port 8080')
});