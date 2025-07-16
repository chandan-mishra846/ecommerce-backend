import nodeMailer from 'nodemailer';

export const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({ // ✅ Fixed typo: transpoter → transporter
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.SMTP_MAIL, // ✅ Set from address
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(mailOptions); // ✅ Fixed typo: transpoter → transporter
};
