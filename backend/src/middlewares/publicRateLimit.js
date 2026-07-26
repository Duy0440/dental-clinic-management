const createPublicRateLimit = ({ limit = 20, windowMs = 60_000 } = {}) => {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const current = buckets.get(key);

    if (buckets.size > 1000) {
      for (const [bucketKey, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= limit) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      res.status(429).json({
        message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.",
      });
      return;
    }

    current.count += 1;
    next();
  };
};

module.exports = {
  createPublicRateLimit,
};
