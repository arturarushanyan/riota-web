const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({dest: './uploads'});

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

router.post('/register', upload.single('profileimage'), function(req, res, next) {
    const name = req.body.name,
          userName = req.body.username,
          email = req.body.email,
          password = req.body.password,
          password2 = req.body.password2;
    var profileImage = 'noimage.jpg';

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
    var errors = req.validationErrors();

    if(errors){
        console.log('errors',errors);
        res.render('register',{errors: errors})
    } else {
        console.log("Success");
    }
    console.log('request data',req.body);
    console.log('request file', req.file);
});
module.exports = router;
