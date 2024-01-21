var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false, error: req.flash("error") });
});

router.get("/feed", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });

  const everyUser = await userModel.find({});

  const postedImages = await postModel.find().populate("userId");
  // console.log(loggedInUser);
  // console.log(postedImages);
  // console.log(everyUser);

  // This code show actual number of days before the post was posted
  function calculateTimeDifference(postDate) {
    const currentDate = new Date();
    const postDateTime = new Date(postDate);
    const timeDifference = currentDate - postDateTime;

    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  res.render("feed", {
    footer: true,
    loggedInUser,
    postedImages,
    calculateTimeDifference,
    everyUser,
  });
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("postID");
  console.log(loggedInUser);
  res.render("profile", { footer: true, loggedInUser });
});

router.get("/search", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("search", { footer: true, loggedInUser });
});

router.get("/like/post/:id", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  const likedPost = await postModel.findOne({
    _id: req.params.id, //kyuki id jo hai url ke through aha rahi hai isliye req.params use kar rahe hai
  });

  // now we want ki agar user ne already like kiya hai toh like remove ho jaye and like nahi hai toh aha jaye
  likedPost.numOfLikes.push;
  // niche wali line ka matlab hai ki hum likedPost mai numOfLikes ke array mai dhund rahe hai loggedInUser user ki id. i.e, agar loggedInUser ne post like nahi kiya hoga toh toh condition -1 ke equal hoga and condition true ho jayega
  if (likedPost.numOfLikes.indexOf(loggedInUser._id) === -1) {
    // agar user ne like nahi kiya hai toh yeh wala code chalega
    likedPost.numOfLikes.push(loggedInUser._id);
  } else {
    //and agar user ka already like hoga toh wapas click karne pe woh like haat jayega
    // likedPost.numOfLikes.splice({jis element ko remove karna hai uska index}, {kine elements hatane hai idhar usko mention karo});
    likedPost.numOfLikes.splice(
      likedPost.numOfLikes.indexOf(loggedInUser._id),
      1
    );
  }
  await likedPost.save();
  res.redirect("/feed");
});

router.get("/edit", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  console.log(loggedInUser);
  res.render("edit", { footer: true, loggedInUser });
});

router.get("/upload", isLoggedIn, async function (req, res) {
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("upload", { footer: true, loggedInUser });
});

// Adding search functionality begins here
router.get("/username/:username", isLoggedIn, async function (req, res) {
  // const regex = new RegExp(`^${SerachTerm}`, "i");
  const regex = new RegExp(`^${req.params.username}`, "i");
  const searchedUser = await userModel.find({
    username: regex,
  });
  res.json(searchedUser);
});

// For logout route search on google for the latest code
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
    failureFlash: true,
  }),
  function (req, res, next) {}
);

//hum yaha pe jo file user upload kar raha hai apne edit profile pe usko multer ke through handle karenge
router.post("/update", upload.single("dpImage"), async function (req, res) {
  //userModel.findOneAndUpdate({unique id of LoggedInUser}, {jo data update karna hai}, {new: true});
  const loggedInUser = await userModel.findOneAndUpdate(
    {
      username: req.session.passport.user, //loggedInUser ko find kiya id ke through jiske database mai changes karne hai hume
    },
    {
      // yaha pe sare changes update kare db mai jo edit.ejs form ke through aaye the
      username: req.body.username,
      name: req.body.name,
      bio: req.body.bio,
    },
    {
      new: true,
    }
  );

  // This condition is added to handle the scenario user don't update the Profile Image
  if (req.file) {
    loggedInUser.profileDp = req.file.filename; //yeh wale line se humne user ki dp(profile image) ko update kiya
  }

  // ab hame sare changes ko save karna padega
  await loggedInUser.save();
  // ab sare changes hone ke baad hame user ko kaha bhejna hai woh batana padega
  res.redirect("/profile");
});

router.post("/upload", upload.single("uploadedImg"), async function (req, res) {
  const loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  //post jo hai woh postModel ke andar save hoga and hum userModel mai sirf newPost ki id save karenge
  const newPost = await postModel.create({
    uploadedImage: req.file.filename,
    caption: req.body.caption,
    userId: loggedInUser._id,
  });

  loggedInUser.postID.push(newPost._id);
  await loggedInUser.save();
  res.redirect("/feed");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
