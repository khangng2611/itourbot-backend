import Joi from 'joi';

const authValidation = {
  // POST /v1/auth/register
  register: {
    body: {
      name: Joi.string()
        .required(),
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .min(6)
        .max(128),
    },
  },

  // POST /v1/auth/login
  login: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .max(128),
    },
  },

  // POST /v1/auth/refresh
  refresh: {
    body: {
      email: Joi.string().email().required(),
      refreshToken: Joi.string().required(),
    },
  },

  // POST /v1/auth/refresh
  verfiyPasscode: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      passcode: Joi.string().required().length(6),
    },
  },

  // POST /v1/auth/refresh
  sendPasswordReset: {
    body: {
      email: Joi.string()
        .email()
        .required(),
    },
  },

  // POST /v1/auth/password-reset
  passwordReset: {
    body: {
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .min(6)
        .max(128),
      passcode: Joi.string().required(),
    },
  },
};

export default authValidation;
