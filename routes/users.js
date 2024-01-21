const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/instaDb");

const userSchema = Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileDp: String,
  bio: String,
  postID: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

userSchema.plugin(plm);

const User = mongoose.model("User", userSchema);
module.exports = User;
