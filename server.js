// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'data', 'menus.json');

// HTML 페이지 (메인 페이지로 제공)
const HTML_PAGE = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SNS센터 업무 허브</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 600px;
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
            font-size: 32px;
            font-weight: bold;
            color: #4A9EFF;
        }

        .sync-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: #1E6FFF;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            display: none;
            animation: fadeInOut 2s;
        }

        .sync-indicator.active {
            display: block;
        }

        .sync-indicator.error {
            background: #ff4444;
        }

        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }

        .edit-mode-indicator {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #1E6FFF;
            color: white;
            border-radius: 8px;
            display: none;
            animation: pulse 2s infinite;
        }

        .edit-mode-indicator.active {
            display: block;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }

        .menu-container {
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.5);
            overflow: hidden;
            min-height: 200px;
        }

        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
            color: #8a8a8a;
        }

        .menu-item {
            display: flex;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #2a2a2a;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            position: relative;
        }

        .menu-item:last-child {
            border-bottom: none;
        }

        .menu-item:hover {
            background: #252525;
            padding-left: 28px;
        }

        .menu-item.edit-mode:hover {
            padding-left: 24px;
        }

        .menu-icon {
            width: 40px;
            height: 40px;
            background: #1E6FFF;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            color: white;
            font-size: 18px;
        }

        .menu-content {
            flex: 1;
        }

        .menu-title {
            font-size: 16px;
            font-weight: 500;
            color: #ffffff;
            margin-bottom: 4px;
        }

        .menu-desc {
            font-size: 13px;
            color: #8a8a8a;
        }

        .menu-arrow {
            color: #4A9EFF;
            font-size: 20px;
        }

        .menu-actions {
            display: none;
            gap: 8px;
            align-items: center;
        }

        .menu-item.edit-mode .menu-actions {
            display: flex;
        }

        .menu-item.edit-mode .menu-arrow {
            display: none;
        }

        .action-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 16px;
        }

        .edit-btn {
            background: #2a5298;
            color: white;
        }

        .edit-btn:hover {
            background: #3a62a8;
        }

        .delete-btn {
            background: #8b2635;
            color: white;
        }

        .delete-btn:hover {
            background: #9b3645;
        }

        .settings-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: #1E6FFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(30,111,255,0.3);
            transition: all 0.3s;
            border: none;
        }

        .settings-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(30,111,255,0.4);
        }

        .password-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }

        .password-modal.active {
            display: flex;
        }

        .password-box {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 30px;
            width: 300px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .password-title {
            color: #ffffff;
            font-size: 18px;
            margin-bottom: 20px;
            text-align: center;
        }

        .password-input {
            width: 100%;
            padding: 12px;
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: white;
            font-size: 16px;
            text-align: center;
            letter-spacing: 5px;
        }

        .password-input:focus {
            outline: none;
            border-color: #1E6FFF;
        }

        .password-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        .password-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .password-confirm {
            background: #1E6FFF;
            color: white;
        }

        .password-confirm:hover {
            background: #1859d6;
        }

        .password-cancel {
            background: #2a2a2a;
            color: #8a8a8a;
        }

        .password-cancel:hover {
            background: #333333;
        }

        .password-error {
            color: #ff4444;
            font-size: 12px;
            text-align: center;
            margin-top: 10px;
            display: none;
        }

        .settings-panel {
            position: fixed;
            bottom: 90px;
            right: 30px;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            padding: 20px;
            width: 280px;
            display: none;
            z-index: 1000;
        }

        .settings-panel.active {
            display: block;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .settings-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        .tab-btn {
            flex: 1;
            padding: 8px;
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #8a8a8a;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .tab-btn.active {
            background: #1E6FFF;
            color: white;
            border-color: #1E6FFF;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .settings-title {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 15px;
        }

        .settings-item {
            margin-bottom: 12px;
        }

        .settings-label {
            font-size: 12px;
            color: #8a8a8a;
            margin-bottom: 4px;
        }

        .settings-input {
            width: 100%;
            padding: 8px;
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            font-size: 12px;
            color: white;
        }

        .settings-input:focus {
            outline: none;
            border-color: #1E6FFF;
        }

        .settings-save {
            width: 100%;
            padding: 10px;
            background: #1E6FFF;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            margin-top: 10px;
        }

        .settings-save:hover {
            background: #1859d6;
        }

        .settings-close {
            width: 100%;
            padding: 10px;
            background: #2a2a2a;
            color: #8a8a8a;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            margin-top: 8px;
        }

        .settings-close:hover {
            background: #333333;
            color: white;
        }

        .edit-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        }

        .edit-modal.active {
            display: flex;
        }

        .edit-box {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 30px;
            width: 350px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        @media (max-width: 480px) {
            .menu-item {
                padding: 16px 20px;
            }
            
            .settings-btn {
                width: 45px;
                height: 45px;
                bottom: 20px;
                right: 20px;
            }

            .settings-panel {
                width: calc(100% - 40px);
                right: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">SNS센터 업무 허브</div>
        <div class="edit-mode-indicator" id="editModeIndicator">📝 편집 모드</div>
        
        <div class="menu-container" id="menuContainer">
            <div class="loading">메뉴를 불러오는 중...</div>
        </div>
    </div>

    <div class="sync-indicator" id="syncIndicator">동기화 중...</div>

    <button class="settings-btn" id="settingsBtn">⚙️</button>

    <div class="password-modal" id="passwordModal">
        <div class="password-box">
            <div class="password-title">비밀번호 입력</div>
            <input type="password" class="password-input" id="passwordInput" placeholder="****" maxlength="4">
            <div class="password-error" id="passwordError">비밀번호가 틀렸습니다</div>
            <div class="password-buttons">
                <button class="password-btn password-cancel" onclick="closePasswordModal()">취소</button>
                <button class="password-btn password-confirm" onclick="checkPassword()">확인</button>
            </div>
        </div>
    </div>

    <div class="settings-panel" id="settingsPanel">
        <div class="settings-tabs">
            <button class="tab-btn active" onclick="switchTab('add')">메뉴 추가</button>
            <button class="tab-btn" onclick="switchTab('edit')">메뉴 편집</button>
        </div>

        <div class="tab-content active" id="addTab">
            <div class="settings-title">새 메뉴 추가</div>
            <div class="settings-item">
                <div class="settings-label">메뉴 이름</div>
                <input type="text" class="settings-input" id="menuName" placeholder="예: 보고서 작성">
            </div>
            <div class="settings-item">
                <div class="settings-label">설명</div>
                <input type="text" class="settings-input" id="menuDesc" placeholder="예: 월간 보고서">
            </div>
            <div class="settings-item">
                <div class="settings-label">URL</div>
                <input type="text" class="settings-input" id="menuUrl" placeholder="https://...">
            </div>
            <div class="settings-item">
                <div class="settings-label">아이콘 (이모지)</div>
                <input type="text" class="settings-input" id="menuIcon" placeholder="📝" maxlength="2">
            </div>
            <button class="settings-save" onclick="addMenu()">메뉴 추가</button>
        </div>

        <div class="tab-content" id="editTab">
            <div class="settings-title">메뉴 편집 모드</div>
            <p style="color: #8a8a8a; font-size: 12px; margin-bottom: 15px;">
                각 메뉴의 편집(✏️) 또는 삭제(🗑️) 버튼을 클릭하세요.
            </p>
            <button class="settings-save" onclick="toggleEditMode()">편집 모드 시작</button>
            <button class="settings-close" onclick="closeSettings()">설정 닫기</button>
        </div>
    </div>

    <div class="edit-modal" id="editModal">
        <div class="edit-box">
            <div class="settings-title">메뉴 편집</div>
            <div class="settings-item">
                <div class="settings-label">메뉴 이름</div>
                <input type="text" class="settings-input" id="editMenuName">
            </div>
            <div class="settings-item">
                <div class="settings-label">설명</div>
                <input type="text" class="settings-input" id="editMenuDesc">
            </div>
            <div class="settings-item">
                <div class="settings-label">URL</div>
                <input type="text" class="settings-input" id="editMenuUrl">
            </div>
            <div class="settings-item">
                <div class="settings-label">아이콘 (이모지)</div>
                <input type="text" class="settings-input" id="editMenuIcon" maxlength="2">
            </div>
            <button class="settings-save" onclick="saveEditMenu()">저장</button>
            <button class="settings-close" onclick="closeEditModal()">취소</button>
        </div>
    </div>

    <script>
        const PASSWORD = '3504';
        let editMode = false;
        let currentEditIndex = null;

        function showSyncIndicator(message, isError = false) {
            const indicator = document.getElementById('syncIndicator');
            indicator.textContent = message;
            indicator.className = isError ? 'sync-indicator error active' : 'sync-indicator active';
            setTimeout(() => {
                indicator.classList.remove('active');
            }, 2000);
        }

        async function loadMenus() {
            const container = document.getElementById('menuContainer');
            
            try {
                const response = await fetch('/api/menus');
                if (response.ok) {
                    const menus = await response.json();
                    renderMenus(menus);
                }
            } catch (error) {
                console.error('메뉴 로드 실패:', error);
                container.innerHTML = '<div class="loading">메뉴를 불러올 수 없습니다.</div>';
            }
        }

        function renderMenus(menus) {
            const container = document.getElementById('menuContainer');
            container.innerHTML = '';
            
            menus.forEach((menu, index) => {
                const newMenu = document.createElement('a');
                newMenu.href = menu.url;
                newMenu.className = 'menu-item';
                newMenu.target = '_blank';
                newMenu.setAttribute('data-index', index);
                newMenu.innerHTML = \`
                    <div class="menu-icon">\${menu.icon}</div>
                    <div class="menu-content">
                        <div class="menu-title">\${menu.title}</div>
                        <div class="menu-desc">\${menu.desc}</div>
                    </div>
                    <div class="menu-arrow">→</div>
                    <div class="menu-actions">
                        <button class="action-btn edit-btn" onclick="editMenu(\${index})">✏️</button>
                        <button class="action-btn delete-btn" onclick="deleteMenu(\${index})">🗑️</button>
                    </div>
                \`;
                
                if (editMode) {
                    newMenu.classList.add('edit-mode');
                    newMenu.onclick = (e) => e.preventDefault();
                }
                
                container.appendChild(newMenu);
            });
        }

        async function saveMenus() {
            const menus = [];
            document.querySelectorAll('.menu-item').forEach(item => {
                menus.push({
                    title: item.querySelector('.menu-title').textContent,
                    desc: item.querySelector('.menu-desc').textContent,
                    url: item.href,
                    icon: item.querySelector('.menu-icon').textContent
                });
            });
            
            try {
                const response = await fetch('/api/menus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ menus })
                });
                
                if (response.ok) {
                    showSyncIndicator('저장 완료');
                }
            } catch (error) {
                console.error('저장 실패:', error);
                showSyncIndicator('저장 실패', true);
            }
        }

        async function addMenu() {
            const name = document.getElementById('menuName').value;
            const desc = document.getElementById('menuDesc').value;
            const url = document.getElementById('menuUrl').value;
            const icon = document.getElementById('menuIcon').value || '📋';

            if (!name || !url) {
                alert('메뉴 이름과 URL은 필수입니다.');
                return;
            }

            const newMenu = { title: name, desc: desc || '', url, icon };
            
            try {
                const response = await fetch('/api/menus/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMenu)
                });
                
                if (response.ok) {
                    showSyncIndicator('메뉴 추가됨');
                    
                    document.getElementById('menuName').value = '';
                    document.getElementById('menuDesc').value = '';
                    document.getElementById('menuUrl').value = '';
                    document.getElementById('menuIcon').value = '';
                    
                    loadMenus();
                }
            } catch (error) {
                console.error('추가 실패:', error);
                showSyncIndicator('추가 실패', true);
            }
        }

        function editMenu(index) {
            const menuItem = document.querySelector(\`.menu-item[data-index="\${index}"]\`);
            currentEditIndex = index;

            document.getElementById('editMenuName').value = menuItem.querySelector('.menu-title').textContent;
            document.getElementById('editMenuDesc').value = menuItem.querySelector('.menu-desc').textContent;
            document.getElementById('editMenuUrl').value = menuItem.href;
            document.getElementById('editMenuIcon').value = menuItem.querySelector('.menu-icon').textContent;

            document.getElementById('editModal').classList.add('active');
        }

        async function saveEditMenu() {
            const updatedMenu = {
                title: document.getElementById('editMenuName').value,
                desc: document.getElementById('editMenuDesc').value,
                url: document.getElementById('editMenuUrl').value,
                icon: document.getElementById('editMenuIcon').value
            };
            
            try {
                const response = await fetch(\`/api/menus/\${currentEditIndex}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedMenu)
                });
                
                if (response.ok) {
                    showSyncIndicator('메뉴 수정됨');
                    closeEditModal();
                    loadMenus();
                }
            } catch (error) {
                console.error('수정 실패:', error);
                showSyncIndicator('수정 실패', true);
            }
        }

        function closeEditModal() {
            document.getElementById('editModal').classList.remove('active');
            currentEditIndex = null;
        }

        async function deleteMenu(index) {
            if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
                try {
                    const response = await fetch(\`/api/menus/\${index}\`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        showSyncIndicator('메뉴 삭제됨');
                        loadMenus();
                    }
                } catch (error) {
                    console.error('삭제 실패:', error);
                    showSyncIndicator('삭제 실패', true);
                }
            }
        }

        document.getElementById('settingsBtn').addEventListener('click', function() {
            document.getElementById('passwordModal').classList.add('active');
            document.getElementById('passwordInput').focus();
        });

        function checkPassword() {
            const input = document.getElementById('passwordInput').value;
            const errorMsg = document.getElementById('passwordError');
            
            if (input === PASSWORD) {
                closePasswordModal();
                document.getElementById('settingsPanel').classList.add('active');
            } else {
                errorMsg.style.display = 'block';
                document.getElementById('passwordInput').value = '';
                setTimeout(() => {
                    errorMsg.style.display = 'none';
                }, 2000);
            }
        }

        function closePasswordModal() {
            document.getElementById('passwordModal').classList.remove('active');
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordError').style.display = 'none';
        }

        document.getElementById('passwordInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });

        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            if (tab === 'add') {
                document.getElementById('addTab').classList.add('active');
            } else {
                document.getElementById('editTab').classList.add('active');
            }
        }

        function toggleEditMode() {
            editMode = !editMode;
            const indicator = document.getElementById('editModeIndicator');
            const menuItems = document.querySelectorAll('.menu-item');
            const editBtn = event.target;

            if (editMode) {
                indicator.classList.add('active');
                menuItems.forEach(item => {
                    item.classList.add('edit-mode');
                    item.onclick = (e) => {
                        if (editMode) {
                            e.preventDefault();
                        }
                    };
                });
                editBtn.textContent = '편집 모드 종료';
                editBtn.style.background = '#8b2635';
            } else {
                indicator.classList.remove('active');
                menuItems.forEach(item => {
                    item.classList.remove('edit-mode');
                    item.onclick = null;
                });
                editBtn.textContent = '편집 모드 시작';
                editBtn.style.background = '#1E6FFF';
            }
        }

        function closeSettings() {
            document.getElementById('settingsPanel').classList.remove('active');
            if (editMode) {
                toggleEditMode();
            }
        }

        window.addEventListener('load', function() {
            loadMenus();
        });

        document.addEventListener('click', function(e) {
            const settingsBtn = document.getElementById('settingsBtn');
            const settingsPanel = document.getElementById('settingsPanel');
            const passwordModal = document.getElementById('passwordModal');
            const editModal = document.getElementById('editModal');
            
            if (!settingsBtn.contains(e.target) && 
                !settingsPanel.contains(e.target) && 
                !passwordModal.contains(e.target) &&
                !editModal.contains(e.target)) {
                settingsPanel.classList.remove('active');
            }
        });
    </script>
</body>
</html>`;

// 초기 데이터 파일 생성
async function initDataFile() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        
        try {
            await fs.access(DATA_FILE);
        } catch {
            const initialData = {
                menus: [
                    {
                        title: "채널톡 미답변 상담 모니터 프로그램",
                        desc: "미답변 상담 모니터링",
                        url: "https://channeltalk-server.onrender.com/",
                        icon: "💬"
                    },
                    {
                        title: "SNS센터 실적보고",
                        desc: "실적 입력 및 관리",
                        url: "https://ajdsns.vercel.app/",
                        icon: "📊"
                    }
                ]
            };
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
            console.log('초기 데이터 파일 생성됨');
        }
    } catch (error) {
        console.error('데이터 파일 초기화 오류:', error);
    }
}

// 메인 페이지 제공
app.get('/', (req, res) => {
    res.send(HTML_PAGE);
});

// API 엔드포인트들
app.get('/api/menus', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        res.json(jsonData.menus);
    } catch (error) {
        console.error('메뉴 로드 오류:', error);
        res.status(500).json({ error: '메뉴를 불러올 수 없습니다.' });
    }
});

app.post('/api/menus', async (req, res) => {
    try {
        const { menus } = req.body;
        
        if (!Array.isArray(menus)) {
            return res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
        }

        const data = { menus, lastUpdated: new Date().toISOString() };
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        
        res.json({ success: true, message: '메뉴가 저장되었습니다.' });
    } catch (error) {
        console.error('메뉴 저장 오류:', error);
        res.status(500).json({ error: '메뉴 저장에 실패했습니다.' });
    }
});

app.post('/api/menus/add', async (req, res) => {
    try {
        const newMenu = req.body;
        
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        
        jsonData.menus.push(newMenu);
        jsonData.lastUpdated = new Date().toISOString();
        
        await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2));
        
        res.json({ success: true, menu: newMenu });
    } catch (error) {
        console.error('메뉴 추가 오류:', error);
        res.status(500).json({ error: '메뉴 추가에 실패했습니다.' });
    }
});

app.put('/api/menus/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const updatedMenu = req.body;
        
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        
        if (index >= 0 && index < jsonData.menus.length) {
            jsonData.menus[index] = updatedMenu;
            jsonData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2));
            
            res.json({ success: true, menu: updatedMenu });
        } else {
            res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('메뉴 수정 오류:', error);
        res.status(500).json({ error: '메뉴 수정에 실패했습니다.' });
    }
});

app.delete('/api/menus/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        
        if (index >= 0 && index < jsonData.menus.length) {
            jsonData.menus.splice(index, 1);
            jsonData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2));
            
            res.json({ success: true });
        } else {
            res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('메뉴 삭제 오류:', error);
        res.status(500).json({ error: '메뉴 삭제에 실패했습니다.' });
    }
});

// 서버 시작
app.listen(PORT, async () => {
    await initDataFile();
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);
});
