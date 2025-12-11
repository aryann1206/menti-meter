let mongoose = require("mongoose");
mongoose.connect("");


let userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true},
    password: String,
    role: {
        type: String,
        enum: ['admin', 'student'], 
        required: true
    }
})

let questionSchema = mongoose.Schema({
    title:String,
    options:[String],
    correctoption:Number
})


let quizSchema = new mongoose.Schema({
    title: { type: String },
    questions:[questionSchema]
})


let userModel = mongoose.model("userss",userSchema);
let quizModel = mongoose.model("quiz",quizSchema);


module.exports={
    userModel,
    quizModel
}
