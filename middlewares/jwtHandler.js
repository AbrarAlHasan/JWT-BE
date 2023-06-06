import jwt from "jsonwebtoken";

export const signToken = (details, type) => {
  if (type === "access") {
    // logic for generating an access token
    return jwt.sign({ details }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "24h",
    });
  } else if (type === "refresh") {
    return jwt.sign({ details }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "10m",
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
