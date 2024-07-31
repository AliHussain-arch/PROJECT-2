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
const auth = require('./controllers/auth');
//Signin page
app.get('/auth/signin', auth.signin)
// logging in the user
app.post('/auth/signin', auth.login);
//Signup page
app.get('/auth/signup', auth.signup)
// Creating the user
app.post('/auth/signup', auth.create)
// signout
app.get('/auth/signout', auth.signout);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(isSignedIn);

//Admin routes

const admin = require('./controllers/adminControllers.js');

//Admin homepage
app.get('/admin',admin.Index);

//Create admin page
app.get('/admin/create',admin.createAdminPage );

//Creating admin 
app.put('/admin/create',admin.creatingAdmin);

//Delete user page
app.get('/admin/delete',admin.deleteUserPage );

//Deleting user 
app.delete('/admin/delete',admin.deletingUser);

//Delete post page
app.get('/admin/deletePost',admin.deletePostPage );

//Deleting post
app.delete('/admin/deletePost',admin.deletingPost);


//User routes

const user = require('./controllers/userControllers.js');

// User home page
app.get('/:id',user.userIndex );

//View other user
app.get('/:id/viewUser',user.viewUsers)

// User profile page
app.get('/:id/profile',user.profile );

// creating a post
app.post('/:id/profile',user.createPost );

// Post create page
app.get('/:id/profile/new',user.createPostPage );

// viewing a post
app.get('/:id/profile/:postId',user.postView);

// Editing page for a post -- NOT BEING USED ---
app.put('/:id/profile/:postId/edit', (req,res) => {
    const id = req.params.id
    res.render('User/profile',{id});
});

// updating a post
app.put('/:id/profile/:postId',user.postUpdate);

// deleting a post
app.delete('/:id/profile/:postId',user.postDelete);

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>console.log(`Listening on port ${PORT}`));