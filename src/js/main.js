import { Game } from './game.js';

// Initialize the game when the window loads
window.addEventListener('load', () => {
    const game = new Game();
    game.initialize();
    game.startGameLoop();
}); 