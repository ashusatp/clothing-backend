const User = require("../models/User");
const CustomErrorHandler = require("../services/CustomErrorHandler");
const JwtService = require("../services/JwtService");

// User JWT verification
async function jwtVerification(req, res, next) {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    next(CustomErrorHandler.unAuthorized());
    return;
  }
  try {
    const token = JwtService.verifyAccessToken(accessToken);

    if (await User.findOne({ _id: token.userId })) {
      req.__auth = {
        role: "user",
        id: token.userId,
      };
      // } else if (await Admin.findOne({_id : token.id})) {
      // 	req.__auth = {
      // 		role: "admin",
      // 		id: token.id,
      // 	};
    } else {
      next(CustomErrorHandler.unAuthorized("Invalid authentication token"));
      return;
    }
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      next(CustomErrorHandler.unAuthorized(err.name + ": " + err.message));
      return;
    } else if (err.name === "JsonWebToken" && err.message === "invalid token") {
      next(CustomErrorHandler.unAuthorized(err.name + ": " + err.message));
      return;
    } else {
      next(CustomErrorHandler.serverError(err.name + ": " + err.message));
      return;
    }
  }
  next();
}

// Check user email verification status
async function emailStatusVerification(req, res, next) {
  const { accessToken } = req.cookies;
  const user = JwtService.verify(accessToken);
  await User.findOne({
    _id: user.userId,
  }).then((user) => {
    if (!user.email_verification) {
      return res.status(300).message({
        message: "Email ID not verified",
      });
    } else {
      next();
    }
  });
}

function checkUserRole(req, res, next) {
  if (req.__auth.role !== "user") {
    next(CustomErrorHandler.unAuthorized("Not a 'User'! "));
    return;
  }
  next();
}

function checkAdminRole(req, res, next) {
  if (req.__auth.role !== "admin") {
    next(CustomErrorHandler.unAuthorized("Not a 'Admin'! "));
    return;
  }
  next();
}

const authMiddleware = {
  jwtAuth: jwtVerification,
  emailStatus: emailStatusVerification,
  userCheck: checkUserRole,
  adminCheck: checkAdminRole,
};

module.exports = authMiddleware;
