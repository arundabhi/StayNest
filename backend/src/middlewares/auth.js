import { User } from "../models/user.models.js"
import jwt from 'jsonwebtoken'

export const protect = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({
        success: false,
        message: "Token missing or invalid",
      });
    }

  
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

   
    if (decoded.role === "admin" && decoded.id === "SYSTEM_ADMIN") {
      req.user = decoded;        
      req.userId = decoded.id;
      return next();
    }

  
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