const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Post = require('../models/postModel');

//Admin homepage
const Index = async (req,res) => {
    const users = await User.find();
    const posts = await Post.find();
    res.render('Admin/adminHomepage', {posts, users});
}

//Create admin page
const createAdminPage = (req,res) => {
    res.render('Admin/createAdmin');
}

//Creating admin 
const creatingAdmin = async (req,res) => {
    const userId = req.body.userId;
    if(req.body.userId === ''){
        return res.send('Invalid Input')
    }
    const user = await User.findByIdAndUpdate(userId, { isAdmin: true });
    if (user) {
        const users = await User.find();
        const posts = await Post.find();
        return res.render('Admin/adminHomepage', {posts, users});
    } else {
        return res.status(404).send('User not found.');
    }
    
}

//Delete user page
const deleteUserPage = (req,res) => {
    res.render('Admin/deleteUser');
}

//Deleting user 
const deletingUser = async (req,res) => {
    const userId = req.body.userId;
    if(req.body.userId === ''){
        return res.send('Invalid Input')
    }
    const user = await User.findByIdAndDelete(userId);
        if (user) {
            const postsToDelete = await Post.find({ owner: userId });
            const deleteResult = await Post.deleteMany({ owner: userId });
            const users = await User.find();
            const posts = await Post.find();
            res.render('Admin/adminHomepage', { posts, users });
        } else {
            res.status(404).send('User not found.');
        }
}

//Delete post page
const deletePostPage = (req,res) => {
    res.render('Admin/deletePost');
}

//Deleting post
const deletingPost = async (req,res) => {
    const postId = req.body.postId;
    if(req.body.postId === ''){
        return res.send('Invalid Input')
    }
    const post = await Post.findByIdAndDelete(postId);
        if (post) {
            const users = await User.find();
            const posts = await Post.find();
            res.render('Admin/adminHomepage', { posts, users });
        } else {
            res.status(404).send('Post not found.');
        }
}

module.exports = {
    Index,
    createAdminPage,
    creatingAdmin,
    deleteUserPage,
    deletingUser,
    deletePostPage,
    deletingPost
};
