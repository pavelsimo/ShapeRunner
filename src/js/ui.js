export class GameUI {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        
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
        
        // Score display with Tron-style
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.id = 'score-display';
        this.scoreDisplay.style.position = 'absolute';
        this.scoreDisplay.style.top = '20px';
        this.scoreDisplay.style.left = '20px';
        this.scoreDisplay.style.color = '#00FFFF';
        this.scoreDisplay.style.fontFamily = "'Orbitron', 'Rajdhani', sans-serif";
        this.scoreDisplay.style.fontSize = '22px';
        this.scoreDisplay.style.fontWeight = 'bold';
        this.scoreDisplay.style.padding = '10px 15px';
        this.scoreDisplay.style.borderRadius = '4px';
        this.scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.scoreDisplay.style.border = '2px solid #00FFFF';
        this.scoreDisplay.style.boxShadow = '0 0 10px #00FFFF, inset 0 0 5px #00FFFF';
        this.scoreDisplay.style.textShadow = '0 0 5px #00FFFF';
        this.scoreDisplay.style.letterSpacing = '1px';
        this.scoreDisplay.style.zIndex = '10';
        
        // Create a containing box around score similar to the pause button
        this.scoreBox = document.createElement('div');
        this.scoreBox.id = 'score-box';
        this.scoreBox.style.position = 'absolute';
        this.scoreBox.style.top = '20px';
        this.scoreBox.style.left = '20px';
        this.scoreBox.style.padding = '5px';
        this.scoreBox.style.borderRadius = '8px';
        this.scoreBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.scoreBox.style.border = '2px solid #00FFFF';
        this.scoreBox.style.boxShadow = '0 0 10px #00FFFF, inset 0 0 5px #00FFFF';
        this.scoreBox.style.zIndex = '10';
        this.scoreBox.style.display = 'flex';
        this.scoreBox.style.justifyContent = 'center';
        this.scoreBox.style.alignItems = 'center';
        
        // Add score display to the box
        this.scoreBox.appendChild(this.scoreDisplay);
        this.scoreDisplay.style.position = 'relative';
        this.scoreDisplay.style.top = 'auto';
        this.scoreDisplay.style.left = 'auto';
        this.scoreDisplay.style.border = 'none';
        this.scoreDisplay.style.boxShadow = 'none';
        this.scoreDisplay.style.backgroundColor = 'transparent';
        
        // Add score box to the container
        this.container.appendChild(this.scoreBox);
        
        // Create level display at top center
        this.levelDisplay = document.createElement('div');
        this.levelDisplay.id = 'level-display';
        this.levelDisplay.style.position = 'absolute';
        this.levelDisplay.style.top = '20px';
        this.levelDisplay.style.left = '50%';
        this.levelDisplay.style.transform = 'translateX(-50%)';
        this.levelDisplay.style.color = '#00FFFF';
        this.levelDisplay.style.fontFamily = "'Orbitron', 'Rajdhani', sans-serif";
        this.levelDisplay.style.fontSize = '28px';
        this.levelDisplay.style.fontWeight = 'bold';
        this.levelDisplay.style.padding = '10px 25px';
        this.levelDisplay.style.borderRadius = '8px';
        this.levelDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.levelDisplay.style.border = '3px solid #00FFFF';
        this.levelDisplay.style.boxShadow = '0 0 15px #00FFFF, inset 0 0 8px #00FFFF';
        this.levelDisplay.style.textShadow = '0 0 8px #00FFFF';
        this.levelDisplay.style.letterSpacing = '2px';
        this.levelDisplay.style.zIndex = '9999';
        this.levelDisplay.style.pointerEvents = 'none';
        this.levelDisplay.textContent = 'LEVEL 1';
        this.levelDisplay.style.animation = 'pulseBrighter 2s infinite';
        
        // Add animation for pulsing
        if (!document.getElementById('level-display-animation')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'level-display-animation';
            styleSheet.textContent = `
                @keyframes pulseBrighter {
                    0% { opacity: 0.9; }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
                    100% { opacity: 0.9; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add level display to the container
        this.container.appendChild(this.levelDisplay);
        
        // Create pause button
        this.pauseBtn = document.createElement('button');
        this.pauseBtn.id = 'pause-btn';
        this.pauseBtn.textContent = 'PAUSE';
        this.pauseBtn.style.position = 'absolute';
        this.pauseBtn.style.top = '20px'; // Match the score's top position
        this.pauseBtn.style.right = '20px';
        this.pauseBtn.style.padding = '8px 15px';
        this.pauseBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.pauseBtn.style.color = '#00FFFF';
        this.pauseBtn.style.fontFamily = "'Orbitron', sans-serif";
        this.pauseBtn.style.fontSize = '16px';
        this.pauseBtn.style.fontWeight = 'bold';
        this.pauseBtn.style.border = '2px solid #00FFFF';
        this.pauseBtn.style.borderRadius = '5px';
        this.pauseBtn.style.cursor = 'pointer';
        this.pauseBtn.style.pointerEvents = 'auto';
        this.pauseBtn.style.boxShadow = '0 0 10px #00FFFF';
        this.pauseBtn.style.zIndex = '10';
        
        // Add pause button event listener
        this.pauseBtn.addEventListener('click', () => {
            if (this.game) {
                this.game.togglePause();
            }
        });
        
        // Add pause button to container
        this.container.appendChild(this.pauseBtn);
        
        // Load Tron-style fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@500&display=swap';
        document.head.appendChild(fontLink);
        
        // Game over UI with Tron-style
        this.gameOverUI = document.createElement('div');
        this.gameOverUI.id = 'game-over';
        this.gameOverUI.style.position = 'absolute';
        this.gameOverUI.style.top = '50%';
        this.gameOverUI.style.left = '50%';
        this.gameOverUI.style.transform = 'translate(-50%, -50%)';
        this.gameOverUI.style.width = '80%';
        this.gameOverUI.style.maxWidth = '400px';
        this.gameOverUI.style.color = '#00FFFF';
        this.gameOverUI.style.fontFamily = '"Orbitron", "Rajdhani", monospace';
        this.gameOverUI.style.fontSize = '36px';
        this.gameOverUI.style.textAlign = 'center';
        this.gameOverUI.style.padding = '30px';
        this.gameOverUI.style.border = '3px solid #00FFFF';
        this.gameOverUI.style.borderRadius = '10px';
        this.gameOverUI.style.backgroundColor = 'rgba(0, 10, 40, 0.85)';
        this.gameOverUI.style.boxShadow = '0 0 20px #00FFFF, inset 0 0 10px #00FFFF';
        this.gameOverUI.style.textShadow = '0 0 10px #00FFFF';
        this.gameOverUI.style.display = 'none';
        this.gameOverUI.style.pointerEvents = 'auto';
        this.gameOverUI.style.zIndex = '1000';
        
        // Create game over header with animated glitch effect
        const gameOverHeader = document.createElement('h2');
        gameOverHeader.textContent = 'GAME OVER';
        gameOverHeader.style.fontSize = '42px';
        gameOverHeader.style.fontWeight = 'bold';
        gameOverHeader.style.marginBottom = '20px';
        gameOverHeader.style.letterSpacing = '4px';
        gameOverHeader.classList.add('neon-text');
        
        // Create final score container
        const finalScoreContainer = document.createElement('div');
        finalScoreContainer.id = 'final-score';
        finalScoreContainer.style.fontSize = '28px';
        finalScoreContainer.style.marginTop = '15px';
        finalScoreContainer.style.marginBottom = '25px';
        finalScoreContainer.style.padding = '10px';
        finalScoreContainer.style.border = '2px solid rgba(0, 255, 255, 0.5)';
        finalScoreContainer.style.borderRadius = '5px';
        
        // Create restart button with Tron style
        const restartButton = document.createElement('button');
        restartButton.id = 'retry-btn';
        restartButton.textContent = 'RETRY';
        restartButton.style.marginTop = '20px';
        restartButton.style.padding = '12px 30px';
        restartButton.style.fontSize = '20px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.backgroundColor = 'transparent';
        restartButton.style.border = '2px solid #00FFFF';
        restartButton.style.borderRadius = '5px';
        restartButton.style.color = '#00FFFF';
        restartButton.style.fontFamily = '"Orbitron", monospace';
        restartButton.style.letterSpacing = '2px';
        restartButton.style.textShadow = '0 0 5px #00FFFF';
        restartButton.style.boxShadow = '0 0 10px #00FFFF';
        restartButton.style.transition = 'all 0.2s ease';
        
        // Add hover effect
        restartButton.onmouseover = () => {
            restartButton.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
            restartButton.style.boxShadow = '0 0 15px #00FFFF';
        };
        
        restartButton.onmouseout = () => {
            restartButton.style.backgroundColor = 'transparent';
            restartButton.style.boxShadow = '0 0 10px #00FFFF';
        };
        
        // Add click effect
        restartButton.onmousedown = () => {
            restartButton.style.transform = 'scale(0.95)';
        };
        
        restartButton.onmouseup = () => {
            restartButton.style.transform = 'scale(1)';
        };
        
        // Build the game over UI
        this.gameOverUI.appendChild(gameOverHeader);
        this.gameOverUI.appendChild(finalScoreContainer);
        this.gameOverUI.appendChild(restartButton);
        this.container.appendChild(this.gameOverUI);
        
        // Create animation for the glow effect
        const style = document.createElement('style');
        style.textContent = `
            @keyframes neonPulse {
                0% { text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF; }
                50% { text-shadow: 0 0 15px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF; }
                100% { text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF; }
            }
            
            .neon-text {
                animation: neonPulse 1.5s infinite;
            }
            
            @keyframes glitch {
                0% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                50% { transform: translateX(5px); }
                75% { transform: translateX(-2px); }
                100% { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Create and attach a new event listener for the restart button
        restartButton.onclick = () => {
            console.log('Restart button clicked');
            this.hideGameOver();
            this.game.restart();
        };
    }
    
    update() {
        this.score = Math.floor(this.game.distance);
        
        // Update the score color based on the current game color scheme
        if (this.game.colorSchemes && this.game.currentColorScheme) {
            const accentColor = this.convertToHex(this.game.colorSchemes[this.game.currentColorScheme].accent);
            this.scoreDisplay.style.color = accentColor;
            this.scoreDisplay.style.borderColor = accentColor;
            this.scoreDisplay.style.boxShadow = `0 0 10px ${accentColor}, inset 0 0 5px ${accentColor}`;
            this.scoreDisplay.style.textShadow = `0 0 5px ${accentColor}`;
            
            // Update level display colors as well
            if (this.levelDisplay) {
                this.levelDisplay.style.color = accentColor;
                this.levelDisplay.style.borderColor = accentColor;
                this.levelDisplay.style.boxShadow = `0 0 10px ${accentColor}, inset 0 0 5px ${accentColor}`;
                this.levelDisplay.style.textShadow = `0 0 5px ${accentColor}`;
            }
        }
        
        // Update the score display with animation for significant milestones
        this.scoreDisplay.textContent = `SCORE: ${this.score}`;
        
        // Update level display
        if (this.levelDisplay && this.game.currentLevel) {
            this.levelDisplay.textContent = `LEVEL ${this.game.currentLevel}`;
        }
        
        // Highlight score on milestone (every 1000 points)
        if (this.score > 0 && this.score % 1000 === 0 && this.score !== this.lastMilestone) {
            this.highlightScore();
            this.lastMilestone = this.score;
        }
    }
    
    // Helper function to convert THREE.js color numbers to hex strings
    convertToHex(colorNum) {
        const hex = '#' + colorNum.toString(16).padStart(6, '0');
        return hex;
    }
    
    showGameOver(score) {
        // Get colors from current color scheme
        const colorScheme = this.game.colorSchemes[this.game.currentColorScheme];
        const accentColor = this.convertToHex(colorScheme.accent);
        const playerColor = this.convertToHex(colorScheme.player);
        
        // Update UI colors to match current theme
        this.gameOverUI.style.borderColor = accentColor;
        this.gameOverUI.style.color = playerColor;
        this.gameOverUI.style.boxShadow = `0 0 20px ${accentColor}, inset 0 0 10px ${accentColor}`;
        
        // Update restart button colors
        const restartButton = document.getElementById('retry-btn');
        restartButton.style.borderColor = accentColor;
        restartButton.style.color = accentColor;
        restartButton.style.boxShadow = `0 0 10px ${accentColor}`;
        restartButton.style.textShadow = `0 0 5px ${accentColor}`;
        
        // Update final score color and value
        const finalScore = document.getElementById('final-score');
        finalScore.style.borderColor = `${accentColor}80`; // 50% opacity
        finalScore.textContent = `DISTANCE: ${Math.floor(score)}`;
        
        // Add a brief "glitch" animation before showing the game over screen
        const gameOverHeader = this.gameOverUI.querySelector('.neon-text');
        gameOverHeader.style.animation = 'glitch 0.2s 3, neonPulse 1.5s infinite';
        setTimeout(() => {
            gameOverHeader.style.animation = 'neonPulse 1.5s infinite';
        }, 600);
        
        // Display game over UI
        this.gameOverUI.style.display = 'block';
        
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
    
    showLevelMessage(message, duration = 3000) {
        // Create message element if it doesn't exist
        if (!this.levelMessage) {
            this.levelMessage = document.createElement('div');
            this.levelMessage.id = 'level-message';
            this.levelMessage.style.position = 'absolute';
            this.levelMessage.style.top = '50%';
            this.levelMessage.style.left = '50%';
            this.levelMessage.style.transform = 'translate(-50%, -50%)';
            this.levelMessage.style.fontFamily = '"Orbitron", "Rajdhani", monospace';
            this.levelMessage.style.fontSize = '48px';
            this.levelMessage.style.fontWeight = 'bold';
            this.levelMessage.style.textAlign = 'center';
            this.levelMessage.style.padding = '25px 40px';
            this.levelMessage.style.borderRadius = '15px';
            this.levelMessage.style.backgroundColor = 'rgba(0, 10, 30, 0.8)';
            this.levelMessage.style.zIndex = '1000';
            this.levelMessage.style.opacity = '0';
            this.levelMessage.style.transition = 'all 0.5s ease-in-out';
            this.levelMessage.style.transform = 'translate(-50%, -50%) scale(0.8)';
            this.container.appendChild(this.levelMessage);
        }
        
        // Update text and styling based on the game's current color scheme
        this.levelMessage.textContent = message;
        const accentColor = this.game.colorSchemes[this.game.currentColorScheme].accent;
        const platformColor = this.game.colorSchemes[this.game.currentColorScheme].platforms;
        const accentHex = this.convertToHex(accentColor);
        const platformHex = this.convertToHex(platformColor);
        
        // Enhanced styling for level messages
        this.levelMessage.style.color = accentHex;
        this.levelMessage.style.border = `4px solid ${platformHex}`;
        this.levelMessage.style.boxShadow = `0 0 25px ${accentHex}, inset 0 0 15px ${platformHex}`;
        this.levelMessage.style.textShadow = `0 0 15px ${accentHex}, 0 0 5px ${platformHex}`;
        this.levelMessage.style.letterSpacing = '2px';
        
        // Show message with enhanced effect
        setTimeout(() => {
            this.levelMessage.style.opacity = '1';
            this.levelMessage.style.transform = 'translate(-50%, -50%) scale(1.1)';
            
            // Then settle to normal size
            setTimeout(() => {
                this.levelMessage.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 150);
        }, 10);
        
        // Clear any existing timeout
        if (this.levelMessageTimeout) {
            clearTimeout(this.levelMessageTimeout);
        }
        
        // Hide message after duration
        this.levelMessageTimeout = setTimeout(() => {
            this.levelMessage.style.opacity = '0';
            this.levelMessage.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }, duration);
    }
    
    // Highlight the score with a pulse animation
    highlightScore() {
        this.scoreDisplay.style.animation = 'none';
        void this.scoreDisplay.offsetWidth; // Trigger reflow
        this.scoreDisplay.style.animation = 'scorePulse 0.5s';
        
        // Add temporary animation if it doesn't exist
        if (!document.getElementById('score-pulse-animation')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'score-pulse-animation';
            styleSheet.textContent = `
                @keyframes scorePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
    
    updateScore(score) {
        // Check if score element exists, if not create it
        if (!this.scoreElement) {
            this.scoreElement = document.createElement('div');
            this.scoreElement.id = 'score';
            this.scoreElement.style.position = 'absolute';
            this.scoreElement.style.top = '20px';
            this.scoreElement.style.right = '20px';
            this.scoreElement.style.fontSize = '24px';
            this.scoreElement.style.fontWeight = 'bold';
            this.scoreElement.style.color = '#ffffff';
            this.scoreElement.style.textShadow = '0 0 3px #000';
            document.body.appendChild(this.scoreElement);
        }
        
        // Update score display
        this.scoreElement.textContent = `Score: ${score}`;
    }
    
    showScorePopup(text, position) {
        // Create a temporary text element for score feedback
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        popup.style.position = 'absolute';
        
        // Position the popup near the collected item
        // Convert 3D position to screen position
        // This is a simplified approach - in a real game, you'd convert from 3D to screen coords
        const left = window.innerWidth / 2 + position.x * 20;  // Approximation
        const top = window.innerHeight / 2 - position.y * 20;  // Approximation
        
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        
        // Style the popup
        popup.style.color = '#ffff00';
        popup.style.fontWeight = 'bold';
        popup.style.fontSize = '24px';
        popup.style.textShadow = '0 0 5px #000';
        popup.style.pointerEvents = 'none';  // So it doesn't interfere with mouse events
        popup.style.zIndex = '1000';
        popup.style.opacity = '1';
        popup.style.transition = 'all 0.8s ease-out';
        
        // Add to the DOM
        document.body.appendChild(popup);
        
        // Animate the popup
        setTimeout(() => {
            popup.style.top = `${top - 50}px`;  // Move up
            popup.style.opacity = '0';  // Fade out
        }, 50);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 1000);
    }
    
    updateDistance(distance) {
        // Check if distance element exists, if not create it
        if (!this.distanceElement) {
            this.distanceElement = document.createElement('div');
            this.distanceElement.id = 'distance';
            this.distanceElement.style.position = 'absolute';
            this.distanceElement.style.top = '50px';
            this.distanceElement.style.right = '20px';
            this.distanceElement.style.fontSize = '18px';
            this.distanceElement.style.color = '#ffffff';
            this.distanceElement.style.textShadow = '0 0 3px #000';
            document.body.appendChild(this.distanceElement);
        }
        
        // Update distance display
        this.distanceElement.textContent = `Distance: ${distance}m`;
    }
} 