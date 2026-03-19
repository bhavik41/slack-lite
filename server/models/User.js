// User model
import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  avatar:    { type: String, default: "" },
  status:    { type: String, enum: ["online","away","offline"], default: "offline" },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("User", userSchema);
