class VRBrainTraining {
    constructor() {
        this.balls = [];
        this.score = 0;
        this.gameTime = 0;
        this.gameTimer = null;
        this.isPlaying = false;
        this.ballSize = 80;
        this.captureTime = 2000; // 2 секунды для захвата
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadStats();
        
        // Запрос разрешения на использование гироскопа
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            this.requestSensorPermission();
        }
    }

    initializeElements() {
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameScreen'),
            results: document.getElementById('resultsScreen'),
            stats: document.getElementById('statsScreen')
        };

        this.elements = {
            ballCount: document.getElementById('ballCount'),
            timer: document.getElementById('timer'),
            hits: document.getElementById('hits'),
            finalTime: document.getElementById('finalTime'),
            finalHits: document.getElementById('finalHits'),
            finalAccuracy: document.getElementById('finalAccuracy'),
            ballsPerMinute: document.getElementById('ballsPerMinute'),
            recentStats: document.getElementById('recentStats'),
            statsList: document.getElementById('statsList'),
            ballsContainer: document.getElementById('ballsContainer')
        };

        this.buttons = {
            start: document.getElementById('startBtn'),
            restart: document.getElementById('restartBtn'),
            stats: document.getElementById('statsBtn'),
            back: document.getElementById('backBtn'),
            clearStats: document.getElementById('clearStatsBtn')
        };
    }

    setupEventListeners() {
        this.buttons.start.addEventListener('click', () => this.startGame());
        this.buttons.restart.addEventListener('click', () => this.startGame());
        this.buttons.stats.addEventListener('click', () => this.showStats());
        this.buttons.back.addEventListener('click', () => this.showScreen('start'));
        this.buttons.clearStats.addEventListener('click', () => this.clearStats());

        // Обработка движения устройства
        window.addEventListener('deviceorientation', (e) => this.handleDeviceMove(e));
    }

    async requestSensorPermission() {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                console.log('Доступ к гироскопу разрешен');
            }
        } catch (error) {
            console.log('Ошибка доступа к гироскопу:', error);
        }
    }

    startGame() {
        this.resetGame();
        this.showScreen('game');
        this.isPlaying = true;
        
        // Запуск таймера
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.elements.timer.textContent = this.gameTime;
        }, 1000);

        // Генерация первых шаров
        this.generateBall();
        setInterval(() => this.generateBall(), 2000); // Новый шар каждые 2 секунды
    }

    resetGame() {
        this.balls = [];
        this.score = 0;
        this.gameTime = 0;
        this.elements.ballsContainer.innerHTML = '';
        this.elements.ballCount.textContent = '0';
        this.elements.hits.textContent = '0';
        this.elements.timer.textContent = '0';
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
    }

    generateBall() {
        if (!this.isPlaying) return;

        const ball = document.createElement('div');
        ball.className = 'ball';
        
        // Случайный размер от 60 до 100px
        const size = this.ballSize + Math.random() * 40;
        ball.style.width = `${size}px`;
        ball.style.height = `${size}px`;
        
        // Случайная позиция
        const x = Math.random() * (window.innerWidth - size);
        const y = Math.random() * (window.innerHeight - size);
        ball.style.left = `${x}px`;
        ball.style.top = `${y}px`;
        
        // Случайный цвет
        const hue = Math.random() * 360;
        ball.style.background = `radial-gradient(circle at 30% 30%, hsl(${hue}, 100%, 70%), hsl(${hue}, 100%, 40%))`;
        
        this.elements.ballsContainer.appendChild(ball);
        this.balls.push({
            element: ball,
            x: x + size/2,
            y: y + size/2,
            size: size,
            isCapturing: false,
            captureTimer: null
        });

        this.elements.ballCount.textContent = this.balls.length;
    }

    handleDeviceMove(e) {
        if (!this.isPlaying) return;

        // Простая эмуляция движения на основе гироскопа
        // В реальном приложении здесь будет более сложная логика
        const beta = e.beta || 0; // Наклон вперед-назад
        const gamma = e.gamma || 0; // Наклон влево-вправо

        // Проверка захвата шаров
        this.checkBallCapture();
    }

    checkBallCapture() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const captureRadius = 100; // Радиус захвата

        this.balls.forEach(ball => {
            const distance = Math.sqrt(
                Math.pow(ball.x - centerX, 2) + Math.pow(ball.y - centerY, 2)
            );

            if (distance < captureRadius + ball.size/2) {
                if (!ball.isCapturing) {
                    this.startCapture(ball);
                }
            } else {
                if (ball.isCapturing) {
                    this.stopCapture(ball);
                }
            }
        });
    }

    startCapture(ball) {
        ball.isCapturing = true;
        ball.element.classList.add('capturing');
        
        ball.captureTimer = setTimeout(() => {
            this.captureBall(ball);
        }, this.captureTime);
    }

    stopCapture(ball) {
        ball.isCapturing = false;
        ball.element.classList.remove('capturing');
        if (ball.captureTimer) {
            clearTimeout(ball.captureTimer);
        }
    }

    captureBall(ball) {
        // Анимация исчезновения
        ball.element.style.transform = 'scale(0)';
        ball.element.style.opacity = '0';
        
        setTimeout(() => {
            const index = this.balls.indexOf(ball);
            if (index > -1) {
                this.balls.splice(index, 1);
                ball.element.remove();
                this.elements.ballCount.textContent = this.balls.length;
                
                this.score++;
                this.elements.hits.textContent = this.score;
                
                // Проверка окончания игры (например, после 2 минут)
                if (this.gameTime >= 120) {
                    this.endGame();
                }
            }
        }, 300);
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameTimer);
        
        const accuracy = this.gameTime > 0 ? Math.round((this.score / this.gameTime) * 100) : 0;
        const ballsPerMinute = this.gameTime > 0 ? Math.round((this.score / this.gameTime) * 60) : 0;
        
        this.elements.finalTime.textContent = `${this.gameTime} сек`;
        this.elements.finalHits.textContent = this.score;
        this.elements.finalAccuracy.textContent = `${accuracy}%`;
        this.elements.ballsPerMinute.textContent = ballsPerMinute;
        
        this.saveStats(this.score, this.gameTime, accuracy, ballsPerMinute);
        this.showScreen('results');
    }

    saveStats(hits, time, accuracy, bpm) {
        const stats = this.getStats();
        const session = {
            date: new Date().toLocaleString(),
            hits,
            time,
            accuracy,
            ballsPerMinute: bpm
        };
        
        stats.push(session);
        localStorage.setItem('vrBrainTrainingStats', JSON.stringify(stats));
    }

    getStats() {
        const stats = localStorage.getItem('vrBrainTrainingStats');
        return stats ? JSON.parse(stats) : [];
    }

    loadStats() {
        const stats = this.getStats();
        this.displayRecentStats(stats);
    }

    displayRecentStats(stats) {
        const recent = stats.slice(-3).reverse(); // Последние 3 сессии
        this.elements.recentStats.innerHTML = recent.map(session => `
            <div class="stat-item">
                <div class="stat-header">
                    <span>${session.date}</span>
                    <span>${session.hits} попаданий</span>
                </div>
                <div class="stat-details">
                    <span>Время: ${session.time}с</span>
                    <span>Точность: ${session.accuracy}%</span>
                </div>
            </div>
        `).join('') || '<p>Нет данных о тренировках</p>';
    }

    showStats() {
        const stats = this.getStats().reverse();
        this.elements.statsList.innerHTML = stats.map(session => `
            <div class="stat-item">
                <div class="stat-header">
                    <span>${session.date}</span>
                    <span>${session.hits} попаданий</span>
                </div>
                <div class="stat-details">
                    <span>Время: ${session.time}с</span>
                    <span>Точность: ${session.accuracy}%</span>
                    <span>Шаров/мин: ${session.ballsPerMinute}</span>
                </div>
            </div>
        `).join('') || '<p>Нет данных о тренировках</p>';
        
        this.showScreen('stats');
    }

    clearStats() {
        if (confirm('Очистить всю историю тренировок?')) {
            localStorage.removeItem('vrBrainTrainingStats');
            this.showStats();
        }
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new VRBrainTraining();
});
