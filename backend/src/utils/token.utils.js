import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (user) => {
  const userId = user._id ? user._id : user;
  
  const accessToken = jwt.sign(
    {
      id: userId,        
      role: user.role || "user",
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '1d'}
  );

  const refreshToken = jwt.sign(
    {
      id: userId,          
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d'}
  );

  return { accessToken, refreshToken };
};

export default generateAccessAndRefreshToken;
