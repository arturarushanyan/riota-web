const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({dest: './uploads'});
const User = require('../models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const uuIdToken = require('uuid-token-generator');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: false,
    port: 465,
    // auth: {
    //     xoauth2: xoauth2.createXOAuth2Generator({
    //         user: 'riotatest@gmail.com',
    //         clientId: '601974907439-ht9pq3iu08rqfejoq70u6ilhcisg0osd.apps.googleusercontent.com',
    //         clientSecret: 'ey3FUmLx6pkZLAtTMqh4zXOS',
    //         refreshToken: '1/-2u8KM8VuWl90h8WDngpUrCaFZxTvpHw6J4DCotmXhY'
    //     })
    // }
    auth: {
        user: 'riotatest@gmail.com',
        pass: 'Riot$123'
    },
    tls: {
        rejectUnauthorized: false
    }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
    res.render('register',{title: 'Registration'});
});

router.get('/login', function(req, res, next) {
    res.render('login',{title: 'Login'});
});

//
router.post('/login',
    passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'invalid usr or pass'}),
    function(req, res) {
        req.flash('success', 'Loggedin');
        res.redirect('/');
});

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function (username, password, done) {
    console.log('using local strategy');
    User.getUserByUsername(username, function (err,user) {
        if(err) {
            console.log('some error accured');
            return done(err)
        }
        if(!user){
            console.log("!user case here");
            return done(null, false, {message: 'Unknown User'})
        }
        User.comparePassword(password, user.password, function (err, isMatch) {
            if(err) return done(err);
            if(isMatch){
                return done(null, user);
            } else{
                done(null, false, {message: 'Invalid Password'})
            }
        })
    })
}));

//REGISTRATION
router.post('/register', upload.single('profileimage'), function(req, res, next) {
    let name = req.body.name,
        userName = req.body.username,
        email = req.body.email,
        password = req.body.password,
        password2 = req.body.password2,
        profileImage = 'noimage.jpg',
        secretToken = new uuIdToken(256, uuIdToken.BASE62).generate();
        console.log('verify token is ',secretToken);
        console.log('request protocol is ',req.protocol);
        console.log('request host is',req.get('host'));

    if(req.file){
        console.log("file uploading...");
        profileImage = req.file.filename;
    } else {
        console.log("no file upload...");
    }

    //Form validation
    req.checkBody('name', 'name field is required').notEmpty();
    req.checkBody('email', 'email field is required').notEmpty();
    req.checkBody('email', 'email is not valid').isEmail();
    req.checkBody('username', 'username field is required').notEmpty();
    req.checkBody('password', 'pass field is required').notEmpty();
    req.checkBody('password2', 'pass field is required').equals(password);

    //check errors
    let errors = req.validationErrors();

    if(errors){
        console.log('errors',errors);
        res.render('register',{errors: errors})
    } else {
        console.log("Success");
        let newUser = new User({
            name: name,
            email: email,
            username: userName,
            password: password,
            secretToken: secretToken,
            isVerified: false,
            profileImage: profileImage
        });
        User.createUser(newUser, function (error, user) {
            if(error){
                throw error;
            } else {
              console.log(user);
            }
        });

        req.flash('success','Youre now registered and can login');

        //mail options for sending mail
        let mailOptions = {
            from: 'riotatest@gmail.com',
            to: email,
            subject: 'Welcome to Riota!',
            text: 'Congrats',
            html: '<p>Click <a href="' + req.protocol+ '://'+ req.get('host') + '/users/verify/' + secretToken + '">here</a> to verify your account</p>'
        };

        //send email
        transporter.sendMail(mailOptions, function (err, res) {
            if(err){
                console.log('Error', err);
            } else {
                console.log('Email Sent');
            }
        });

        res.location('/');
        res.redirect('/');

    }
    console.log('request data',req.body);
    console.log('request file', req.file);
});

router.get('/logout', function (req, res) {
    req.logOut();
    req.flash('success', 'You are now logged out');
    res.redirect('/users/login');
});

router.get('/verify/:secretToken', function (req, res) {
    // let verifyUser = User.getUserBySecretToken(req.params.secretToken, (err) => {
    //     if(err){
    //         throw err;
    //     } else {
    //         console.log('User Finded')
    //     }
    // });

    User.findOneAndUpdate({secretToken:req.params.secretToken}, {isVerified: true}, (err,user) => {
        if(err){
            throw err;
        }
        if(!user){
            req.flash('error', 'no user')
        }
    });
    //console.log('vser to be verified', user);
    req.flash('success', 'Your email successfully verified');
    res.render('verify');
});
module.exports = router;
