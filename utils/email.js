const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

// new Email(user, url).sendWelcome()

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Akshat Jain <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return process.env.NODE_ENV !== 'production'
      ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
        // Activate in gmail "less-secure app" option to use gmail for sending emails.
        // You can only send 500 emails using gmail and chances of being marked as a spammer are high
        // So it is recommended to use some other services like SendGrid and Mailgun
        // Currently we will use Mailtrap, its a service that fakes sending email and the mail will end up in a development inbox
      })
      : nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        }
      });
  }

  //Send the actual email from this function
  async send(template, subject) {
    // 1) Render HTML based on pug template
    const emailHTML = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // 2) Define email options for sending email
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: emailHTML,
      text: htmlToText(emailHTML),
    };

    // 3) Create transport and send email

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to NATOURS family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)')
  }
};
