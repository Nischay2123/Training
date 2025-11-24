import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import env from 'dotenv'
env.config()
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    userName:{
      type:String,
      required:true,
      unique:true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, 
    },
    photo: {
      type: String, 
      default: "",
    },
    refreshToken: {
      type: String
    },
  },
  {
    timestamps:true,
  }
);

userSchema.pre("save",async function (next) {
  if (!this.isModified("password"))  return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
})

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
  // console.log(ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY);
  
  return jwt.sign(
    {
      _id: this._id,
      email:this.email,
      userName:this.userName,
      fullName:`${this.firstName} ${this.lastName}`
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

const Users = mongoose.model("User", userSchema);
export default Users;