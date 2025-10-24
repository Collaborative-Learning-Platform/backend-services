export const welcomeTemplate = (name: string, email: string, tempPassword: string) => {
  const subject = `Welcome to Our Platform 🎉`

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Welcome to Our Platform 🎉</h1>
    </div>

    <!-- Body -->
    <div style="padding: 25px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>

      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        We’re thrilled to have you on board! Your account has been successfully created. Below are your login details:
      </p>

      <div style="background-color: #f8f9fa; border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #333;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>

      <p style="font-size: 14px; color: #d9534f; font-weight: bold;">
        ⚠️ For security, please update your password after your first login.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://learniedu.vercel.app/login" 
           style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 15px; display: inline-block;">
          Go to Login
        </a>
      </div>

      <p style="font-size: 14px; color: #777; line-height: 1.6;">
        If you have any questions or need assistance, feel free to reach out to our support team.
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
