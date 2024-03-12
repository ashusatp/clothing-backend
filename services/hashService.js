const crypto = require("crypto");
// crypto.randomBytes(64).toString('hex')
class HashService {
  hashPassword(data) {
    return crypto
      .createHmac("sha256", process.env.HASH_SECRET)
      .update(data)
      .digest("hex");
  }
}
module.exports = new HashService();