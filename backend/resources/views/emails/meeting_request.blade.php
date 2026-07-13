<!DOCTYPE html>
<html>
<head>
    <title>New Meeting Request</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333333; text-align: center;">New Meeting Request</h2>
        <p style="color: #555555; font-size: 16px;">Hello,</p>
        <p style="color: #555555; font-size: 16px;"><strong>{{ $requesterName }}</strong> has requested a meeting with you.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Title:</strong> {{ $meetingTitle }}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{ $meetingDate }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $actionUrl }}" style="display: inline-block; padding: 12px 25px; font-size: 16px; font-weight: bold; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 5px;">
                View Request in Portal
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <p style="color: #999999; font-size: 12px; text-align: center;">&copy; {{ date('Y') }} MhFlow Portal. All rights reserved.</p>
    </div>
</body>
</html>
