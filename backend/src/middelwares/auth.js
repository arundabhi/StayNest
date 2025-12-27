import { User } from "../models/user.models.js"
import jwt from 'jsonwebtoken'

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3️⃣ Admin token (env-based admin)
    if (decoded.role === "admin" && decoded.id === "SYSTEM_ADMIN") {
      req.user = decoded;        // { id, role }
      req.userId = decoded.id;
      return next();
    }

    // 4️⃣ Normal user / owner
    const user = await User.findById(decoded.id)
      .select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = user;
    req.userId = user._id;
    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};