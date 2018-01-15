const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//mongoose.connect('mongodb://localhost/nodeauth');
mongoose.connect('mongodb://riota:Riot$123@ds251737.mlab.com:51737/riotadb');

let db = mongoose.connection;

//uSer schema
let UserSchema = mongoose.Schema({
    username: {
        type: String,
        index: true
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    profileImage: {
        type: String
    },
    secretToken: {
        type: String
    },
    isVerified: {
        type: Boolean
    }
});

let User = module.exports = mongoose.model('User', UserSchema);

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
};

module.exports.getUserByUsername = function (username, callback) {
    let query = {username : username};
    User.findOne(query, callback);
};

module.exports.getUserBySecretToken = function (secretToken, callback) {
    let query = {secretToken : secretToken};
    User.findOne(query, callback);
};

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        console.log('comparing pass', candidatePassword, hash);
        callback(null, isMatch);
    });
};

module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });

};