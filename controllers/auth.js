const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

//Signin page
const signin = (req,res)=>{
    res.render('auth/signin');
}

// logging in the user
const login = async (req,res)=>{
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
    
}

//Signup page
const signup = (req,res)=>{
    res.render('auth/signup', {empty : false, exist: false, match:false});
}

// Creating the user
const create = async (req,res)=>{
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
}

// signout
const signout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect("/");
      });
}

module.exports = {
    signin,
    login,
    signup,
    create,
    signout
};