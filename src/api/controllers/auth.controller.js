import HttpStatus from 'http-status';
import moment from 'moment-timezone';
import _ from 'lodash';
import crypto from 'crypto';
import User from '../models/user.model.js';
import PasswordResetToken from '../models/passwordResetToken.model.js';
import config from '../../config/config.js';
import APIError from '../errors/api-error.js';
import { redisClient } from '../../config/redis.js';
// import * as emailProvider from '../services/emails/emailProvider.js';

/**
 * Generate refresh token
*/
async function generateRefreshToken(user) {
  const userId = user._id;
  const userEmail = user.email;
  const keyName = `auth:${userEmail}:refresh_token`;
  const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
  await redisClient.setEx(keyName, config.refreshExpirationDays * 86400, token);
  return token;
}

/**
 * Returns a formated object with tokens
 * @private
 */
async function generateTokenResponse(accessToken, refreshToken) {
  const tokenType = 'Bearer';
  const expiresIn = moment().add(config.jwtExpirationInterval, 'minutes');
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
    const keyName = `auth:${email}:refresh_token`;
    const token = await redisClient.get(keyName);
    const err = {
      status: HttpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (!token) {
      err.message = 'Incorrect email or refresh token.';
      throw new APIError(err);
    }
    console.log('Refresh token:', refreshToken);
    console.log('Token:', token);
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

export const sendPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).exec();

    if (user) {
      // const passwordResetObj = await PasswordResetToken.generate(user);
      // emailProvider.sendPasswordReset(passwordResetObj);
      res.status(HttpStatus.OK);
      return res.json('success');
    }
    throw new APIError({
      status: HttpStatus.UNAUTHORIZED,
      message: 'No account found with that email',
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, password, resetToken } = req.body;
    const resetTokenObject = await PasswordResetToken.findOneAndRemove({
      userEmail: email,
      resetToken,
    });

    const err = {
      status: HttpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (!resetTokenObject) {
      err.message = 'Cannot find matching reset token';
      throw new APIError(err);
    }
    if (moment().isAfter(resetTokenObject.expires)) {
      err.message = 'Reset token is expired';
      throw new APIError(err);
    }

    const user = await User.findOne({ email: resetTokenObject.userEmail }).exec();
    user.password = password;
    await user.save();
    // emailProvider.sendPasswordChangeEmail(user);

    res.status(HttpStatus.OK);
    return res.json('Password Updated');
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
