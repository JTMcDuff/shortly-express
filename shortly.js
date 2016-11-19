var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

//library that enables sessions for express
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var uuid = require('uuid');

var app = express();

//Format:  hash: uid;
var sessions = {};
//Export for other functions to associate has with uid.
module.exports.Sessions = sessions;


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

//Add the cookie parser middleware
app.use(express.cookieParser());



//CHANGES

 app.get('/login', function(req, res) {
   res.render('login');
 });

 app.get('/signup', function(req,res) {
   res.render('signup');
 })

// //TESTING ENDPOINT
// app.get('/test', function(req,res) {

// })

// //Expand on this to add message.
// app.get('/logout', function(req, res) {
//   console.log("TODO: LOGOUT USER AND REDIRECT TO INDEX")
//   res.render('index');
// });

//END OF CHANGES

app.get('/', function(req, res) {
  //res.set('session', sessions[])
  res.render('index');
});

app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});


app.post('/links', function(req, res) {
  var uri = req.body.url;
console.log('serving request for ', req.url)


  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', function(req, res) {
  var user = req.body.username;
  var password = req.body.password;
  console.log('Running Signup...')
  new User ( {'username': user, 'password': password} ).fetch()
    .then (function (exists) {
      //console.log('passing first then');
      if(exists) {
        console.log('Already exists.');
        res.send(201,'User exists');
        } //Need some kind of response here?
      else {
         new User ( {'username': user, 'password': password}).save()
         .then(function(model) {
           console.log('model', model);
           if(model) {
             res.set( {location: '/'} );
             res.send(301, "/");
           }
           else { console.log("Something screwed up."); }

         })
      }
    })
})
// POST REQUEST TO LOGIN PAGE
app.post('/login', function(req, res) {
  console.log('running POST login')
  var user = req.body.username
  var password = req.body.password
  new User ({'username': user, 'password': password}).fetch()
    .then(function (exists) {
      if (exists) {
        var sessionID = uuid();
        sessions[sessionID] = exists.id;
        //set a cookie:
        res.cookie('session', sessionID)
        res.set('session', sessionID );
        res.send(201, res,cookie.session);
      }
      else {
        res.set({location: '/login'});
        res.send(201, 'Login Failed.');
      }
    })
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
