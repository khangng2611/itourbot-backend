import HttpStatus from 'http-status';
import moment from 'moment-timezone';
import _ from 'lodash';
import crypto from 'crypto';
import User from '../models/user.model.js';
// import PasswordResetToken from '../models/passwordResetToken.model.js';
import config from '../../config/config.js';
import APIError from '../errors/api-error.js';
import * as redis from '../../config/redis.js';
// import * as emailProvider from '../services/emails/emailProvider.js';
import { sendResetPasswordEmail, sendConfirmChangePassword } from '../services/emails/sendEmail.js';

/**
 * Generate refresh token
*/
async function generateRefreshToken(user) {
  const userId = user._id;
  const userEmail = user.email;
  const keyName = redis.getRefreshTokenKey(userEmail);
  const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
  redis.client.setEx(keyName, config.refreshExpirationDays * 86400, token);
  return token;
}

/**
 * Returns a formated object with tokens
 * @private
 */
async function generateTokenResponse(accessToken, refreshToken) {
  const tokenType = 'Bearer';
  const expiresIn = moment().add(config.jwtExpirationMinutes, 'minutes');
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
export const register = async (req, res, next) => {
  try {
    const userData = _.omit(req.body, 'role');
    const user = await new User(userData).save();
    const userTransformed = user.transform();
    const refreshToken = await generateRefreshToken(user);
    const token = await generateTokenResponse(user.token(), refreshToken);
    res.status(HttpStatus.CREATED);
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(User.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
export const login = async (req, res, next) => {
  try {
    const { user, accessToken } = await User.findAndGenerateToken(req.body);
    const refreshToken = await generateRefreshToken(user);
    const token = await generateTokenResponse(accessToken, refreshToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
export const refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    const keyName = redis.getRefreshTokenKey(email);
    const token = await redis.client.get(keyName);
    const err = {
      status: HttpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (!token) {
      err.message = 'Incorrect email or refresh token.';
      throw new APIError(err);
    }
    if (refreshToken !== token) {
      err.message = 'Refresh token is expired';
      throw new APIError(err);
    }
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshToken });
    const newRefreshToken = await generateRefreshToken(user);
    const response = await generateTokenResponse(accessToken, newRefreshToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Generate refresh token
*/
async function generatePasswordResetCode(email) {
  const keyName = redis.getResetPasswordKey(email);
  const passCode = `${crypto.randomInt(999999).toString().padStart(6, '0')}`;

  // const hashedCode = await bcrypt.hash(passCode, 10);
  redis.client.setEx(keyName, 3600, passCode); // expires in 1 hour
  return passCode;
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).exec();

    if (user) {
      // const passwordResetObj = await PasswordResetToken.generate(user);
      // emailProvider.sendPasswordReset(passwordResetObj);
      const resetCode = await generatePasswordResetCode(email);
      sendResetPasswordEmail(email, resetCode);
      res.status(HttpStatus.OK);
      return res.json({ success: true });
    }
    throw new APIError({
      status: HttpStatus.UNAUTHORIZED,
      message: 'No account found with that email',
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyResetPasswordCode = async (req, res, next) => {
  try {
    const { email, passcode } = req.body;
    const keyName = redis.getResetPasswordKey(email);
    const code = await redis.client.get(keyName);
    if (code === passcode) {
      res.status(HttpStatus.OK);
      return res.json({ success: true });
    }
    throw new APIError({
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid code',
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, password, passcode } = req.body;
    // const resetTokenObject = await PasswordResetToken.findOneAndRemove({
    //   userEmail: email,
    //   resetToken,
    // });
    const keyName = redis.getResetPasswordKey(email);
    const code = await redis.client.get(keyName);
    const err = {
      status: HttpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (!code) {
      err.message = 'Passcode is invalid';
      throw new APIError(err);
    }
    // if (moment().isAfter(resetTokenObject.expires)) {
    //   err.message = 'Reset token is expired';
    //   throw new APIError(err);
    // }
    if (code !== passcode) {
      err.message = 'Passcode is incorrect';
      throw new APIError(err);
    }
    redis.client.del(keyName);
    const user = await User.findOne({ email }).exec();
    user.password = password;
    await user.save();
    // emailProvider.sendPasswordChangeEmail(user);
    sendConfirmChangePassword(email);
    res.status(HttpStatus.OK);
    return res.json({ success: true, msg: 'Password Updated' });
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
export const oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const accessToken = user.token();
    const refreshToken = await generateRefreshToken(user);
    const tokenResponse = await generateTokenResponse(accessToken, refreshToken);
    const userTransformed = user.transform();
    return res.json({ tokenResponse, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};
