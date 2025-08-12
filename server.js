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

// 초기 데이터 파일 생성
async function initDataFile() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        
        try {
            await fs.access(DATA_FILE);
        } catch {
            // 파일이 없으면 초기 데이터 생성
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

// 메뉴 목록 가져오기
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

// 메뉴 저장/업데이트
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

// 메뉴 추가
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

// 메뉴 수정
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

// 메뉴 삭제
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

// 루트 경로 처리 (서버 상태 확인용)
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'SNS 허브 서버가 실행 중입니다.',
        endpoints: {
            'GET /api/menus': '메뉴 목록 조회',
            'POST /api/menus': '메뉴 전체 저장',
            'POST /api/menus/add': '메뉴 추가',
            'PUT /api/menus/:index': '메뉴 수정',
            'DELETE /api/menus/:index': '메뉴 삭제'
        }
    });
});

// 서버 시작
app.listen(PORT, async () => {
    await initDataFile();
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);
});
