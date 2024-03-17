import HttpStatus from 'http-status';
import passport from 'passport';
import User from '../models/user.model.js';
import APIError from '../errors/api-error.js';

export const ADMIN = 'admin';
export const LOGGED_USER = '_loggedUser';

const handleJWT = (req, res, next, roles) => async (err, user, info) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);
  const apiError = new APIError({
    message: error ? error.message : 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
    stack: error ? error.stack : undefined,
  });

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (e) {
    return next(apiError);
  }

  if (roles === LOGGED_USER) {
    if (user.role !== 'admin' && req.params.userId !== user._id.toString()) {
      apiError.status = HttpStatus.FORBIDDEN;
      apiError.message = 'Forbidden';
      return next(apiError);
    }
  } else if (!roles.includes(user.role)) {
    apiError.status = HttpStatus.FORBIDDEN;
    apiError.message = 'Forbidden';
    return next(apiError);
  } else if (err || !user) {
    return next(apiError);
  }

  req.user = user;

  return next();
};

export const authorize = (roles = User.roles) => (req, res, next) => passport.authenticate(
  'jwt',
  { session: false },
  handleJWT(req, res, next, roles),
)(req, res, next);

export const oAuth = (service) => passport.authenticate(
  service,
  service === 'google' ? { scope: ['profile', 'email'], session: false } : { scope: ['email'], session: false },
);
export const oAuthCallback = (service) => passport.authenticate(
  service,
  {
    failureRedirect: `/v1/auth/${service}`,
    session: false,
  },
);
