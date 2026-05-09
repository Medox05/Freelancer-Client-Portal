<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation</title>
</head>
<body style="font-family: Arial; background:#f5f5f5; padding:40px;">

<div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
    
    <h2>Hello {{ $user->name }}</h2>

    <p>You have been invited to join the platform.</p>

    <p>
        Click here to create your account:
    </p>

    <a href="{{ $url }}"
       style="display:inline-block; padding:12px 20px; background:#111827; color:white; text-decoration:none; border-radius:8px;">
        Create Password
    </a>

    <p style="margin-top:20px;">
        Or copy this link:
    </p>

    <p>{{ $url }}</p>

    <p>This link expires in 2 days.</p>

</div>

</body>
</html>