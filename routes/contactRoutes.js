import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later.'
  }
});

// Create reusable transporter object using SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.CONTACT_EMAIL || 'chandan.mishra23456@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Use App Password for Gmail
    }
  });
};

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, department } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const transporter = createTransporter();

    // Email to admin
    const adminMailOptions = {
      from: process.env.CONTACT_EMAIL || 'chandan.mishra23456@gmail.com',
      to: 'chandan.mishra23456@gmail.com',
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6C5B7B; border-bottom: 2px solid #6C5B7B; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Department:</strong> ${department || 'General'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border-left: 4px solid #6C5B7B; margin: 20px 0;">
            <h3 style="color: #6C5B7B; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6;">${message}</p>
          </div>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              <strong>Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </p>
          </div>
        </div>
      `
    };

    // Auto-reply to user
    const userMailOptions = {
      from: process.env.CONTACT_EMAIL || 'chandan.mishra23456@gmail.com',
      to: email,
      subject: 'Thank you for contacting ShopEasy!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6C5B7B 0%, #4E4A59 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">ShopEasy</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for reaching out!</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e9ecef;">
            <p style="font-size: 16px; color: #333;">Hi ${name},</p>
            
            <p style="line-height: 1.6; color: #666;">
              Thank you for contacting us! We have received your message regarding "<strong>${subject}</strong>" 
              and our team will get back to you within 24 hours.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6C5B7B;">
              <h3 style="margin-top: 0; color: #6C5B7B;">Your Message Summary:</h3>
              <p><strong>Department:</strong> ${department || 'General'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p style="margin-bottom: 0;"><strong>Message:</strong> ${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</p>
            </div>
            
            <p style="line-height: 1.6; color: #666;">
              If you have any urgent concerns, you can also reach us directly at:
            </p>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #1976d2;"><strong>📧 Email:</strong> chandan.mishra23456@gmail.com</p>
              <p style="margin: 5px 0; color: #1976d2;"><strong>📞 Phone:</strong> +91 7052022430</p>
              <p style="margin: 5px 0; color: #1976d2;"><strong>📍 Location:</strong> Gandhinagar, Gujarat, India</p>
            </div>
            
            <p style="line-height: 1.6; color: #666;">
              Thank you for choosing ShopEasy. We're here to help make your shopping experience amazing!
            </p>
            
            <p style="color: #666;">
              Best regards,<br>
              <strong style="color: #6C5B7B;">The ShopEasy Team</strong>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; border-top: none;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              This is an automated response. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    // Send emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later or contact us directly.'
    });
  }
});

// @desc    Get contact information
// @route   GET /api/contact/info
// @access  Public
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      email: 'chandan.mishra23456@gmail.com',
      phone: '+91 7052022430',
      address: 'Gandhinagar, Gujarat, India',
      businessHours: {
        weekdays: '9:00 AM - 6:00 PM IST',
        weekends: '10:00 AM - 4:00 PM IST'
      },
      responseTime: '24 hours',
      emergencySupport: '24/7 Support on weekdays'
    }
  });
});

export default router;
