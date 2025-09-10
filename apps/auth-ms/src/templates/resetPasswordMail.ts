export const resetPasswordTemplate = (name: string, email: string, resetLink: string) => {
  const subject = `Reset Your Password 🔐`

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Password Reset Request 🔐</h1>
    </div>

    <!-- Body -->
    <div style="padding: 25px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong> (<em>${email}</em>),</p>

      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        We received a request to reset your password. If this was you, please click the button below to set a new password:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 15px; display: inline-block;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        If you didn’t request a password reset, you can safely ignore this email. Your account will remain secure.
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #333;">
        Best regards,<br>
        <strong>The Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
      © ${new Date().getFullYear()} Our Platform. All rights reserved.
    </div>
  </div>
  `
  return { subject, html }
}
