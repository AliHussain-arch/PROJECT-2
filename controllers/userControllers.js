const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const path = require('path');
const fs = require('fs');
const imgur = require('imgur');
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// User home page
const userIndex = async (req,res) => {
    const id = req.params.id;
    let posts = await Post.find();
    posts = posts.filter(post => post.owner.toString() !== id)
    const users = await User.find();
    res.render('User/userHomepage',{id, posts, users});
}

//View other user
const viewUsers = async (req,res) => {
    const id = req.params.id
    const posts = await Post.find({owner : id});
    const owner = (await User.findOne({_id : id})).username;
    console.log(owner);
    res.render('User/viewUser', {id, posts, owner})
}

// User profile page
const profile = async (req,res) => {
    const id = req.params.id
    const posts = await Post.find({owner : id});
    const owner = (await User.findOne({_id : id})).username;
    res.render('User/profile',{id, posts, owner});
}

// creating a post
const createPost = async (req, res) => {
    const id = req.params.id;
    const image = req.files.image;
    const uploadDir = path.join(__dirname, '../upload');
    const uploadPath = path.join(uploadDir, image.name);
    try {
        await new Promise((resolve, reject) => {
            image.mv(uploadPath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        const urlObject = await imgur.uploadFile(uploadPath);
        const postImage = urlObject.data.link;
        fs.unlinkSync(uploadPath);
        await Post.create({
            owner: id,
            image: postImage,
            description: req.body.description
        });
        const posts = await Post.find({ owner: id });
        const owner = (await User.findOne({ _id: id })).username;
        res.render('User/profile', { id, posts, owner });
    } catch (err) {
        res.status(500).send(err.message);
    }
}

// Post create page
const createPostPage = (req,res) => {
    const id = req.params.id
    res.render('User/CRUD/createPost',{id});
}

// viewing a post
const postView = async (req,res) => {
    const id = req.params.id
    const postId = req.params.postId
    const post = await Post.findOne({_id : postId});
    res.render('User/CRUD/viewPost', {id, post});
}

// updating a post
const postUpdate = async (req,res) => {
    const id = req.params.id;
    const postId = req.params.postId
    const owner = (await User.findOne({_id : id})).username;
    const post = await Post.findByIdAndUpdate(postId, {description: req.body.description} );
    const posts = await Post.find({owner : id});
    res.render('User/profile',{id, posts, owner});
}

// deleting a post
const postDelete = async (req,res) => {
    const id = req.params.id;
    const postId = req.params.postId;
    const owner = (await User.findOne({_id : id})).username;
    const post = await Post.findByIdAndDelete(postId, {description: req.body.description} );
    const posts = await Post.find({owner : id});
    res.render('User/profile',{id, posts, owner});
}

module.exports = {
    userIndex,
    viewUsers,
    profile,
    createPost,
    createPostPage,
    postView,
    postUpdate,
    postDelete
};