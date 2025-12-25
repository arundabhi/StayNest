import { User } from "../models/user.models.js"
import jwt from 'jsonwebtoken'

export const protect = async (req,res,next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodeToken?._id).select('-password -refreshToken')
 
    if(!user){
        return res.status(400).json({success:false,message:"Invalide Token"})
    }
    
    req.userId = user._id
    console.log(req.userId);
    req.user = user;
    next()
    } catch (error) {
        console.error("Auth error:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}