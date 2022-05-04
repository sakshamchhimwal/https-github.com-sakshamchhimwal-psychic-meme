require("dotenv").config();
//************BoilerPlate******************
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./model/mongoose_model.js");
const upload = require("./multer_storage/multer.js");
const uploadForNewItems = require("./multer_storage/multer_for_new_post.js");
//******************Setting App**************
const app = express();
app.use(express.static("statics"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");


//*****Setting Up The Sessions Middleware**********
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false
}));

//*******Setting Up The Passport Initialize And Connecting It To Sessions*****
app.use(passport.initialize());
app.use(passport.session());

//*******Setting Up Stratagies For User Got User From The User Model***********
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//**************Routes**************
//************Home Route***********
app.get("/", function(req, res) {
  res.render("login");
});

//*********Register Route***********
app.get("/register", function(req, res) {
  res.render("register", {});
});

//*********Profile Route***********
app.get("/profile", function(req, res) {
  User.findOne({
    username: "globalchatholder"
  }, (err, foundUser) => {
    if (req.isAuthenticated()) {
      res.render("profile", {
        username: req.user.username, //to get username form the req object from passport it gets the user data
        backimage: req.user.backimage,
        profileimage: req.user.profileimage,
        friends: req.user.friendsId,
        posts: req.user.posts,
        chats: foundUser.chats
      });
    } else {
      res.redirect("/");
    }
  });
});

app.get("/friends/:friendID", (req, res) => {
  const username = req.params.friendID;
  User.findOne({
    username: username
  }, (err, foundUser) => {
    if (!err) {
      res.redirect("/friendsViewProfile" + username);
    } else {
      res.redirect("/profile");
    }
  });
});

app.get("/friendsViewProfile:friendUsername", (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
      username: req.params.friendUsername
    }, (err, foundUser) => {
      if (!err) {
        console.log(foundUser);
        res.render("viewprofile", {
          username: foundUser.username,
          profileimage: foundUser.profileimage,
          friends: foundUser.friendsId,
          posts: foundUser.posts
        });
      } else {
        res.redirect("/profile");
      }
    });
  }
});

app.get("/allpeople", (req, res) => {
  if (req.isAuthenticated()) {
    User.find({
      username: {
        $ne: req.user.username
      }
    }, (err, foundUsers) => {
      if (!err) {
        res.render("allpeople", {
          allpeople: foundUsers
        });
      } else {
        console.log(err);
        res.redirect("/profile");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get("/rmfriends", (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
      username: req.user.username
    }, (err, foundUser) => {
      if (!err) {
        res.render("removefriend", {
          item: foundUser.friendsId
        });
      } else {
        res.redirect("/profile");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get("/rmposts", (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
      username: req.user.username
    }, (err, founUser) => {
      if (!err) {
        res.render("removeposts", {
          item: founUser.posts
        });
      } else {
        res.redirect("/profile");
      }
    });
  } else {
    res.redirect("/");
  }
});

//**********Logout***************
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//*************Posting Routes***********
//*************Login Post Route**********
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (!err) {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/profile");
      });
    } else {
      res.redirect("/");
      console.log(err);
    }
  });
});

//***********Register Post Route***********
app.post("/register", upload.single('avatar'), function(req, res) {
  if (req.body.password != req.body.cfpassword) {
    res.redirect("/register");
  } else {
    User.find({
      username: req.body.username
    }, function(err, foundUsers) {
      if (foundUsers.length == 0) {
        User.register({
          username: req.body.username,
          profileimage: "userimages/" + req.file.filename
        }, req.body.password, function(err, user) {
          if (!err) {
            passport.authenticate("local")(req, res, function() {
              res.redirect("/profile");
            });
          } else {
            res.redirect("/register");
          }
        });
      }
    });
  }
});

//**********Adding Friends Post Route********
app.post("/allpeople/:id", (req, res) => {
  const usernameToBeAdded = req.params.id;
  User.updateOne({
    username: req.user.username
  }, {
    $addToSet: {
      friendsId: usernameToBeAdded
    }
  }, (err, result) => {
    if (!err) {
      res.redirect("/allpeople");
    } else {
      res.redirect("/allpeople");
    }
  });
});

//***********Adding New Post Into The Site************
app.post("/profileaddpost", uploadForNewItems.single('newpost'), function(req, res) {
  User.updateOne({
    username: req.user.username
  }, {
    $push: {
      posts: "userimages/" + req.file.filename
    }
  }, (err, result) => {
    if (!err) {
      res.redirect("/profile");
    } else {
      res.redirect("/profile", function() {
        console.log(err);
      });
    }
  });
});

//**************Adding Chat Functionality***********
app.post("/addchat", function(req, res) {
  const newchat = {
    username: req.user.username,
    chat: req.body.newchat
  };
  User.updateOne({
    username: "globalchatholder"
  }, {
    $push: {
      chats: newchat
    }
  }, (err, result) => {
    if (!err) {
      res.redirect("/profile");
    } else {
      console.log(err);
      res.redirect("/");
    }
  });
});

//***************Deleting Route*******************
app.post("/rmfriends/:friendname", (req, res) => {
  console.log(req.params.friendname);
  User.updateOne({
    username: req.user.username
  }, {
    $pull: {
      friendsId: req.params.friendname
    }
  }, (err, results) => {
    if (!err) {
      res.redirect("/rmfriends");
    }
  });
});

app.post("/posts/userimages/:postname", (req, res) => {
  const removeimg = "userimages/" + req.params.postname;
  User.updateOne({
    username: req.user.username
  }, {
    $pull: {
      posts: {
        $in: removeimg
      }
    }
  }, (err, results) => {
    if (!err) {
      res.redirect("/rmposts");
    }
  });
});

//***********Listening Route************
app.listen(3000, function() {
  console.log("Server Running On Port 3000");
});