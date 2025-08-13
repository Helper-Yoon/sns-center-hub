const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'data', 'menus.json');

// HTML 페이지 (관리자 모드 추가)
const HTML_PAGE = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>SNS센터 업무 허브 v3.0</title>
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

        .admin-indicator {
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 6px 12px;
            background: #FFD700;
            color: #000;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            display: none;
            z-index: 1001;
        }

        .admin-indicator.active {
            display: block;
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

        .menu-item.admin-menu {
            background: linear-gradient(90deg, #1a1a1a 0%, #1f1a00 100%);
        }

        .menu-item.dragging {
            opacity: 0.5;
            background: #2a5298;
        }

        .menu-item.drag-over {
            background: #2a5298;
            border-top: 2px solid #4A9EFF;
        }

        .menu-item:last-child {
            border-bottom: none;
        }

        .menu-item:hover {
            background: #252525;
            padding-left: 28px;
        }

        .menu-item.admin-menu:hover {
            background: #2a2500;
        }

        .menu-item.edit-mode {
            cursor: move;
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

        .menu-item.admin-menu .menu-icon {
            background: #FFD700;
            color: #000;
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

        .admin-badge {
            display: inline-block;
            margin-left: 8px;
            padding: 2px 6px;
            background: #FFD700;
            color: #000;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }

        .menu-arrow {
            color: #4A9EFF;
            font-size: 20px;
        }

        .menu-actions {
            display: none;
            gap: 6px;
            align-items: center;
        }

        .menu-item.edit-mode .menu-actions {
            display: flex;
        }

        .menu-item.edit-mode .menu-arrow {
            display: none;
        }

        .action-btn {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }

        .move-btn {
            background: #2a2a2a;
            color: white;
        }

        .move-btn:hover:not(:disabled) {
            background: #3a3a3a;
        }

        .move-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
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

        .settings-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }

        .settings-checkbox input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .settings-checkbox label {
            font-size: 12px;
            color: #FFD700;
            cursor: pointer;
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

        .logout-btn {
            width: 100%;
            padding: 10px;
            background: #8b2635;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            margin-top: 8px;
        }

        .logout-btn:hover {
            background: #9b3645;
        }

        .admin-login-btn {
            width: 100%;
            padding: 10px;
            background: #FFD700;
            color: #000;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 8px;
        }

        .admin-login-btn:hover {
            background: #FFC700;
        }

        .admin-login-btn.logout {
            background: #8b2635;
            color: white;
        }

        .admin-login-btn.logout:hover {
            background: #9b3645;
        }

        .server-config {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #2a2a2a;
        }

        .server-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ff4444;
        }

        .status-dot.online {
            background: #44ff44;
        }

        .status-text {
            font-size: 11px;
            color: #8a8a8a;
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
            
            .menu-item.edit-mode {
                padding: 16px 12px;
            }
            
            .action-btn {
                width: 28px;
                height: 28px;
                font-size: 12px;
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
    <div class="admin-indicator" id="adminIndicator">👑 관리자 모드</div>
    
    <div class="container">
        <div class="logo">SNS센터 업무 허브</div>
        <div class="edit-mode-indicator" id="editModeIndicator">📝 편집 모드 (드래그로 순서 변경 가능)</div>
        
        <div class="menu-container" id="menuContainer">
            <div class="loading">메뉴를 불러오는 중...</div>
        </div>
    </div>

    <div class="sync-indicator" id="syncIndicator">동기화 중...</div>

    <button class="settings-btn" id="settingsBtn">⚙️</button>

    <!-- 비밀번호 모달 -->
    <div class="password-modal" id="passwordModal">
        <div class="password-box">
            <div class="password-title" id="passwordTitle">비밀번호 입력</div>
            <input type="password" class="password-input" id="passwordInput" placeholder="****" maxlength="4">
            <div class="password-error" id="passwordError">비밀번호가 틀렸습니다</div>
            <div class="password-buttons">
                <button class="password-btn password-cancel" id="passwordCancelBtn">취소</button>
                <button class="password-btn password-confirm" id="passwordConfirmBtn">확인</button>
            </div>
        </div>
    </div>

    <!-- 설정 패널 -->
    <div class="settings-panel" id="settingsPanel">
        <div class="settings-tabs">
            <button class="tab-btn active" id="addTabBtn">메뉴 추가</button>
            <button class="tab-btn" id="editTabBtn">메뉴 편집</button>
        </div>

        <!-- 메뉴 추가 탭 -->
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
            <div class="settings-checkbox">
                <input type="checkbox" id="isAdminMenu">
                <label for="isAdminMenu">👑 관리자 전용 메뉴</label>
            </div>
            <button class="settings-save" id="addMenuBtn">메뉴 추가</button>
        </div>

        <!-- 메뉴 편집 탭 -->
        <div class="tab-content" id="editTab">
            <div class="settings-title">메뉴 편집 모드</div>
            <p style="color: #8a8a8a; font-size: 12px; margin-bottom: 15px;">
                드래그 앤 드롭 또는 화살표 버튼으로 순서 변경<br>
                편집(✏️) 또는 삭제(🗑️) 버튼 클릭
            </p>
            <button class="settings-save" id="toggleEditBtn">편집 모드 시작</button>
            
            <div class="server-config">
                <div class="server-status">
                    <div class="status-dot online" id="serverStatus"></div>
                    <span class="status-text" id="serverStatusText">서버 연결됨</span>
                </div>
            </div>
            
            <button class="settings-close" id="closeSettingsBtn">설정 닫기</button>
            <button class="logout-btn" id="logoutBtn">로그아웃</button>
        </div>
    </div>

    <!-- 편집 모달 -->
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
            <div class="settings-checkbox">
                <input type="checkbox" id="editIsAdminMenu">
                <label for="editIsAdminMenu">👑 관리자 전용 메뉴</label>
            </div>
            <button class="settings-save" id="saveEditBtn">저장</button>
            <button class="settings-close" id="closeEditBtn">취소</button>
        </div>
    </div>

    <script>
        const PASSWORD = '3504';
        let editMode = false;
        let currentEditIndex = null;
        let draggedElement = null;
        let serverOnline = true;
        let isAdminMode = false;

        // 관리자 모드 UI 업데이트
        function updateAdminUI() {
            const indicator = document.getElementById('adminIndicator');
            
            if (isAdminMode) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
            
            loadMenus();
        }

        // 비밀번호 확인 - 로컬스토리지 체크
        function isPasswordSaved() {
            const savedTime = localStorage.getItem('passwordTime');
            if (!savedTime) return false;
            
            const EXPIRE_TIME = 24 * 60 * 60 * 1000;
            const now = new Date().getTime();
            if (now - parseInt(savedTime) > EXPIRE_TIME) {
                localStorage.removeItem('passwordTime');
                localStorage.removeItem('adminTime');
                return false;
            }
            
            // 비밀번호가 저장되어 있으면 관리자 모드도 자동 활성화
            isAdminMode = true;
            return true;
        }

        // 동기화 표시
        function showSyncIndicator(message, isError = false) {
            const indicator = document.getElementById('syncIndicator');
            indicator.textContent = message;
            indicator.className = isError ? 'sync-indicator error active' : 'sync-indicator active';
            setTimeout(() => {
                indicator.classList.remove('active');
            }, 2000);
        }

        // 메뉴 로드
        async function loadMenus() {
            const container = document.getElementById('menuContainer');
            
            try {
                console.log('메뉴 로드 시작...');
                const response = await fetch('/api/menus');
                console.log('API 응답:', response);
                
                if (response.ok) {
                    let menus = await response.json();
                    console.log('서버에서 받은 메뉴:', menus);
                    
                    // 관리자 모드가 아니면 일반 메뉴만 필터링
                    if (!isAdminMode) {
                        menus = menus.filter(menu => !menu.isAdmin);
                    }
                    
                    renderMenus(menus);
                    localStorage.setItem('customMenus', JSON.stringify(menus));
                    return;
                } else {
                    console.error('서버 응답 오류:', response.status);
                }
            } catch (error) {
                console.error('서버 로드 실패:', error);
            }
            
            console.log('로컬 스토리지에서 메뉴 로드 시도...');
            const savedMenus = localStorage.getItem('customMenus');
            if (savedMenus) {
                let menus = JSON.parse(savedMenus);
                console.log('로컬 스토리지 메뉴:', menus);
                
                // 관리자 모드가 아니면 일반 메뉴만 필터링
                if (!isAdminMode) {
                    menus = menus.filter(menu => !menu.isAdmin);
                }
                
                renderMenus(menus);
            } else {
                console.log('기본 메뉴 표시...');
                const defaultMenus = [
                    {
                        title: "SNS센터 실적보고",
                        desc: "실적 입력 및 관리",
                        url: "https://ajdsns.vercel.app/",
                        icon: "📊",
                        isAdmin: false
                    },
                    {
                        title: "가망상담건 유치자변경 보고시스템",
                        desc: "상요 > 가망 유치자공란 건",
                        url: "https://sangyo-system.vercel.app/",
                        icon: "🔄",
                        isAdmin: false
                    },
                    {
                        title: "취소양식 관리 시스템",
                        desc: "취소양식 생성 및 관리",
                        url: "https://cancel-report.vercel.app/",
                        icon: "📋",
                        isAdmin: false
                    },
                    {
                        title: "SNS센터 채팅분석 프로그램",
                        desc: "채널톡 채팅 심층분석",
                        url: "https://chat-analyzer-ql7u.onrender.com/",
                        icon: "📈",
                        isAdmin: true
                    }
                ];
                
                // 관리자 모드가 아니면 일반 메뉴만 필터링
                let filteredMenus = defaultMenus;
                if (!isAdminMode) {
                    filteredMenus = defaultMenus.filter(menu => !menu.isAdmin);
                }
                
                renderMenus(filteredMenus);
                localStorage.setItem('customMenus', JSON.stringify(defaultMenus));
            }
        }

        // 메뉴 렌더링
        function renderMenus(menus) {
            console.log('renderMenus 호출됨, 메뉴 개수:', menus ? menus.length : 0);
            const container = document.getElementById('menuContainer');
            
            if (!container) {
                console.error('menuContainer 요소를 찾을 수 없습니다');
                return;
            }
            
            if (!menus || menus.length === 0) {
                container.innerHTML = '<div class="loading">표시할 메뉴가 없습니다</div>';
                return;
            }
            
            container.innerHTML = '';
            
            menus.forEach((menu, index) => {
                const newMenu = document.createElement('a');
                newMenu.href = menu.url;
                newMenu.className = menu.isAdmin ? 'menu-item admin-menu' : 'menu-item';
                newMenu.target = '_blank';
                newMenu.setAttribute('data-index', index);
                newMenu.draggable = editMode;
                
                const isFirst = index === 0;
                const isLast = index === menus.length - 1;
                
                newMenu.innerHTML = \`
                    <div class="menu-icon">\${menu.icon}</div>
                    <div class="menu-content">
                        <div class="menu-title">
                            \${menu.title}
                            \${menu.isAdmin ? '<span class="admin-badge">관리자</span>' : ''}
                        </div>
                        <div class="menu-desc">\${menu.desc}</div>
                    </div>
                    <div class="menu-arrow">→</div>
                    <div class="menu-actions">
                        <button class="action-btn move-btn move-up-btn" data-index="\${index}" \${isFirst ? 'disabled' : ''}>⬆️</button>
                        <button class="action-btn move-btn move-down-btn" data-index="\${index}" \${isLast ? 'disabled' : ''}>⬇️</button>
                        <button class="action-btn edit-btn" data-index="\${index}">✏️</button>
                        <button class="action-btn delete-btn" data-index="\${index}">🗑️</button>
                    </div>
                \`;
                
                if (editMode) {
                    newMenu.classList.add('edit-mode');
                    newMenu.onclick = (e) => {
                        e.preventDefault();
                        return false;
                    };
                    setupDragAndDrop(newMenu);
                }
                
                container.appendChild(newMenu);
            });

            bindButtonEvents();
        }

        // 버튼 이벤트 바인딩
        function bindButtonEvents() {
            document.querySelectorAll('.move-up-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const index = parseInt(btn.getAttribute('data-index'));
                    moveUp(index);
                };
            });

            document.querySelectorAll('.move-down-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const index = parseInt(btn.getAttribute('data-index'));
                    moveDown(index);
                };
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const index = parseInt(btn.getAttribute('data-index'));
                    editMenu(index);
                };
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const index = parseInt(btn.getAttribute('data-index'));
                    deleteMenu(index);
                };
            });
        }

        // 드래그 앤 드롭 설정
        function setupDragAndDrop(element) {
            element.addEventListener('dragstart', handleDragStart);
            element.addEventListener('dragenter', handleDragEnter);
            element.addEventListener('dragover', handleDragOver);
            element.addEventListener('dragleave', handleDragLeave);
            element.addEventListener('drop', handleDrop);
            element.addEventListener('dragend', handleDragEnd);
        }

        function handleDragStart(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
        }

        function handleDragEnter(e) {
            if (this !== draggedElement) {
                this.classList.add('drag-over');
            }
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDragLeave(e) {
            this.classList.remove('drag-over');
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            
            if (draggedElement !== this) {
                const container = document.getElementById('menuContainer');
                const allItems = [...container.querySelectorAll('.menu-item')];
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(this);
                
                if (draggedIndex < targetIndex) {
                    container.insertBefore(draggedElement, this.nextSibling);
                } else {
                    container.insertBefore(draggedElement, this);
                }
                
                updateIndicesAndSave();
            }
            
            return false;
        }

        function handleDragEnd(e) {
            const items = document.querySelectorAll('.menu-item');
            items.forEach(item => {
                item.classList.remove('drag-over');
                item.classList.remove('dragging');
            });
        }

        // 위로 이동
        function moveUp(index) {
            if (index === 0) return;
            
            const container = document.getElementById('menuContainer');
            const items = container.querySelectorAll('.menu-item');
            const currentItem = items[index];
            const previousItem = items[index - 1];
            
            container.insertBefore(currentItem, previousItem);
            updateIndicesAndSave();
            showSyncIndicator('순서 변경됨');
        }

        // 아래로 이동
        function moveDown(index) {
            const container = document.getElementById('menuContainer');
            const items = container.querySelectorAll('.menu-item');
            
            if (index >= items.length - 1) return;
            
            const currentItem = items[index];
            const nextItem = items[index + 1];
            
            container.insertBefore(nextItem, currentItem);
            updateIndicesAndSave();
            showSyncIndicator('순서 변경됨');
        }

        // 인덱스 업데이트 및 저장
        function updateIndicesAndSave() {
            const items = document.querySelectorAll('.menu-item');
            const totalItems = items.length;
            
            items.forEach((item, idx) => {
                item.setAttribute('data-index', idx);
                
                const moveUpBtn = item.querySelector('.move-up-btn');
                const moveDownBtn = item.querySelector('.move-down-btn');
                const editBtn = item.querySelector('.edit-btn');
                const deleteBtn = item.querySelector('.delete-btn');
                
                if (moveUpBtn) {
                    moveUpBtn.setAttribute('data-index', idx);
                    moveUpBtn.disabled = idx === 0;
                }
                if (moveDownBtn) {
                    moveDownBtn.setAttribute('data-index', idx);
                    moveDownBtn.disabled = idx === totalItems - 1;
                }
                if (editBtn) editBtn.setAttribute('data-index', idx);
                if (deleteBtn) deleteBtn.setAttribute('data-index', idx);
            });
            
            bindButtonEvents();
            saveMenus();
        }

        // 메뉴 저장 (전체 메뉴 저장)
        async function saveMenus() {
            const menus = [];
            
            // 로컬 스토리지에서 전체 메뉴 가져오기
            const savedMenus = localStorage.getItem('customMenus');
            let allMenus = savedMenus ? JSON.parse(savedMenus) : [];
            
            // 현재 표시된 메뉴 수집
            document.querySelectorAll('.menu-item').forEach(item => {
                const isAdmin = item.classList.contains('admin-menu');
                menus.push({
                    title: item.querySelector('.menu-title').textContent.replace(/관리자/g, '').trim(),
                    desc: item.querySelector('.menu-desc').textContent,
                    url: item.href,
                    icon: item.querySelector('.menu-icon').textContent,
                    isAdmin: isAdmin
                });
            });
            
            // 관리자 모드가 아닌 경우, 숨겨진 관리자 메뉴 보존
            if (!isAdminMode) {
                const hiddenAdminMenus = allMenus.filter(menu => menu.isAdmin);
                menus.push(...hiddenAdminMenus);
            }
            
            localStorage.setItem('customMenus', JSON.stringify(menus));
            
            try {
                const response = await fetch('/api/menus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ menus })
                });
                
                if (response.ok) {
                    console.log('서버 동기화 완료');
                }
            } catch (error) {
                console.error('서버 저장 오류:', error);
            }
        }

        // 메뉴 추가
        async function addMenu() {
            const name = document.getElementById('menuName').value;
            const desc = document.getElementById('menuDesc').value;
            const url = document.getElementById('menuUrl').value;
            const icon = document.getElementById('menuIcon').value || '📋';
            const isAdmin = document.getElementById('isAdminMenu').checked;

            if (!name || !url) {
                alert('메뉴 이름과 URL은 필수입니다.');
                return;
            }

            const newMenu = { title: name, desc: desc || '', url, icon, isAdmin };
            
            try {
                const response = await fetch('/api/menus/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMenu)
                });
                
                if (response.ok) {
                    showSyncIndicator('메뉴 추가됨');
                }
            } catch (error) {
                console.error('서버 추가 오류:', error);
            }

            const savedMenus = localStorage.getItem('customMenus');
            const menus = savedMenus ? JSON.parse(savedMenus) : [];
            menus.push(newMenu);
            
            localStorage.setItem('customMenus', JSON.stringify(menus));
            loadMenus();

            document.getElementById('menuName').value = '';
            document.getElementById('menuDesc').value = '';
            document.getElementById('menuUrl').value = '';
            document.getElementById('menuIcon').value = '';
            document.getElementById('isAdminMenu').checked = false;

            showSyncIndicator('메뉴 추가됨');
        }

        // 메뉴 편집
        function editMenu(index) {
            const menuItem = document.querySelector(\`.menu-item[data-index="\${index}"]\`);
            currentEditIndex = index;

            // 전체 메뉴에서 해당 메뉴 찾기
            const savedMenus = localStorage.getItem('customMenus');
            const allMenus = savedMenus ? JSON.parse(savedMenus) : [];
            
            const menuTitle = menuItem.querySelector('.menu-title').textContent.replace(/관리자/g, '').trim();
            const menuData = allMenus.find(m => m.title === menuTitle);

            document.getElementById('editMenuName').value = menuTitle;
            document.getElementById('editMenuDesc').value = menuItem.querySelector('.menu-desc').textContent;
            document.getElementById('editMenuUrl').value = menuItem.href;
            document.getElementById('editMenuIcon').value = menuItem.querySelector('.menu-icon').textContent;
            document.getElementById('editIsAdminMenu').checked = menuData ? menuData.isAdmin : false;

            document.getElementById('editModal').classList.add('active');
        }

        // 편집 내용 저장
        async function saveEditMenu() {
            const menuItem = document.querySelector(\`.menu-item[data-index="\${currentEditIndex}"]\`);
            const updatedMenu = {
                title: document.getElementById('editMenuName').value,
                desc: document.getElementById('editMenuDesc').value,
                url: document.getElementById('editMenuUrl').value,
                icon: document.getElementById('editMenuIcon').value,
                isAdmin: document.getElementById('editIsAdminMenu').checked
            };
            
            try {
                const response = await fetch(\`/api/menus/\${currentEditIndex}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedMenu)
                });
                
                if (response.ok) {
                    showSyncIndicator('메뉴 수정됨');
                }
            } catch (error) {
                console.error('서버 수정 오류:', error);
            }
            
            // 전체 메뉴 업데이트
            const savedMenus = localStorage.getItem('customMenus');
            const allMenus = savedMenus ? JSON.parse(savedMenus) : [];
            
            const oldTitle = menuItem.querySelector('.menu-title').textContent.replace(/관리자/g, '').trim();
            const menuIndex = allMenus.findIndex(m => m.title === oldTitle);
            
            if (menuIndex !== -1) {
                allMenus[menuIndex] = updatedMenu;
            }
            
            localStorage.setItem('customMenus', JSON.stringify(allMenus));

            closeEditModal();
            loadMenus();
        }

        // 편집 모달 닫기
        function closeEditModal() {
            document.getElementById('editModal').classList.remove('active');
            currentEditIndex = null;
        }

        // 메뉴 삭제
        async function deleteMenu(index) {
            if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
                try {
                    const response = await fetch(\`/api/menus/\${index}\`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        showSyncIndicator('메뉴 삭제됨');
                    }
                } catch (error) {
                    console.error('서버 삭제 오류:', error);
                }
                
                const menuItem = document.querySelector(\`.menu-item[data-index="\${index}"]\`);
                const menuTitle = menuItem.querySelector('.menu-title').textContent.replace(/관리자/g, '').trim();
                
                // 전체 메뉴에서 삭제
                const savedMenus = localStorage.getItem('customMenus');
                let allMenus = savedMenus ? JSON.parse(savedMenus) : [];
                allMenus = allMenus.filter(m => m.title !== menuTitle);
                localStorage.setItem('customMenus', JSON.stringify(allMenus));
                
                menuItem.remove();
                updateIndicesAndSave();
            }
        }

        // 편집 모드 토글
        function toggleEditMode() {
            editMode = !editMode;
            const indicator = document.getElementById('editModeIndicator');
            const menuItems = document.querySelectorAll('.menu-item');
            const editBtn = document.getElementById('toggleEditBtn');

            if (editMode) {
                indicator.classList.add('active');
                menuItems.forEach(item => {
                    item.classList.add('edit-mode');
                    item.draggable = true;
                    item.onclick = (e) => {
                        e.preventDefault();
                        return false;
                    };
                    setupDragAndDrop(item);
                });
                editBtn.textContent = '편집 모드 종료';
                editBtn.style.background = '#8b2635';
            } else {
                indicator.classList.remove('active');
                menuItems.forEach(item => {
                    item.classList.remove('edit-mode');
                    item.draggable = false;
                    item.onclick = null;
                });
                editBtn.textContent = '편집 모드 시작';
                editBtn.style.background = '#1E6FFF';
            }
            bindButtonEvents();
        }

        // 이벤트 리스너 설정
        document.getElementById('settingsBtn').addEventListener('click', function() {
            if (isPasswordSaved()) {
                document.getElementById('settingsPanel').classList.add('active');
                isAdminMode = true;
                updateAdminUI();
            } else {
                document.getElementById('passwordModal').classList.add('active');
                document.getElementById('passwordTitle').textContent = '비밀번호 입력';
                document.getElementById('passwordInput').focus();
            }
        });

        document.getElementById('passwordConfirmBtn').addEventListener('click', checkPassword);
        document.getElementById('passwordCancelBtn').addEventListener('click', closePasswordModal);

        function checkPassword() {
            const input = document.getElementById('passwordInput').value;
            const errorMsg = document.getElementById('passwordError');
            
            if (input === PASSWORD) {
                // 비밀번호 맞으면 자동으로 관리자 모드 활성화
                localStorage.setItem('passwordTime', new Date().getTime().toString());
                localStorage.setItem('adminTime', new Date().getTime().toString());
                isAdminMode = true;
                closePasswordModal();
                document.getElementById('settingsPanel').classList.add('active');
                updateAdminUI();
                showSyncIndicator('관리자 모드 활성화');
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

        // 탭 전환
        document.getElementById('addTabBtn').addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById('addTab').classList.add('active');
        });

        document.getElementById('editTabBtn').addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById('editTab').classList.add('active');
        });

        // 버튼 이벤트
        document.getElementById('addMenuBtn').addEventListener('click', addMenu);
        document.getElementById('toggleEditBtn').addEventListener('click', toggleEditMode);
        document.getElementById('closeSettingsBtn').addEventListener('click', function() {
            document.getElementById('settingsPanel').classList.remove('active');
            if (editMode) {
                toggleEditMode();
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('passwordTime');
            localStorage.removeItem('adminTime');
            isAdminMode = false;
            updateAdminUI();
            alert('로그아웃되었습니다.');
            document.getElementById('settingsPanel').classList.remove('active');
            if (editMode) {
                toggleEditMode();
            }
        });

        // 편집 모달 버튼
        document.getElementById('saveEditBtn').addEventListener('click', saveEditMenu);
        document.getElementById('closeEditBtn').addEventListener('click', closeEditModal);

        // 초기화
        window.addEventListener('load', async function() {
            // 메뉴 버전 확인 및 업데이트
            const MENU_VERSION = 'v3.1';
            const savedVersion = localStorage.getItem('menuVersion');
            
            if (savedVersion !== MENU_VERSION) {
                // 버전이 다르면 메뉴 초기화
                localStorage.removeItem('customMenus');
                localStorage.setItem('menuVersion', MENU_VERSION);
                console.log('메뉴 버전 업데이트:', MENU_VERSION);
            }
            
            // 저장된 비밀번호가 있으면 관리자 모드 활성화
            if (isPasswordSaved()) {
                isAdminMode = true;
            }
            // updateAdminUI가 loadMenus를 호출하므로 별도로 호출하지 않음
            updateAdminUI();
        });

        // 클릭 외부 영역 클릭 시 설정 패널 닫기
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

// 메인 페이지 제공
app.get('/', (req, res) => {
    res.send(HTML_PAGE);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

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
                        title: "SNS센터 실적보고",
                        desc: "실적 입력 및 관리",
                        url: "https://ajdsns.vercel.app/",
                        icon: "📊",
                        isAdmin: false
                    },
                    {
                        title: "가망상담건 유치자변경 보고시스템",
                        desc: "상요 > 가망 유치자공란 건",
                        url: "https://sangyo-system.vercel.app/",
                        icon: "🔄",
                        isAdmin: false
                    },
                    {
                        title: "취소양식 관리 시스템",
                        desc: "취소양식 생성 및 관리",
                        url: "https://cancel-report.vercel.app/",
                        icon: "📋",
                        isAdmin: false
                    },
                    {
                        title: "SNS센터 채팅분석 프로그램",
                        desc: "채널톡 채팅 심층분석",
                        url: "https://chat-analyzer-ql7u.onrender.com/",
                        icon: "📈",
                        isAdmin: true
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

// API 엔드포인트들
app.get('/api/menus', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        res.json(jsonData.menus || jsonData);
    } catch (error) {
        console.error('메뉴 로드 오류:', error);
        res.json([
            {
                title: "SNS센터 실적보고",
                desc: "실적 입력 및 관리",
                url: "https://ajdsns.vercel.app/",
                icon: "📊",
                isAdmin: false
            },
            {
                title: "가망상담건 유치자변경 보고시스템",
                desc: "상요 > 가망 유치자공란 건",
                url: "https://sangyo-system.vercel.app/",
                icon: "🔄",
                isAdmin: false
            },
            {
                title: "취소양식 관리 시스템",
                desc: "취소양식 생성 및 관리",
                url: "https://cancel-report.vercel.app/",
                icon: "📋",
                isAdmin: false
            },
            {
                title: "SNS센터 채팅분석 프로그램",
                desc: "채널톡 채팅 심층분석",
                url: "https://chat-analyzer-ql7u.onrender.com/",
                icon: "📈",
                isAdmin: true
            }
        ]);
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
        
        const menus = jsonData.menus || jsonData;
        menus.push(newMenu);
        
        const saveData = { menus, lastUpdated: new Date().toISOString() };
        await fs.writeFile(DATA_FILE, JSON.stringify(saveData, null, 2));
        
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
        const menus = jsonData.menus || jsonData;
        
        if (index >= 0 && index < menus.length) {
            menus[index] = updatedMenu;
            
            const saveData = { menus, lastUpdated: new Date().toISOString() };
            await fs.writeFile(DATA_FILE, JSON.stringify(saveData, null, 2));
            
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
        const menus = jsonData.menus || jsonData;
        
        if (index >= 0 && index < menus.length) {
            menus.splice(index, 1);
            
            const saveData = { menus, lastUpdated: new Date().toISOString() };
            await fs.writeFile(DATA_FILE, JSON.stringify(saveData, null, 2));
            
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
app.listen(PORT, '0.0.0.0', async () => {
    await initDataFile();
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
