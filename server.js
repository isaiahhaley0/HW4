
/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews')
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err.message);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        User.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});
router
    .route("/reviews")
    .post(authJwtController.isAuthenticated, (req, res) => {
        newReview = new Review(req.body);
        newReview.save().then(
            () => {
                Movie.findById(req.body.movie_id, (movErr, movie) => {
                    Review.aggregate(
                        [
                            {
                                $match: {
                                    movie_id: mongoose.Types.ObjectId(req.body.movie_id),
                                },
                            },
                        ],
                        (err, reviews) => {
                            avgRating = 0;

                            reviews.forEach((review) => {
                                avgRating += review.rating;
                            });

                            avgRating /= reviews.length;

                            movie.update({ avg_rating: avgRating }, (err, raw) => {
                                if (err) {
                                    console.log(err);
                                }
                                if (raw) {
                                    console.log(raw);
                                }
                            });
                        }
                    );

                    res.status(201).send({
                        success: true,
                        message: "Review created.",
                    });
                });
            },
            () => {
                res.status(201).send({
                    success: false,
                    message: "Review not created.",
                });
            }
        );
    })
    .get((req, res) => {
        Review.find((err, reviewList) => {
            res.send(reviewList);
        });
    });
router.route('/movies')
    .get(function (req, res) {
        var movie = new Movie();
        Movie.find({}, function (err,) {
            if (err) throw err;
        else {
                console.log(movie);
                res = res.status(200);
                res.json({success: true, msg: 'got movies.'});
            }
        });
    })
    .post(function (req, res) {
        if (!req.body.title || !req.body.genre || !req.body.year || !req.body.actors && req.body.actors.length) {
            res.json({success: false, message: 'Supply title, genre, year, actors and the characters they play'});
        }
        else {
            if(req.body.actors.length < 3) {
                res.json({ success: false, message: 'three actors needed'});
            }
            else {
                var movie = new Movie(req, res);
                movie.Title = req.body.title;
                movie.Year = req.body.year;
                movie.Genre = req.body.genre;
                movie.Actors= req.body.actors;

                movie.save(function(err) {
                    if (err) {
                        if (err.code == 11000)
                            return res.json({ success: false, message: 'movie already exists'});
                        else
                            return res.send(err);
                    }
                    res.json({ message: 'success' });
                });
            }
        }
    })

    .put(function(req, res) {
        var movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actors= req.body.actors;

        if (Movie.find({title: movie.title}, function (err, m) {
            movie.save(function (err, m) {
                if (err) throw err;
                else {
                    res = res.status(200);
                    res.json({success: true, message: 'updated'});
                }
            });
        }));
    })


    .delete(function(req, res) {
        if (!req.body.title){
            res.json({success: false, message: 'Please input title of movie to delete'});
        } else {

            var title = req.body.title;
            Movie.remove({title:title}, function(err, movie) {
                if (err) res.send(err);
                res.json({success: true, message: 'deleted'});
            });
        }
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


