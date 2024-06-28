const UserDto = require("../dtos/UserDto");
const Otp = require("../models/Otp");
const RefreshJwt = require("../models/RefreshJwt");
const ResetPassword = require("../models/ResetPassword");
const User = require("../models/User");
const CustomErrorHandler = require("../services/CustomErrorHandler");
const JwtService = require("../services/JwtService");
const generateOtp = require("../services/generateOtp");
const hashService = require("../services/hashService");
const mailTransport = require("../services/mailTransport");
const randomBytes = require("../services/randomBytes");

const generateVerficationEmail = function (name, otp) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h2 {
              margin-bottom: 20px;
              text-align: center;
          }
          p {
              margin-bottom: 15px;
          }
          .otp {
              padding: 10px 20px;
              background-color: #007bff;
              color: #fff;
              border-radius: 5px;
              display: inline-block;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h2>Email Verification</h2>
          <p>Dear ${name},</p>
          <p>Please use the following OTP to verify your email address:</p>
          <p class="otp"> ${otp} </p>
          <p>If you did not request this OTP, please ignore this email.</p>
          <p>Regards,<br>Your Clothing Website Team</p>
      </div>
  </body>
  </html>`;
};

const generateResetPassEmail = function (name, userId, token) {
  const resetLink = `http://localhost:3000/reset-password?userId=${userId}&token=${token}`;
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h2 {
              margin-bottom: 20px;
              text-align: center;
          }
          p {
              margin-bottom: 15px;
          }
          .otp {
              padding: 10px 20px;
              background-color: #007bff;
              color: #fff;
              border-radius: 5px;
              display: inline-block;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h2>Reset Password</h2>
          <p>Dear ${name}</p>
          <p>Please use the following link to reset your password:</p>
          <p class="otp">
            <a href="${resetLink}" style="color: white; text-decoration: none;">Reset Password</a>
          </p>
          <p>If you did not request this reset link, please ignore this email.</p>
          <p>Regards,<br>Your Clothing Website Team</p>
      </div>
  </body>
  </html>`;
};

const userControllers = {
  //[+] Refister [+]
  async register(req, res, next) {
    const { email, password, fname, lname, mobile } = req.body;

    if (!email || !password || !fname || !lname || !mobile) {
      return next(CustomErrorHandler.missingFields());
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const passwordPattern =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!(){}[\]:;"'<>,.?/~\\-_]).{8,}$/;
    const mobilePattern = /^\d{10}$/;

    if (!emailPattern.test(email)) {
      return next(
        CustomErrorHandler.badRequest("Invalid Email address format")
      );
    }

    if (!passwordPattern.test(password)) {
      return next(
        CustomErrorHandler.badRequest(
          "Password must contain at least 8 characters, including one lowercase letter, one uppercase letter, one number, and one special character"
        )
      );
    }

    if (!mobilePattern.test(mobile)) {
      return next(CustomErrorHandler.badRequest("Invalid Mobile Number"));
    }

    try {
      const alredyEmailExist = await User.findOne({ email });

      if (alredyEmailExist) {
        return next(
          CustomErrorHandler.alreadyExist("This Email is alredy taken")
        );
      }

      const user = await User.create({
        email,
        password,
        mobile,
        fname,
        lname,
      });

      const otp = generateOtp();

      const verfiyOtp = await Otp.create({
        user: user._id,
        token: otp,
      });

      mailTransport.sendMail({
        from: "varification12@gmai.com",
        to: user.email,
        subject: "Email Verification",
        html: generateVerficationEmail(user.fname + " " + user.lname, otp),
      });

      const { accessToken, refreshToken } = JwtService.createToken({
        userId: user._id,
      });

      await RefreshJwt.create({
        user: user._id,
        token: refreshToken,
      });

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        sameSite: "none",
        secure: true,
      });
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        sameSite: "none",
        secure: true,
      });
      const userDto = new UserDto(user);
      res.status(200).json({
        message: "user registered successfully",
        success: true,
        data: {
          user: userDto,
          auth: true,
          status: user.status,
          emailVerified: user.email_verification,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] Login [+]
  async login(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(CustomErrorHandler.missingFields());
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const passwordPattern =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!(){}[\]:;"'<>,.?/~\\-_]).{8,}$/;

    if (!emailPattern.test(email)) {
      return next(
        CustomErrorHandler.badRequest("Invalid Email address format")
      );
    }

    if (!passwordPattern.test(password)) {
      return next(
        CustomErrorHandler.badRequest(
          "Password must contain at least 8 characters, including one lowercase letter, one uppercase letter, one number, and one special character"
        )
      );
    }

    try {
      const userExist = await User.findOne({ email });

      if (!userExist) {
        return next(
          CustomErrorHandler.notFound("There is no user with this email")
        );
      }

      const isMatched = await userExist.comparePassword(password);
      if (!isMatched) {
        return next(CustomErrorHandler.wrongCredentials());
      }

      const { accessToken, refreshToken } = JwtService.createToken({
        userId: userExist._id,
      });

      const refresh = await RefreshJwt.findOne({
        user: userExist._id,
      });

      if (refresh) {
        refresh.token = refreshToken;
        await refresh.save();
      } else {
        await RefreshJwt.create({
          user: userExist._id,
          token: refreshToken,
        });
      }

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        sameSite: "none",
        secure: true,
      });
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        sameSite: "none",
        secure: true,
      });

      const userDto = new UserDto(userExist);
      res.status(200).json({
        message: "user logged in successfully",
        success: true,
        data: {
          user: userDto,
          auth: true,
          status: userExist.status,
          emailVerified: userExist.email_verification,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] Verify Email [+]
  async vefifyEmail(req, res, next) {
    const { otp } = req.body;
    if (!otp) {
      return next(CustomErrorHandler.missingFields());
    }
    try {
      const user = await User.findById(req.__auth.id);
      if (!user) {
        return next(CustomErrorHandler.unAuthorized());
      }

      if (user.email_verification) {
        return next(
          CustomErrorHandler.alreadyExist("Your Email is alredy verified")
        );
      }

      const otpToken = await Otp.findOne({ user: req.__auth.id });
      if (!otpToken) {
        return next(CustomErrorHandler.unAuthorized());
      }

      const isOtpMatched = await otpToken.compareToken(otp);
      if (!isOtpMatched) {
        return next(CustomErrorHandler.invalidToken("Invalid Otp"));
      }

      user.email_verification = true;
      await user.save();

      const userDto = new UserDto(user);
      res.status(200).json({
        message: "Email Verified successfully",
        success: true,
        data: {
          user: userDto,
          auth: true,
          status: user.status,
          emailVerified: user.email_verification,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] send Otp to verify email[+]
  async sendOtpToVerify(req, res, next) {
    try {
      const user = await User.findById(req.__auth.id);
      if (!user) {
        return next(CustomErrorHandler.unAuthorized());
      }
      if (user.email_verification) {
        return next(
          CustomErrorHandler.alreadyExist(
            "Email is already verified, OTP is not required"
          )
        );
      }

      const otp = generateOtp();

      const otpToken = await Otp.findOne({ user: req.__auth.id });

      if (!otpToken) {
        const verfiyOtp = await Otp.create({
          user: user._id,
          token: otp,
        });
      } else {
        otpToken.token = otp;
        await otpToken.save();
      }

      mailTransport.sendMail({
        from: "support1234@dayumstore.in",
        to: user.email,
        subject: "Email Verification",
        html: generateVerficationEmail(user.fname + " " + user.lname, otp),
      });

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] Refresh token [+]
  async refresh(req, res, next) {
    const { refreshToken: refreshTokenFromCookie } = req.cookies;
    try {
      const tokenData = JwtService.verifyRefreshToken(refreshTokenFromCookie);
      const token = await RefreshJwt.findOne({
        user: tokenData.userId,
        token: refreshTokenFromCookie,
      });
      if (!token) {
        return next(CustomErrorHandler.invalidToken());
      }
      // check if valid user
      const user = await User.findById(tokenData.userId);
      if (!user) {
        return next(CustomErrorHandler.unAuthorized());
      }
      // generate new accesstoken and refresh token
      const { refreshToken, accessToken } = JwtService.createToken({
        userId: user._id,
      });

      // update refresh token
      token.token = refreshToken;
      await token.save();

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        sameSite: "none",
        secure: true,
      });
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30, //30 days
        sameSite: "none",
        secure: true,
      });

      const userDto = new UserDto(user);
      res.status(200).json({
        message: "user logged in successfully",
        success: true,
        data: {
          user: userDto,
          auth: true,
          status: user.status,
          emailVerified: user.email_verification,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  //[+] Logout [+]
  async logout(req, res, next) {
    const { refreshToken } = req.cookies;
    try {
      await RefreshJwt.findOneAndDelete({
        user: req.__auth.id,
        token: refreshToken,
      });
      // delete cookies
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      res.status(200).json({
        message: "logged out",
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },

  // [+]  forget password  [+]
  async forgetPassword(req, res, next) {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        return next(CustomErrorHandler.unAuthorized());
      }

      const existToken = await ResetPassword.findOne({ user: user._id });
      // if (existToken) {
      //   return next(
      //     CustomErrorHandler.alreadyExist(
      //       "You have recently updated your password. Please try after 1 minute."
      //     )
      //   );
      // }
      // const token = await randomBytes;
      // await ResetPassword.create({
      //   user: user._id,
      //   token,
      // });

      const token = await randomBytes;
      if (existToken) {
        existToken.token = token;
        existToken.createdAt = new Date();
        await existToken.save();
      } else {
        await ResetPassword.create({
          user: user._id,
          token,
        });
      }

      mailTransport.sendMail({
        from: "support1234@dayumstore.in",
        to: user.email,
        subject: "Reset Password",
        html: generateResetPassEmail(
          user.fname + " " + user.lname,
          user._id,
          token
        ),
      });

      res.status(200).json({
        message:
          "Check your Email, pasword reseting link has been sent to your registerd email.",
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  },

  // [+] resetPassword [+]
  async resetPassword(req, res, next) {
    const { userId, token } = req.params;
    const { password } = req.body;
    if (!userId || !token || !password) {
      return next(CustomErrorHandler.missingFields());
    }

    const passwordPattern =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!(){}[\]:;"'<>,.?/~\\-_]).{8,}$/;

    if (!passwordPattern.test(password)) {
      return next(
        CustomErrorHandler.badRequest(
          "Password must contain at least 8 characters, including one lowercase letter, one uppercase letter, one number, and one special character"
        )
      );
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(CustomErrorHandler.notFound("User not found"));
      }

      const resetToken = await ResetPassword.findOne({
        user: user._id,
      });

      if (!resetToken) {
        return next(CustomErrorHandler.unAuthorized());
      }

      const isMatched = await resetToken.compareToken(token);
      if (!isMatched) {
        return next(CustomErrorHandler.invalidToken());
      }

      user.password = password;
      await user.save();

      await resetToken.delete();

      res.status(200).json({
        message: "🎉 Your password has been successfully reset!",
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userControllers;
