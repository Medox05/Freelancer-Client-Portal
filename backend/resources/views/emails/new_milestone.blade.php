<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: 800; color: #0f172a; text-decoration: none; }
        .title { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 15px; }
        .milestone-box { background-color: #f1f5f9; padding: 15px 20px; border-radius: 8px; margin: 20px 0; font-weight: 600; color: #10b981; text-align: center; border-left: 4px solid #10b981; }
        .btn { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="{{ url('/') }}" class="logo">MhFlow</a>
        </div>
        <div class="title">New Milestone Created</div>
        <p>Hi there,</p>
        <p><strong>{{ $creatorName }}</strong> has created a new milestone in the project <strong>{{ $projectName }}</strong>.</p>
        
        <div class="milestone-box">
            🎯 {{ $milestoneTitle }}
        </div>
        
        <div style="text-align: center;">
            <a href="{{ $projectUrl }}" class="btn">View Milestone</a>
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you are a participant in this MhFlow project.</p>
        </div>
    </div>
</body>
</html>
