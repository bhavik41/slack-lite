// Channel model
import mongoose from "mongoose";
const channelSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  topic:     { type: String, default: "" },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPrivate: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Channel", channelSchema);
