export class GameUI {
    constructor(game) {
        this.game = game;
        
        // Create and set up the UI elements
        this.createUI();
    }
    
    createUI() {
        // Main UI container
        this.container = document.createElement('div');
        this.container.id = 'game-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '100';
        document.body.appendChild(this.container);
        
        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.id = 'score-display';
        this.scoreDisplay.style.position = 'absolute';
        this.scoreDisplay.style.top = '20px';
        this.scoreDisplay.style.left = '20px';
        this.scoreDisplay.style.color = '#fff';
        this.scoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        this.container.appendChild(this.scoreDisplay);
        
        // Game over UI
        this.gameOverUI = document.createElement('div');
        this.gameOverUI.id = 'game-over-ui';
        this.gameOverUI.style.position = 'absolute';
        this.gameOverUI.style.top = '50%';
        this.gameOverUI.style.left = '50%';
        this.gameOverUI.style.transform = 'translate(-50%, -50%)';
        this.gameOverUI.style.color = '#fff';
        this.gameOverUI.style.fontFamily = 'Arial, sans-serif';
        this.gameOverUI.style.fontSize = '36px';
        this.gameOverUI.style.textAlign = 'center';
        this.gameOverUI.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        this.gameOverUI.style.display = 'none';
        this.gameOverUI.style.pointerEvents = 'auto';
        this.gameOverUI.style.zIndex = '1000';
        this.gameOverUI.innerHTML = '<div>GAME OVER</div><div id="final-score"></div><button id="restart-button">Restart</button>';
        this.container.appendChild(this.gameOverUI);
        
        // Set up restart button with enhanced styling
        this.restartButton = document.getElementById('restart-button');
        this.restartButton.style.marginTop = '20px';
        this.restartButton.style.padding = '10px 20px';
        this.restartButton.style.fontSize = '20px';
        this.restartButton.style.cursor = 'pointer';
        this.restartButton.style.backgroundColor = '#4CAF50';
        this.restartButton.style.border = 'none';
        this.restartButton.style.borderRadius = '5px';
        this.restartButton.style.color = 'white';
        
        // Create and attach a new event listener for the restart button
        this.restartButton.onclick = () => {
            console.log('Restart button clicked');
            this.hideGameOver();
            this.game.restart();
        };
    }
    
    update() {
        // Update score display only
        this.scoreDisplay.textContent = `Distance: ${Math.floor(this.game.distance)}`;
    }
    
    showGameOver(score) {
        // Display game over UI
        this.gameOverUI.style.display = 'block';
        
        // Update final score
        document.getElementById('final-score').textContent = `Distance: ${Math.floor(score)}`;
        
        // Hide the original game-over UI to prevent duplication
        const originalGameOverUI = document.getElementById('game-over');
        if (originalGameOverUI) {
            originalGameOverUI.style.display = 'none';
        }
    }
    
    hideGameOver() {
        // Hide game over UI
        this.gameOverUI.style.display = 'none';
        
        // Also hide the original game-over UI
        const originalGameOverUI = document.getElementById('game-over');
        if (originalGameOverUI) {
            originalGameOverUI.style.display = 'none';
        }
    }
} 