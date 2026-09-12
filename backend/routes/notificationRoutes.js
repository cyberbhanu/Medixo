const router = require("express").Router();
const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");
const { authenticateUser } = require("../middleware/auth");
const { getVapidPublicKey } = require("../utils/pushNotifications");

router.get("/vapid-public-key", (_req, res) => {
  res.json({ enabled: Boolean(getVapidPublicKey()), publicKey: getVapidPublicKey() });
});

router.use(authenticateUser);

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, readAt: null });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/subscribe", async (req, res) => {
  try {
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: "A valid browser push subscription is required" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: req.user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: req.headers["user-agent"] || "",
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: "Phone notifications enabled" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/subscribe", async (req, res) => {
  await PushSubscription.deleteOne({ userId: req.user.id, endpoint: req.body?.endpoint });
  res.json({ message: "Phone notifications disabled" });
});

router.patch("/read-all", async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ message: "Notifications marked as read" });
});

router.patch("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: "Notification not found" });
  res.json(notification);
});

module.exports = router;
