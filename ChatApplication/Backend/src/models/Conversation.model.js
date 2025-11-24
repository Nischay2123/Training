import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        _id:false,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        photo: {
          type: String, 
          default: null,
        },
        name: {
          type: String, 
          default: null,
          required:true
        },
      },
    ],
    admin:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default:null
    },
    name: {
      type: String,
      trim: true,
      default: "One-to-One",
    },
    lastMessage:{
        text: String,
        sender: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User" 
        },
        createdAt: Date,
        updatedAt: Date
    }
  },
  {
    timestamps: true 
  }
);


const Conversations = mongoose.model("Conversation", conversationSchema);
export default Conversations;