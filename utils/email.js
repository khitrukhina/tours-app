const nodemailer = require('nodemailer');
const { renderFile } = require('pug');
const { htmlToText } = require('html-to-text');
const nodemailerSendgrid = require('nodemailer-sendgrid');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Natours App <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    // create a transporter depending on service we want to use
    //activate in gmail Less secure app option ---- gmail
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey:
            '',
        }),
      );
    }

    // mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: +process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordReset() {
    await this.send(
      'password-reset',
      'Your password reset token (valid for 10 min)',
    );
  }

  async send(template, subject) {
    // pug into html
    const html = renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    // define the email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      text: htmlToText(html),
      subject,
      html,
    };

    await this.createTransport().sendMail(emailOptions, () => {});
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Fam!');
  }
};
