const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = Schema({
  uploadedImage: String,
  caption: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", //note: the ref: {name of the model}, i.e., in our case the refrence model name is User which is exported from the users.js
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  numOfLikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", //note: the ref: {name of the model}, i.e., in our case the refrence model name is User which is exported from the users.js
    },
  ],
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
