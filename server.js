const express = require('express');
const app = express();

// hashing module
const bcrypt = require('bcrypt');

// Parsing dotenv files
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const mongoDBconnection = require('./config/mongoDBconnection')
const User = require('./models/userModel');
const Post = require('./models/postModel');

// requiring and setting up parsing middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// requiring and setting method override middleware
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// requiring and setting express-session middleware and session middleware
const session = require('express-session');
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
}));

//requiring and setting morgan middleware
const morgan = require('morgan');
app.use(morgan('dev'));



// Homepage
app.get('/',(req,res)=>{
    res.render('Index');
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Authentication
//Signin page
app.get('/auth/signin',(req,res)=>{
    res.render('auth/signin');
})
// logging in the user
app.post('/auth/signin',async (req,res)=>{
    const user = await User.findOne({username : req.body.username})
    if(!user){
        return res.send('Invalid Input')
    }
    if(! await bcrypt.compare(req.body.password , user.password)){
        return res.send('Invalid Input')
    }
    if(user.isAdmin){
        return res.redirect(`/admin`);
    }
    else{
        return res.redirect(`/${user.id}`);
    }
    
});
//Signup page
app.get('/auth/signup',(req,res)=>{
    res.render('auth/signup');
})
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
// Creating the user
app.post('/auth/signup',async (req,res)=>{
    if(await User.findOne({username:req.body.username})){
        return res.send('user already exists')
    };
    if(req.body.password !== req.body.confirmPassword){
        return res.send('confirm password doesnt match password')
    }
    await User.create({
        username : req.body.username,
        password : await bcrypt.hash(req.body.password,SALT_ROUNDS)
    });
    res.redirect('/auth/signin');
})
// signout
app.get('auth/sign-out', (req, res, next) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Admin routes
app.get('/admin', (req,res) => {
    res.render('Admin/adminHomepage');
});

//User routes

// User home page
app.get('/:id', async (req,res) => {
    const id = req.params.id;
    const posts = await Post.find();
    res.render('User/userHomepage',{id, posts});
});

// User profile page
app.get('/:id/profile', async (req,res) => {
    const id = req.params.id
    const posts = await Post.find({owner : id});
    const owner = (await User.findOne({_id : id})).username;
    res.render('User/profile',{id, posts, owner});
});

// creating a post
app.post('/:id/profile',async (req,res) => {
    const id = req.params.id;
    await Post.create({
        owner : id,
        // image :
        description : req.body.description
    })
    const posts = await Post.find({owner : id});
    const owner = (await User.findOne({_id : id})).username;
    res.render('User/profile',{id, posts, owner});
});

// User create page
app.get('/:id/profile/new', (req,res) => {
    const id = req.params.id
    res.render('User/CRUD/createPost',{id});
});

// viewing a post
app.get('/:id/profile/:postId',async (req,res) => {
    const id = req.params.id
    const postId = req.params.postId
    const post = await Post.findOne({_id : postId});
    res.render('User/CRUD/viewPost', {id, post});
});

// Editing page for a post -- NOT BEING USED ---
app.put('/:id/profile/:postId/edit', (req,res) => {
    const id = req.params.id
    res.render('User/profile',{id});
});

// updating a post
app.put('/:id/profile/:postId',async (req,res) => {
    const id = req.params.id;
    const postId = req.params.postId
    const owner = (await User.findOne({_id : id})).username;
    const post = await Post.findByIdAndUpdate(postId, {description: req.body.description} );
    const posts = await Post.find({owner : id});
    res.render('User/profile',{id, posts, owner});
});

// updating a post
app.delete('/:id/profile/:postId',async (req,res) => {
    const id = req.params.id;
    const postId = req.params.postId;
    const owner = (await User.findOne({_id : id})).username;
    const post = await Post.findByIdAndDelete(postId, {description: req.body.description} );
    const posts = await Post.find({owner : id});
    res.render('User/profile',{id, posts, owner});
});




const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>console.log(`Listening on port ${PORT}`));