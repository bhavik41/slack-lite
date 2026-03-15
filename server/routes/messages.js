// Messages route
import express from "express";
const router = express.Router();
router.post("/", async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "Message cannot be empty" });
  res.status(201).json({ message: "sent" });
});
export default router;
