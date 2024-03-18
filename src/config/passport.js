import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import config from './config.js';
import User from '../api/models/user.model.js';

const jwtConfigs = {
  secretOrKey: config.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

const googleConfigs = {
  ...config.googleConfig,
  callbackURL: `${config.baseURL}/v1/auth/google/callback`,
};

const facebookConfigs = {
  ...config.facebookConfig,
  callbackURL: `${config.baseURL}/v1/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails'], // Optional: Specify desired profile fields
};

const JWT = async (payload, done) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

const oAuthGoogle = async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile) {
      done(new Error('Failed to retrieve user profile'));
    }
    const userData = {
      service: 'google',
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
    };
    const user = await User.oAuthLogin(userData);
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
};

const oAuthFacebook = async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile) {
      done(new Error('Failed to retrieve user profile'));
    }
    console.log(profile);
    const userData = {
      service: 'facebook',
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
    };
    const user = await User.oAuthLogin(userData);
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
};

export const jwt = new JwtStrategy(jwtConfigs, JWT);
export const google = new GoogleStrategy(googleConfigs, oAuthGoogle);
export const facebook = new FacebookStrategy(facebookConfigs, oAuthFacebook);
