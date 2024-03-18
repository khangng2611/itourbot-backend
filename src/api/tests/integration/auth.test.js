/* eslint-disable arrow-body-style */
import request from 'supertest';
import HttpStatus from 'http-status';
import { expect } from 'chai';
import sinon from 'sinon';
import moment from 'moment-timezone';
import app from '../../../index.js';
import User from '../../models/user.model.js';
import PasswordResetToken from '../../models/passwordResetToken.model.js';
import emailProvider from '../../services/emails/emailProvider.js';

const sandbox = sinon.createSandbox();

// const fakeOAuthRequest = () => Promise.resolve({
//   service: 'facebook',
//   id: '123',
//   name: 'user',
//   email: 'test@test.com',
//   picture: 'test.jpg',
// });

describe('Authentication API', () => {
  let dbUser;
  let user;
  let refreshToken;
  let resetToken;
  let expiredRefreshToken;
  let expiredResetToken;

  beforeEach(async () => {
    dbUser = {
      email: 'branstark@gmail.com',
      password: 'mypassword',
      name: 'Bran Stark',
      role: 'admin',
    };

    user = {
      email: 'sousa.dfs@gmail.com',
      password: '123456',
      name: 'Daniel Sousa',
    };

    refreshToken = {
      token:
        '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
      userId: '5947397b323ae82d8c3a333b',
      userEmail: dbUser.email,
      expires: moment()
        .add(1, 'day')
        .toDate(),
    };

    resetToken = {
      resetToken:
        '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
      userId: '5947397b323ae82d8c3a333b',
      userEmail: dbUser.email,
      expires: moment()
        .add(2, 'hours')
        .toDate(),
    };

    expiredRefreshToken = {
      token:
        '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
      userId: '5947397b323ae82d8c3a333b',
      userEmail: dbUser.email,
      expires: moment()
        .subtract(1, 'day')
        .toDate(),
    };

    expiredResetToken = {
      resetToken:
        '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
      userId: '5947397b323ae82d8c3a333b',
      userEmail: dbUser.email,
      expires: moment()
        .subtract(2, 'hours')
        .toDate(),
    };

    await User.deleteMany({});
    await User.create(dbUser);
    await PasswordResetToken.deleteMany({});
  });

  afterEach(() => sandbox.restore());

  describe('POST /v1/auth/register', () => {
    it('should register a new user when request is ok', () => {
      return request(app)
        .post('/v1/auth/register')
        .send(user)
        .expect(HttpStatus.CREATED)
        .then((res) => {
          delete user.password;
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.include(user);
        });
    });

    it('should report error when email already exists', () => {
      return request(app)
        .post('/v1/auth/register')
        .send(dbUser)
        .expect(HttpStatus.CONFLICT)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" already exists');
        });
    });

    it('should report error when the email provided is not valid', () => {
      user.email = 'this_is_not_an_email';
      return request(app)
        .post('/v1/auth/register')
        .send(user)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" must be a valid email');
        });
    });

    it('should report error when email and password are not provided', () => {
      return request(app)
        .post('/v1/auth/register')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should return an accessToken and a refreshToken when email and password matches', () => {
      return request(app)
        .post('/v1/auth/login')
        .send(dbUser)
        .expect(HttpStatus.OK)
        .then((res) => {
          delete dbUser.password;
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.include(dbUser);
        });
    });

    it('should report error when email and password are not provided', () => {
      return request(app)
        .post('/v1/auth/login')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error when the email provided is not valid', () => {
      user.email = 'this_is_not_an_email';
      return request(app)
        .post('/v1/auth/login')
        .send(user)
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" must be a valid email');
        });
    });

    it("should report error when email and password don't match", () => {
      dbUser.password = 'xxx';
      return request(app)
        .post('/v1/auth/login')
        .send(dbUser)
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          const { code } = res.body;
          const { message } = res.body;
          expect(code).to.be.equal(401);
          expect(message).to.be.equal('Incorrect email or password');
        });
    });
  });

  describe('POST /v1/auth/facebook', () => {
    it('should create a new user and return an accessToken when user does not exist', () => {
      // sandbox.stub(authProviders, 'facebook').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/facebook')
        .send({ access_token: '123' })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return an accessToken when user already exists', async () => {
      dbUser.email = 'test@test.com';
      await User.create(dbUser);
      // sandbox.stub(authProviders, 'facebook').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/facebook')
        .send({ access_token: '123' })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return error when access_token is not provided', async () => {
      return request(app)
        .post('/v1/auth/facebook')
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('access_token');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"access_token" is required');
        });
    });
  });

  describe('POST /v1/auth/google', () => {
    it('should create a new user and return an accessToken when user does not exist', () => {
      // sandbox.stub(authProviders, 'google').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/google')
        .send({ access_token: '123' })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return an accessToken when user already exists', async () => {
      dbUser.email = 'test@test.com';
      await User.create(dbUser);
      // sandbox.stub(authProviders, 'google').callsFake(fakeOAuthRequest);
      return request(app)
        .post('/v1/auth/google')
        .send({ access_token: '123' })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body.token).to.have.a.property('accessToken');
          expect(res.body.token).to.have.a.property('refreshToken');
          expect(res.body.token).to.have.a.property('expiresIn');
          expect(res.body.user).to.be.an('object');
        });
    });

    it('should return error when access_token is not provided', async () => {
      return request(app)
        .post('/v1/auth/google')
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const { field } = res.body.errors[0];
          const { location } = res.body.errors[0];
          const { messages } = res.body.errors[0];
          expect(field).to.be.equal('access_token');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"access_token" is required');
        });
    });
  });

  describe('POST /v1/auth/refresh-token', () => {
    it('should return a new accessToken when refreshToken and email match', async () => {
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({ email: dbUser.email, refreshToken: refreshToken.token })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.a.property('accessToken');
          expect(res.body).to.have.a.property('refreshToken');
          expect(res.body).to.have.a.property('expiresIn');
        });
    });

    it("should report error when email and refreshToken don't match", async () => {
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({ email: user.email, refreshToken: refreshToken.token })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          const { code } = res.body;
          const { message } = res.body;
          expect(code).to.be.equal(401);
          expect(message).to.be.equal('Incorrect email or refreshToken');
        });
    });

    it('should report error when email and refreshToken are not provided', () => {
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const field1 = res.body.errors[0].field;
          const location1 = res.body.errors[0].location;
          const messages1 = res.body.errors[0].messages;
          const field2 = res.body.errors[1].field;
          const location2 = res.body.errors[1].location;
          const messages2 = res.body.errors[1].messages;
          expect(field1).to.be.equal('email');
          expect(location1).to.be.equal('body');
          expect(messages1).to.include('"email" is required');
          expect(field2).to.be.equal('refreshToken');
          expect(location2).to.be.equal('body');
          expect(messages2).to.include('"refreshToken" is required');
        });
    });

    it('should report error when the refreshToken is expired', async () => {
      return request(app)
        .post('/v1/auth/refresh-token')
        .send({ email: dbUser.email, refreshToken: expiredRefreshToken.token })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.code).to.be.equal(401);
          expect(res.body.message).to.be.equal('Invalid refresh token.');
        });
    });
  });
  describe('POST /v1/auth/send-password-reset', () => {
    it('should send an email with password reset link when email matches a user', async () => {
      const PasswordResetTokenObj = await PasswordResetToken.create(resetToken);

      expect(PasswordResetTokenObj.resetToken).to.be.equal('5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d');
      expect(PasswordResetTokenObj.userId.toString()).to.be.equal('5947397b323ae82d8c3a333b');
      expect(PasswordResetTokenObj.userEmail).to.be.equal(dbUser.email);
      expect(PasswordResetTokenObj.expires).to.be.above(moment()
        .add(1, 'hour')
        .toDate());

      sandbox
        .stub(emailProvider, 'sendPasswordReset')
        .callsFake(() => Promise.resolve('email sent'));

      return request(app)
        .post('/v1/auth/send-password-reset')
        .send({ email: dbUser.email })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.equal('success');
        });
    });

    it("should report error when email doesn't match a user", async () => {
      await PasswordResetToken.create(resetToken);
      return request(app)
        .post('/v1/auth/send-password-reset')
        .send({ email: user.email })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          const { code } = res.body;
          const { message } = res.body;
          expect(code).to.be.equal(HttpStatus.UNAUTHORIZED);
          expect(message).to.be.equal('No account found with that email');
        });
    });

    it('should report error when email is not provided', () => {
      return request(app)
        .post('/v1/auth/send-password-reset')
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const field1 = res.body.errors[0].field;
          const location1 = res.body.errors[0].location;
          const messages1 = res.body.errors[0].messages;
          expect(field1).to.be.equal('email');
          expect(location1).to.be.equal('body');
          expect(messages1).to.include('"email" is required');
        });
    });
  });
  describe('POST /v1/auth/reset-password', () => {
    it('should update password and send confirmation email when email and reset token are valid', async () => {
      await PasswordResetToken.create(resetToken);

      sandbox
        .stub(emailProvider, 'sendPasswordChangeEmail')
        .callsFake(() => Promise.resolve('email sent'));

      return request(app)
        .post('/v1/auth/reset-password')
        .send({
          email: dbUser.email,
          password: 'updatedPassword2',
          resetToken: resetToken.resetToken,
        })
        .expect(HttpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.equal('Password Updated');
        });
    });
    it("should report error when email and reset token doesn't match a user", async () => {
      await PasswordResetToken.create(resetToken);
      return request(app)
        .post('/v1/auth/reset-password')
        .send({
          email: user.email,
          password: 'updatedPassword',
          resetToken: resetToken.resetToken,
        })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          const { code } = res.body;
          const { message } = res.body;
          expect(code).to.be.equal(401);
          expect(message).to.be.equal('Cannot find matching reset token');
        });
    });

    it('should report error when email is not provided', () => {
      return request(app)
        .post('/v1/auth/reset-password')
        .send({ password: 'updatedPassword', resetToken: resetToken.resetToken })
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const field1 = res.body.errors[0].field;
          const location1 = res.body.errors[0].location;
          const messages1 = res.body.errors[0].messages;
          expect(field1).to.be.equal('email');
          expect(location1).to.be.equal('body');
          expect(messages1).to.include('"email" is required');
        });
    });
    it('should report error when reset token is not provided', () => {
      return request(app)
        .post('/v1/auth/reset-password')
        .send({ email: dbUser.email, password: 'updatedPassword' })
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const field1 = res.body.errors[0].field;
          const location1 = res.body.errors[0].location;
          const messages1 = res.body.errors[0].messages;
          expect(field1).to.be.equal('resetToken');
          expect(location1).to.be.equal('body');
          expect(messages1).to.include('"resetToken" is required');
        });
    });
    it('should report error when password is not provided', () => {
      return request(app)
        .post('/v1/auth/reset-password')
        .send({ email: dbUser.email, resetToken: resetToken.resetToken })
        .expect(HttpStatus.BAD_REQUEST)
        .then((res) => {
          const field1 = res.body.errors[0].field;
          const location1 = res.body.errors[0].location;
          const messages1 = res.body.errors[0].messages;
          expect(field1).to.be.equal('password');
          expect(location1).to.be.equal('body');
          expect(messages1).to.include('"password" is required');
        });
    });

    it('should report error when the resetToken is expired', async () => {
      const expiredPasswordResetTokenObj = await PasswordResetToken.create(expiredResetToken);

      expect(expiredPasswordResetTokenObj.resetToken).to.be.equal('5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d');
      expect(expiredPasswordResetTokenObj.userId.toString()).to.be.equal('5947397b323ae82d8c3a333b');
      expect(expiredPasswordResetTokenObj.userEmail).to.be.equal(dbUser.email);
      expect(expiredPasswordResetTokenObj.expires).to.be.below(moment().toDate());

      return request(app)
        .post('/v1/auth/reset-password')
        .send({
          email: dbUser.email,
          password: 'updated password',
          resetToken: expiredResetToken.resetToken,
        })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.code).to.be.equal(401);
          expect(res.body.message).to.include('Reset token is expired');
        });
    });
  });
});
