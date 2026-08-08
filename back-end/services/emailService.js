const { Resend } = require('resend');

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendOtpEmail(toEmail, username, plainOtp) {
  if (!resendClient) {
    console.log(`\n🔑 [DEV MODE - NO RESEND_API_KEY] Verification OTP for ${toEmail} (${username}): ${plainOtp}\n`);
    return;
  }
  try {
    await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Velora Chat <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Your Velora Chat Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #171918; color: #f4f1eb; border-radius: 14px; max-width: 480px; margin: 0 auto; border: 1px solid #383b35;">
          <h2 style="color: #d9b77b; font-family: Georgia, serif; margin-top: 0;">Velora Chat</h2>
          <p style="color: #cac7bf; font-size: 15px;">Hello <strong>${username}</strong>,</p>
          <p style="color: #afb3aa; font-size: 14px;">Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d9b77b; margin: 20px 0; padding: 14px 24px; background: #282b27; display: inline-block; border-radius: 10px; border: 1px solid #43463e;">
            ${plainOtp}
          </div>
          <p style="color: #8f938a; font-size: 12px; margin-bottom: 0;">This code expires in 10 minutes. If you did not request this email, please ignore it.</p>
        </div>
      `
    });
    console.log(`\n✉️ [Resend] Verification OTP successfully sent to ${toEmail}\n`);
  } catch (err) {
    console.error('❌ Resend Email Error:', err.message);
    console.log(`🔑 [FALLBACK DEV CODE] OTP for ${toEmail}: ${plainOtp}`);
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  sendOtpEmail,
  generateOtp
};
