class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.speed = 150;
        this.isGameOver = false;
        this.difficulty = 'easy';

        // UI Elements
        this.startButton = document.getElementById('startButton');
        this.scoreElement = document.getElementById('score');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.leaderboardList = document.getElementById('leaderboardList');
        
        // Event Listeners
        this.startButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        this.difficultySelect.addEventListener('change', (e) => this.setDifficulty(e.target.value));

        // Initialize
        this.loadDarkMode();
        this.loadLeaderboard();
        this.updateLeaderboardDisplay();
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch(difficulty) {
            case 'easy':
                this.speed = 150;
                break;
            case 'medium':
                this.speed = 100;
                break;
            case 'hard':
                this.speed = 70;
                break;
        }
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.speed);
        }
    }

    toggleDarkMode() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        this.darkModeToggle.textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
    }

    loadDarkMode() {
        const savedTheme = localStorage.getItem('darkMode') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.darkModeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    loadLeaderboard() {
        this.leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];
        this.leaderboard.sort((a, b) => b.score - a.score);
    }

    saveLeaderboard() {
        localStorage.setItem('snakeLeaderboard', JSON.stringify(this.leaderboard));
    }

    updateLeaderboardDisplay() {
        this.leaderboardList.innerHTML = '';
        this.leaderboard.slice(0, 10).forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.score} Punkte (${entry.difficulty})</span>
            `;
            this.leaderboardList.appendChild(item);
        });
    }

    addToLeaderboard() {
        const name = prompt('Gratulation! Bitte geben Sie Ihren Namen ein:');
        if (name) {
            this.leaderboard.push({
                name: name,
                score: this.score,
                difficulty: this.difficulty,
                date: new Date().toISOString()
            });
            this.leaderboard.sort((a, b) => b.score - a.score);
            this.saveLeaderboard();
            this.updateLeaderboardDisplay();
        }
    }

    generateFood() {
        const x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        const y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        return {x, y};
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--container-bg');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--button-bg');
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        if (this.isGameOver) {
            this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    move() {
        if (this.isGameOver) return;

        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check collision with walls
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            this.gameOver();
            return;
        }

        // Check collision with self
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check if food is eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreElement.textContent = this.score;
            this.food = this.generateFood();
            // Increase speed based on difficulty
            if (this.difficulty === 'easy' && this.speed > 50) {
                this.speed -= 2;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        } else {
            this.snake.pop();
        }
    }

    update() {
        this.move();
        this.draw();
    }

    handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.direction = 'up';
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.direction = 'down';
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.direction = 'left';
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.direction = 'right';
                break;
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);
        this.startButton.textContent = 'Neu starten';
        this.startButton.disabled = false;
        this.addToLeaderboard();
    }

    startGame() {
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        this.setDifficulty(this.difficulty);
        this.isGameOver = false;
        this.scoreElement.textContent = '0';
        this.food = this.generateFood();
        this.startButton.textContent = 'Spiel läuft';
        this.startButton.disabled = true;
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }
}

// Initialize game when page loads
window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    new Snake(canvas);
}; 
