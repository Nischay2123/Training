import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
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
        },
      },
    ],
    Name: {
      type: String,
      trim: true,
      default: null,
    }
  },
  {
    timestamps: { createdAt: true },
  }
);


export default Conversations = mongoose.model("Conversation", conversationSchema);
