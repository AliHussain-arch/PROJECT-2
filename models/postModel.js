const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    owner : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    image : {
        default : null,
        required : false,
    },
    description : {
        type : String,
        required : true,
    },
},{ timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;