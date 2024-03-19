const generateOtp = function () {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    const randVal = Math.floor(Math.random() * 10);
    otp = otp + randVal;
  }
  return otp;
};

module.exports = generateOtp;
