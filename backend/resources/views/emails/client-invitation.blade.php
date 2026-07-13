<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation to ClientFlow</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0; color: #1f2937; -webkit-font-smoothing: antialiased;">

<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
        <td align="center" style="padding: 40px 20px;">
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <tr>
                    <td align="center" style="background-color: #111827; padding: 35px 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">ClientFlow</h1>
                    </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                    <td style="padding: 45px 35px;">
                        <h2 style="color: #111827; font-size: 22px; margin-top: 0; margin-bottom: 25px; font-weight: 600;">Hello {{ $user->name }},</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-top: 0; margin-bottom: 25px;">
                            You have been exclusively invited to join <strong>ClientFlow</strong>. We are thrilled to welcome you to our platform where we manage our projects seamlessly.
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-top: 0; margin-bottom: 35px;">
                            To get started and access your dedicated workspace, please set up your account by creating a secure password.
                        </p>
                        
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center">
                                    <a href="{{ $url }}" style="display: inline-block; padding: 16px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">Create Your Password</a>
                                </td>
                            </tr>
                        </table>
                        
                        <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 40px; margin-bottom: 0;">
                            Please note that this invitation link is valid for <strong>2 days</strong>. For security reasons, do not share this link with anyone.
                        </p>
                        
                        <div style="font-size: 14px; color: #6b7280; margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb; word-break: break-all; line-height: 1.5;">
                            If you're having trouble clicking the button, copy and paste the URL below into your web browser:<br><br>
                            <a href="{{ $url }}" style="color: #4f46e5; text-decoration: underline;">{{ $url }}</a>
                        </div>
                    </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                    <td align="center" style="background-color: #f9fafb; padding: 25px 35px; border-top: 1px solid #f3f4f6;">
                        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                            &copy; {{ date('Y') }} ClientFlow. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>