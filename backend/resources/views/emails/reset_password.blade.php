<!DOCTYPE html>
<html>
<head>
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
        <p style="color: #555555; font-size: 16px;">Hello,</p>
        <p style="color: #555555; font-size: 16px;">We received a request to reset your password. Use the code below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 25px; font-size: 24px; font-weight: bold; background-color: #007bff; color: #ffffff; border-radius: 5px; letter-spacing: 2px;">
                {{ $code }}
            </span>
        </div>

        <p style="color: #555555; font-size: 16px;">This code will expire in 15 minutes.</p>
        <p style="color: #555555; font-size: 16px;">If you did not request a password reset, no further action is required.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <p style="color: #999999; font-size: 12px; text-align: center;">&copy; {{ date('Y') }} Freelancer Portal. All rights reserved.</p>
    </div>
</body>
</html>
