const express = require('express');
const app = express();

// requiring image needed module
const fs = require('fs');
const imgur = require('imgur');
const fileUpload = require('express-fileupload');
app.use(fileUpload());

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
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// requiring and setting method override middleware
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Serve static files from the public directory
app.use(express.static('public'));

// requiring and setting express-session middleware and session middleware
const MongoStore = require("connect-mongo");
const session = require('express-session');
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.mongoDB_URI,
      }),
    })
  );
  const passUserToView = require("./middleware/pass-user-to-view.js");
  app.use(passUserToView);
  const isSignedIn = require('./middleware/is-signed-in.js');

//requiring and setting morgan middleware
const morgan = require('morgan');
app.use(morgan('dev'));

//functions fisher-yates shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Homepage
app.get('/',async (req,res)=>{
    const posts = shuffleArray(await Post.find());
    const users = await User.find();
    res.render('Index', {posts, users});
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
    if(req.body.username === ''){
        return res.send('Invalid Input')
    }
    if(req.body.password === ''){
        return res.send('Invalid Input')
    }
    if(!user){
        return res.send('Invalid Input')
    }
    if(! await bcrypt.compare(req.body.password , user.password)){
        return res.send('Invalid Input')
    }
    if(user.isAdmin){
        req.session.user = {
            username: user.username,
          };
          req.session.save(() => {
            return res.redirect(`/admin`);
          });
    }
    else{
        req.session.user = {
            username: user.username,
          };
        req.session.save(() => {
        return res.redirect(`/${user.id}`);
        });
        
    }
    
});
//Signup page
app.get('/auth/signup',(req,res)=>{
    res.render('auth/signup', {empty : false, exist: false, match:false});
})
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
// Creating the user
app.post('/auth/signup',async (req,res)=>{
    if(req.body.username === ''){
        return res.render('auth/signup', {empty : true, exist: false, match:false});
    }
    if(req.body.password === ''){
        return res.render('auth/signup', {empty : true, exist: false, match:false});
    }
    if(req.body.confirmPassword === ''){
        return res.render('auth/signup', {empty : true, exist: false, match:false});
    }
    if(await User.findOne({username:req.body.username})){
        return res.render('auth/signup', {empty : false, exist: true, match:false});
    };
    if(req.body.password !== req.body.confirmPassword){
        return res.render('auth/signup', {empty : false, exist: false, match:true});
    }
    await User.create({
        username : req.body.username,
        password : await bcrypt.hash(req.body.password,SALT_ROUNDS)
    });
    res.redirect('/auth/signin');
})
// signout
app.get('/auth/signout', (req, res, next) => {
    req.session.destroy(() => {
        res.redirect("/");
      });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(isSignedIn);

//Admin routes
//Admin homepage
app.get('/admin',async (req,res) => {
    const users = await User.find();
    const posts = await Post.find();
    res.render('Admin/adminHomepage', {posts, users});
});

//Create admin page
app.get('/admin/create', (req,res) => {
    res.render('Admin/createAdmin');
});

//Creating admin 
app.put('/admin/create',async (req,res) => {
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
    
});

//Delete user page
app.get('/admin/delete', (req,res) => {
    res.render('Admin/deleteUser');
});

//Deleting user 
app.delete('/admin/delete',async (req,res) => {
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
});

//Delete post page
app.get('/admin/deletePost', (req,res) => {
    res.render('Admin/deletePost');
});

//Deleting post
app.delete('/admin/deletePost',async (req,res) => {
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
            res.send('Post not found.')
            // res.status(404).send('Post not found.');
        }
});


//User routes

// User home page
app.get('/:id', async (req,res) => {
    const id = req.params.id;
    let posts = await Post.find();
    posts = posts.filter(post => post.owner.toString() !== id)
    const users = await User.find();
    res.render('User/userHomepage',{id, posts, users});
});

//View other user
app.get('/:id/viewUser',async (req,res) => {
    const id = req.params.id
    const posts = await Post.find({owner : id});
    const owner = (await User.findOne({_id : id})).username;
    console.log(owner);
    res.render('User/viewUser', {id, posts, owner})
})

// User profile page
app.get('/:id/profile', async (req,res) => {
    const id = req.params.id
    const posts = await Post.find({owner : id});
    const owner = (await User.findOne({_id : id})).username;
    res.render('User/profile',{id, posts, owner});
});

// creating a post
app.post('/:id/profile', async (req, res) => {
    const id = req.params.id;
    const image = req.files.image;
    const uploadPath = __dirname + '/upload/' + image.name; 
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

// deleting a post
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