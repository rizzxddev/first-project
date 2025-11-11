<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type');

$dataDir = 'data/';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

function getFilePath($type) {
    global $dataDir;
    return $dataDir . $type . '.json';
}

function loadData($type) {
    $file = getFilePath($type);
    if (!file_exists($file)) {
        return [];
    }
    return json_decode(file_get_contents($file), true) ?: [];
}

function saveData($type, $data) {
    $file = getFilePath($type);
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'saveCode':
            $userId = $input['userId'] ?? 0;
            $langCode = $input['langCode'] ?? '';
            $code = $input['code'] ?? '';
            $filename = $input['filename'] ?? 'untitled';
            
            $projects = loadData('projects');
            $projectId = uniqid();
            
            $projects[] = [
                'id' => $projectId,
                'userId' => $userId,
                'langCode' => $langCode,
                'filename' => $filename,
                'code' => $code,
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ];
            
            saveData('projects', $projects);
            
            echo json_encode(['success' => true, 'projectId' => $projectId]);
            break;
            
        case 'loadProjects':
            $userId = $input['userId'] ?? 0;
            $projects = loadData('projects');
            
            $userProjects = array_filter($projects, function($p) use ($userId) {
                return $p['userId'] == $userId;
            });
            
            echo json_encode(['success' => true, 'projects' => array_values($userProjects)]);
            break;
            
        case 'deleteProject':
            $projectId = $input['projectId'] ?? '';
            $projects = loadData('projects');
            
            $projects = array_filter($projects, function($p) use ($projectId) {
                return $p['id'] !== $projectId;
            });
            
            saveData('projects', array_values($projects));
            
            echo json_encode(['success' => true]);
            break;
            
        case 'sendMessage':
            $fromId = $input['fromId'] ?? 0;
            $toId = $input['toId'] ?? 0;
            $message = $input['message'] ?? '';
            
            $messages = loadData('messages');
            $messageId = uniqid();
            
            $messages[] = [
                'id' => $messageId,
                'fromId' => $fromId,
                'toId' => $toId,
                'message' => $message,
                'timestamp' => date('Y-m-d H:i:s'),
                'read' => false
            ];
            
            saveData('messages', $messages);
            
            echo json_encode(['success' => true, 'messageId' => $messageId]);
            break;
            
        case 'getMessages':
            $userId = $input['userId'] ?? 0;
            $messages = loadData('messages');
            
            $userMessages = array_filter($messages, function($m) use ($userId) {
                return $m['toId'] == $userId || $m['fromId'] == $userId;
            });
            
            echo json_encode(['success' => true, 'messages' => array_values($userMessages)]);
            break;
            
        case 'markAsRead':
            $messageId = $input['messageId'] ?? '';
            $messages = loadData('messages');
            
            foreach ($messages as &$msg) {
                if ($msg['id'] === $messageId) {
                    $msg['read'] = true;
                    break;
                }
            }
            
            saveData('messages', $messages);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'addNotification':
            $userId = $input['userId'] ?? 0;
            $type = $input['type'] ?? 'info';
            $title = $input['title'] ?? '';
            $message = $input['message'] ?? '';
            
            $notifications = loadData('notifications');
            $notificationId = uniqid();
            
            $notifications[] = [
                'id' => $notificationId,
                'userId' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'timestamp' => date('Y-m-d H:i:s'),
                'read' => false
            ];
            
            saveData('notifications', $notifications);
            
            echo json_encode(['success' => true, 'notificationId' => $notificationId]);
            break;
            
        case 'getNotifications':
            $userId = $input['userId'] ?? 0;
            $notifications = loadData('notifications');
            
            $userNotifications = array_filter($notifications, function($n) use ($userId) {
                return $n['userId'] == $userId || $n['userId'] == 'all';
            });
            
            echo json_encode(['success' => true, 'notifications' => array_values($userNotifications)]);
            break;
            
        case 'executeCode':
            $code = $input['code'] ?? '';
            $language = $input['language'] ?? 'javascript';
            
            $output = '';
            $error = '';
            
            switch ($language) {
                case 'php':
                    $tempFile = tempnam(sys_get_temp_dir(), 'php_');
                    file_put_contents($tempFile, "<?php\n" . $code);
                    $output = shell_exec("php $tempFile 2>&1");
                    unlink($tempFile);
                    break;
                    
                case 'python':
                    $tempFile = tempnam(sys_get_temp_dir(), 'py_');
                    file_put_contents($tempFile, $code);
                    $output = shell_exec("python3 $tempFile 2>&1");
                    unlink($tempFile);
                    break;
                    
                case 'nodejs':
                    $tempFile = tempnam(sys_get_temp_dir(), 'js_');
                    file_put_contents($tempFile, $code);
                    $output = shell_exec("node $tempFile 2>&1");
                    unlink($tempFile);
                    break;
                    
                default:
                    $output = 'Language not supported for server-side execution';
            }
            
            echo json_encode([
                'success' => true,
                'output' => $output,
                'error' => $error
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Action tidak valid']);
    }
}
?>
