class UserDto {
  id;
  email;
  status;
  fname;
  lname;
  mobile;
  email_verification;
  profile_picture;
  coupon_used;
  savedAddress;

  constructor(user) {
    this.id = user._id;
    this.email = user.email;
    this.status = user.status;
    this.fname = user.fname;
    this.lname = user.lname;
    this.mobile = user.mobile;
    this.email_verification = user.email_verification;
    this.profile_picture = user.profile_picture ? user.profile_picture : null;
    this.coupon_used =
      user.coupon_used && user.coupon_used.length > 0 ? user.coupon_used : [];
    this.savedAddress =
      user.savedAddress && user.savedAddress.length > 0
        ? user.savedAddress
        : [];
  }
}

module.exports = UserDto;
