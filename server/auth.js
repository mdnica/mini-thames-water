import jwt from "jsonwebtoken";

//Middleware to verify a JWT token from the request
export function requireAuth(req, res, next) {
  // Grab the token from the "Authorization" header
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  // If no token found -> deny access
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    //Verify the token using our secret key
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Store user info from token for the next handlers
    req.user = payload;

    // Continue to the next function (the actual route)
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
