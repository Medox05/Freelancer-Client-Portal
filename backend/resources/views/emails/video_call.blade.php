<!DOCTYPE html>
<html>
<head>
    <title>Missed Video Call</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333333; text-align: center;">You missed a video call!</h2>
        <p style="color: #555555; font-size: 16px;">Hello,</p>
        <p style="color: #555555; font-size: 16px;"><strong>{{ $callerName }}</strong> tried to start a video call with you while you were offline.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $callUrl }}" style="display: inline-block; padding: 12px 25px; font-size: 16px; font-weight: bold; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 5px;">
                Open App
            </a>
        </div>

        <p style="color: #555555; font-size: 16px;">Please log in to your account to return the call or send them a message.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <p style="color: #999999; font-size: 12px; text-align: center;">&copy; {{ date('Y') }} Freelancer Portal. All rights reserved.</p>
    </div>
</body>
</html>
