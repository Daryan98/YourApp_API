import mongoose from "mongoose";
import passwordHash from "password-hash";
import jwt from "jsonwebtoken";
import uniqueValidator from "mongoose-unique-validator";

// TODO: add uniqueness and email validations to email field
const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      unique: true
    },
    username: {
      type: String,
      required: true,
      index: true,
      unique: true
    },
    passwordHash: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    confirmationToken: { type: String, default: "" }
  },
  { timestamps: true }
);

schema.methods.isValidPassword = function isValidPassword(password) {
  return passwordHash.verify(password, this.passwordHash);
};

schema.methods.setPassword = function setPassword(password) {
  this.passwordHash = passwordHash.generate(password);
};

schema.methods.setConfirmationToken = function setConfirmationToken() {
  this.confirmationToken = this.generateJWT();
};

schema.methods.generateConfirmationUrl = function generateConfirmationUrl() {
  return `${process.env.HOST}/confirmation/${this.confirmationToken}`;
};

schema.methods.generateResetPasswordLink = function generateResetPasswordLink() {
  return `${
    process.env.HOST
  }/reset_password/${this.generateResetPasswordToken()}`;
};

schema.methods.generateJWT = function generateJWT() {
  return jwt.sign(
    {
      email: this.email,
      username: this.username,
      confirmed: this.confirmed
    },
    process.env.JWT_SECRET
  );
};

schema.methods.generateResetPasswordToken = function generateResetPasswordToken() {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

schema.methods.toAuthJSON = function toAuthJSON() {
  return {
    // id: this._id,
    email: this.email,
    confirmed: this.confirmed,
    username: this.username,
    token: this.generateJWT()
  };
};

schema.plugin(uniqueValidator, {
  message: "It is already taken, try another one."
});

export default mongoose.model("User", schema);
