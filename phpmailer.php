<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function sendEmail($to, $subject, $body) {
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: CodePlayground <noreply@codeplayground.com>" . "\r\n";
    
    return mail($to, $subject, $body, $headers);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'sendVerification':
            $email = $input['email'] ?? '';
            $code = $input['code'] ?? '';
            
            $subject = 'Kode Verifikasi CodePlayground';
            $body = "
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 10px; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>CodePlayground</h1>
                            <p>Kode Verifikasi Email</p>
                        </div>
                        <p>Halo,</p>
                        <p>Terima kasih telah mendaftar di CodePlayground. Gunakan kode verifikasi berikut untuk melanjutkan:</p>
                        <div class='code'>{$code}</div>
                        <p>Kode ini berlaku selama 10 menit.</p>
                        <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
                        <div class='footer'>
                            <p>&copy; 2025 CodePlayground. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";
            
            $result = sendEmail($email, $subject, $body);
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Email terkirim' : 'Gagal mengirim email'
            ]);
            break;
            
        case 'sendNotification':
            $email = $input['email'] ?? '';
            $title = $input['title'] ?? '';
            $message = $input['message'] ?? '';
            
            $subject = "Notifikasi: {$title}";
            $body = "
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .message { padding: 20px; background: #f9f9f9; border-left: 4px solid #1a1a1a; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>CodePlayground</h1>
                            <h2>{$title}</h2>
                        </div>
                        <div class='message'>
                            <p>{$message}</p>
                        </div>
                        <div class='footer'>
                            <p>&copy; 2025 CodePlayground. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";
            
            $result = sendEmail($email, $subject, $body);
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Notifikasi terkirim' : 'Gagal mengirim notifikasi'
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Action tidak valid']);
    }
}
?>
