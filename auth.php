<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$usersFile = 'users.json';

function loadUsers() {
    global $usersFile;
    if (!file_exists($usersFile)) {
        $defaultUsers = [
            [
                'id' => 1,
                'name' => '#admin',
                'email' => 'admin@codeplayground.com',
                'password' => password_hash('#admin1234', PASSWORD_BCRYPT),
                'role' => 'admin',
                'friends' => [],
                'saves' => 0,
                'registeredAt' => date('Y-m-d H:i:s'),
                'lastLogin' => date('Y-m-d H:i:s'),
                'verified' => true
            ]
        ];
        file_put_contents($usersFile, json_encode($defaultUsers, JSON_PRETTY_PRINT));
        return $defaultUsers;
    }
    return json_decode(file_get_contents($usersFile), true);
}

function saveUsers($users) {
    global $usersFile;
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
}

function encryptData($data) {
    $key = 'codeplayground_secret_key_2025';
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', $key, 0, $iv);
    return base64_encode($encrypted . '::' . $iv);
}

function decryptData($data) {
    $key = 'codeplayground_secret_key_2025';
    list($encrypted, $iv) = explode('::', base64_decode($data), 2);
    return openssl_decrypt($encrypted, 'aes-256-cbc', $key, 0, $iv);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'register':
            $users = loadUsers();
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $name = $input['name'] ?? '';
            
            foreach ($users as $user) {
                if ($user['email'] === $email) {
                    echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar']);
                    exit;
                }
            }
            
            $newId = count($users) + 1;
            $newUser = [
                'id' => $newId,
                'name' => $name,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_BCRYPT),
                'role' => 'user',
                'friends' => [],
                'saves' => 0,
                'registeredAt' => date('Y-m-d H:i:s'),
                'lastLogin' => date('Y-m-d H:i:s'),
                'verified' => false
            ];
            
            $users[] = $newUser;
            saveUsers($users);
            
            unset($newUser['password']);
            echo json_encode([
                'success' => true,
                'user' => $newUser,
                'message' => 'Registrasi berhasil'
            ]);
            break;
            
        case 'login':
            $users = loadUsers();
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            
            foreach ($users as &$user) {
                if ($user['email'] === $email) {
                    if (password_verify($password, $user['password'])) {
                        $user['lastLogin'] = date('Y-m-d H:i:s');
                        saveUsers($users);
                        
                        $userData = $user;
                        unset($userData['password']);
                        
                        echo json_encode([
                            'success' => true,
                            'user' => $userData,
                            'requireVerification' => !$user['verified'],
                            'message' => 'Login berhasil'
                        ]);
                        exit;
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Password salah']);
                        exit;
                    }
                }
            }
            
            echo json_encode(['success' => false, 'message' => 'Email tidak ditemukan']);
            break;
            
        case 'getUser':
            $users = loadUsers();
            $userId = $input['userId'] ?? 0;
            
            foreach ($users as $user) {
                if ($user['id'] == $userId) {
                    unset($user['password']);
                    echo json_encode(['success' => true, 'user' => $user]);
                    exit;
                }
            }
            
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            break;
            
        case 'updateUser':
            $users = loadUsers();
            $userId = $input['userId'] ?? 0;
            $updates = $input['updates'] ?? [];
            
            foreach ($users as &$user) {
                if ($user['id'] == $userId) {
                    foreach ($updates as $key => $value) {
                        if ($key !== 'id' && $key !== 'password') {
                            $user[$key] = $value;
                        }
                    }
                    saveUsers($users);
                    unset($user['password']);
                    echo json_encode(['success' => true, 'user' => $user]);
                    exit;
                }
            }
            
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            break;
            
        case 'addFriend':
            $users = loadUsers();
            $userId = $input['userId'] ?? 0;
            $friendId = $input['friendId'] ?? 0;
            
            foreach ($users as &$user) {
                if ($user['id'] == $userId) {
                    if (!in_array($friendId, $user['friends'])) {
                        $user['friends'][] = $friendId;
                        saveUsers($users);
                        echo json_encode(['success' => true, 'message' => 'Teman berhasil ditambahkan']);
                        exit;
                    }
                }
            }
            
            echo json_encode(['success' => false, 'message' => 'Gagal menambahkan teman']);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Action tidak valid']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'getAllUsers') {
        $users = loadUsers();
        $publicUsers = array_map(function($user) {
            unset($user['password']);
            return $user;
        }, $users);
        echo json_encode(['success' => true, 'users' => $publicUsers]);
    }
}
?>
