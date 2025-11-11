let currentUserId = null;
let currentLangCode = null;
let editor = null;
let files = {};
let currentFile = 'main';

const langNames = {
    '101': 'HTML & CSS',
    '102': 'JavaScript',
    '103': 'TypeScript',
    '104': 'Python',
    '105': 'PHP',
    '106': 'Node.js'
};

const langModes = {
    '101': 'htmlmixed',
    '102': 'javascript',
    '103': 'javascript',
    '104': 'python',
    '105': 'php',
    '106': 'javascript'
};

const defaultCode = {
    '101': '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            padding: 20px;\n        }\n    </style>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>Start coding here...</p>\n</body>\n</html>',
    '102': 'console.log("Hello World!");\n\n// Your JavaScript code here',
    '103': 'const message: string = "Hello World!";\nconsole.log(message);\n\n// Your TypeScript code here',
    '104': 'print("Hello World!")\n\n# Your Python code here',
    '105': '<?php\necho "Hello World!";\n\n// Your PHP code here\n?>',
    '106': 'console.log("Hello World!");\n\n// Your Node.js code here'
};

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initConsole();
});

function checkAuth() {
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    currentUserId = userData.id;
}

function initConsole() {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('users.id');
    
    if (!userIdParam) {
        return;
    }
    
    const parts = userIdParam.split('.');
    if (parts.length === 2) {
        currentLangCode = parts[1];
        selectLanguage(currentLangCode);
    }
}

function selectLanguage(langCode) {
    currentLangCode = langCode;
    
    document.getElementById('languageSelector').style.display = 'none';
    document.getElementById('consoleWorkspace').style.display = 'flex';
    
    document.getElementById('currentLang').textContent = langNames[langCode];
    
    files[currentFile] = defaultCode[langCode] || '';
    
    initEditor();
    
    if (langCode === '104' || langCode === '106') {
        document.getElementById('consoleTerminal').style.display = 'flex';
    }
    
    window.history.replaceState({}, '', `console.html?users.id=${currentUserId}.${langCode}`);
}

function initEditor() {
    const textarea = document.getElementById('codeEditor');
    
    editor = CodeMirror.fromTextArea(textarea, {
        mode: langModes[currentLangCode],
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true
    });
    
    editor.setValue(files[currentFile] || '');
    
    editor.on('change', function() {
        files[currentFile] = editor.getValue();
    });
}

function runCode() {
    const code = editor.getValue();
    
    if (currentLangCode === '101') {
        runHTML(code);
    } else if (currentLangCode === '102' || currentLangCode === '103') {
        runJavaScript(code);
    } else if (currentLangCode === '104') {
        runPython(code);
    } else if (currentLangCode === '105') {
        runPHP(code);
    } else if (currentLangCode === '106') {
        runNodeJS(code);
    }
}

function runHTML(code) {
    const outputFrame = document.getElementById('outputFrame');
    const doc = outputFrame.contentDocument || outputFrame.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
}

function runJavaScript(code) {
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '';
    
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
        consoleOutput.innerHTML += `<div style="color: #d4d4d4;">${args.join(' ')}</div>`;
        originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
        consoleOutput.innerHTML += `<div style="color: #ef4444;">${args.join(' ')}</div>`;
        originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
        consoleOutput.innerHTML += `<div style="color: #f59e0b;">${args.join(' ')}</div>`;
        originalWarn.apply(console, args);
    };
    
    try {
        eval(code);
    } catch (error) {
        consoleOutput.innerHTML += `<div style="color: #ef4444;">Error: ${error.message}</div>`;
    }
    
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
}

async function runPython(code) {
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '<div style="color: #f59e0b;">Executing Python code...</div>';
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'executeCode',
                code: code,
                language: 'python'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            consoleOutput.innerHTML = `<div style="color: #10b981;">${data.output || 'No output'}</div>`;
        } else {
            consoleOutput.innerHTML = `<div style="color: #ef4444;">Error: ${data.error}</div>`;
        }
    } catch (error) {
        consoleOutput.innerHTML = `<div style="color: #ef4444;">Error: ${error.message}</div>`;
    }
}

async function runPHP(code) {
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '<div style="color: #f59e0b;">Executing PHP code...</div>';
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'executeCode',
                code: code,
                language: 'php'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            consoleOutput.innerHTML = `<div style="color: #10b981;">${data.output || 'No output'}</div>`;
        } else {
            consoleOutput.innerHTML = `<div style="color: #ef4444;">Error: ${data.error}</div>`;
        }
    } catch (error) {
        consoleOutput.innerHTML = `<div style="color: #ef4444;">Error: ${error.message}</div>`;
    }
}

async function runNodeJS(code) {
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = '<div style="color: #f59e0b;">Executing Node.js code...</div>';
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'executeCode',
                code: code,
                language: 'nodejs'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            consoleOutput.innerHTML = `<div style="color: #10b981;">${data.output || 'No output'}</div>`;
        } else {
            consoleOutput.innerHTML = `<div style="color: #ef4444;">Error: ${data.error}</div>`;
        }
    } catch (error) {
        consoleOutput.innerHTML = `<div style="color: #ef4444;">Error: ${error.message}</div>`;
    }
}

async function saveCode() {
    const code = editor.getValue();
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveCode',
                userId: currentUserId,
                langCode: currentLangCode,
                code: code,
                filename: currentFile
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Code saved successfully!', 'success');
        } else {
            showNotification('Failed to save code', 'error');
        }
    } catch (error) {
        showNotification('Error saving code', 'error');
    }
}

function clearCode() {
    if (confirm('Are you sure you want to clear the code?')) {
        editor.setValue('');
        clearOutput();
    }
}

function clearOutput() {
    document.getElementById('consoleOutput').innerHTML = '';
    const outputFrame = document.getElementById('outputFrame');
    const doc = outputFrame.contentDocument || outputFrame.contentWindow.document;
    doc.open();
    doc.write('');
    doc.close();
}

function changeLanguage() {
    if (confirm('Change language? Your current code will be lost.')) {
        window.location.href = `console.html?users.id=${currentUserId}`;
    }
}

function createNewFile() {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Create New File';
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="newFileName" placeholder="Enter file name" 
               style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); 
               background: rgba(255,255,255,0.05); color: white; font-size: 1rem;">
    `;
    
    document.getElementById('modalConfirm').onclick = function() {
        const fileName = document.getElementById('newFileName').value.trim();
        if (fileName) {
            files[fileName] = '';
            addFileToTree(fileName);
            closeModal();
        }
    };
    
    modal.classList.add('active');
}

function createNewFolder() {
    showNotification('Folder creation coming soon!', 'info');
}

function uploadFile() {
    document.getElementById('fileUpload').click();
}

function extractZip() {
    showNotification('ZIP extraction coming soon!', 'info');
}

function addFileToTree(fileName) {
    const fileTree = document.getElementById('fileTree');
    const fileItem = document.createElement('div');
    fileItem.className = 'tree-item file';
    fileItem.setAttribute('data-file', fileName);
    fileItem.innerHTML = `
        <i class="fas fa-file-code"></i>
        <span>${fileName}</span>
        <button class="delete-btn" onclick="deleteFile('${fileName}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    fileItem.addEventListener('click', function(e) {
        if (!e.target.classList.contains('delete-btn') && !e.target.closest('.delete-btn')) {
            switchFile(fileName);
        }
    });
    
    fileTree.appendChild(fileItem);
}

function switchFile(fileName) {
    currentFile = fileName;
    editor.setValue(files[fileName] || '');
    
    document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[data-file="${fileName}"]`).classList.add('active');
}

function deleteFile(fileName) {
    if (confirm(`Delete ${fileName}?`)) {
        delete files[fileName];
        document.querySelector(`[data-file="${fileName}"]`).remove();
        
        if (currentFile === fileName) {
            const remainingFiles = Object.keys(files);
            if (remainingFiles.length > 0) {
                switchFile(remainingFiles[0]);
            } else {
                editor.setValue('');
            }
        }
    }
}

function toggleTheme() {
    const currentTheme = editor.getOption('theme');
    editor.setOption('theme', currentTheme === 'dracula' ? 'default' : 'dracula');
}

function formatCode() {
    showNotification('Code formatting coming soon!', 'info');
}

function toggleFullscreen() {
    const outputPanel = document.querySelector('.output-panel');
    outputPanel.classList.toggle('fullscreen');
}

function toggleTerminal() {
    const terminal = document.getElementById('consoleTerminal');
    terminal.style.display = terminal.style.display === 'none' ? 'flex' : 'none';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.console-sidebar');
    sidebar.classList.toggle('active');
}

function showHistory() {
    showNotification('History feature coming soon!', 'info');
}

function showFriends() {
    showNotification('Friends list coming soon!', 'info');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        border-radius: 12px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

function getUserData() {
    const userStr = localStorage.getItem('userData');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

document.getElementById('fileUpload').addEventListener('change', function(e) {
    const files = e.target.files;
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const content = event.target.result;
            addFileToTree(file.name);
            files[file.name] = content;
        };
        reader.readAsText(file);
    }
});

document.getElementById('terminalInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const command = this.value.trim();
        if (command) {
            executeTerminalCommand(command);
            this.value = '';
        }
    }
});

function executeTerminalCommand(command) {
    const terminalOutput = document.getElementById('terminalOutput');
    terminalOutput.innerHTML += `<div style="color: #10b981;">$ ${command}</div>`;
    
    if (command === 'clear') {
        terminalOutput.innerHTML = '';
    } else if (command === 'help') {
        terminalOutput.innerHTML += `<div>Available commands: clear, help, run</div>`;
    } else if (command === 'run') {
        runCode();
        terminalOutput.innerHTML += `<div>Code executed</div>`;
    } else {
        terminalOutput.innerHTML += `<div style="color: #ef4444;">Command not found: ${command}</div>`;
    }
    
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
