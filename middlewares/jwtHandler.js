import jwt from "jsonwebtoken";

export const signToken = (details, type) => {
  if (type === "access") {
    // logic for generating an access token
    return jwt.sign({ details }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "1h",
    });
  } else if (type === "refresh") {
    return jwt.sign({ details }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "365d",
    });
    // logic for generating a refresh token
  }
};

export const generateTokens = (id) => {
  return {
    accessToken: signToken(id, "access"),
    refreshToken: signToken(id, "refresh"),
  };
};

export const verifyJWT = (token, type) => {
  try {
    const decoded = jwt.verify(
      token,
      type === "access"
        ? process.env.JWT_ACCESS_SECRET
        : process.env.JWT_REFRESH_SECRET
    );
    if (!decoded.iat) {
      return { error: "Invalid token" };
    }
    return decoded;
  } catch (err) {
    return { error: err.message };
  }
};

export const checkAccessBearerToken = async (req, res, next) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const refreshToken = req.headers["x-refresh-key"];
  try {
    if (!accessToken) {
      return res.status(410).json("UnAuthorized Access");
    }
    const decoded = verifyJWT(accessToken, "access");
    if (!decoded.iat) {
      console.log("Access Token Expired");
      const decodedRefreshToken = verifyJWT(refreshToken, "refresh");
      console.log('Decoded Refresh TOken',decodedRefreshToken)
      if (!decodedRefreshToken.iat) {
        console.log("Refresh Token Expired");
        return res.status(420).json("Token Expired");
      } else {
        const newAccessToken = signToken(decodedRefreshToken.details, "access");
        return res.status(405).json({accessToken:newAccessToken});
      }
    }
    next();
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
