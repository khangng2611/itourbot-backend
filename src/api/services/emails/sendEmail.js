import nodemailer from 'nodemailer';
import config from '../../../config/config.js';

const { emailConfig } = config;

const transporter = nodemailer.createTransport({
  port: emailConfig.port,
  host: emailConfig.host,
  auth: {
    user: emailConfig.username,
    pass: emailConfig.password,
  },
  secure: true,
});

// verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.log('error with email connection', error);
    throw new Error(error.message);
  }
});

export async function sendResetPasswordEmail(email, resetCode) {
  try {
    const info = await transporter.sendMail({
      from: `"iTourbot 👻" <${emailConfig.username}>`,
      to: email,
      subject: 'Reset Password',
      // text: passwordResetObj.resetToken, // plain text body
      html: `<b>${resetCode}</b>`,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function sendConfirmChangePassword(email) {
  try {
    const info = await transporter.sendMail({
      from: `"iTourbot 👻" <${emailConfig.username}>`,
      to: email,
      subject: 'Reset Password',
      // text: passwordResetObj.resetToken, // plain text body
      html: 'Your password has been changed successfully !',
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}
