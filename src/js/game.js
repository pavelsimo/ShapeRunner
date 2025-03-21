import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { LevelBuilder } from './levelBuilder.js';
import { CollisionDetector } from './collisionDetector.js';
import { GameUI } from './ui.js';

export class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameSpeed = 7;
        this.distance = 0;
        this.currentLevel = 1;
        this.colorSchemes = {
            purple: {
                background: 0x220033,
                platforms: 0x6600ff,
                player: 0xff00ff,
                spikes: 0x9900ff,
                accent: 0xff00cc
            },
            blue: {
                background: 0x000066,
                platforms: 0x0000ff,
                player: 0x00ffff,
                spikes: 0x0044ff,
                accent: 0x00ff88
            },
            green: {
                background: 0x002211,
                platforms: 0x00dd44,
                player: 0x66ff66,
                spikes: 0x00bb33,
                accent: 0xccff00
            },
            red: {
                background: 0x330011,
                platforms: 0xdd0033,
                player: 0xff4444,
                spikes: 0xff0055, 
                accent: 0xffcc00
            },
            cyan: {
                background: 0x003333,
                platforms: 0x00aaaa,
                player: 0x33ffff,
                spikes: 0x00cccc,
                accent: 0x00ffaa
            }
        };
        this.availableColorSchemes = ['purple', 'blue', 'green', 'red', 'cyan'];
        this.currentColorScheme = 'purple'; // Start with purple theme like in the screenshots
        
        // Set up event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // UI elements
        this.pauseBtn = document.getElementById('pause-btn');
        this.pauseBtn.addEventListener('click', this.togglePause.bind(this));
        
        this.gameOverUI = document.getElementById('game-over');
        this.retryBtn = document.getElementById('retry-btn');
        this.retryBtn.addEventListener('click', this.restart.bind(this));
        
        this.ui = new GameUI(this);
    }

    initialize() {
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.colorSchemes[this.currentColorScheme].background);

        // Create an orthographic camera for 2D view
        const aspectRatio = window.innerWidth / window.innerHeight;
        const cameraHeight = 20;
        const cameraWidth = cameraHeight * aspectRatio;
        this.camera = new THREE.OrthographicCamera(
            -cameraWidth / 2, cameraWidth / 2,
            cameraHeight / 2, -cameraHeight / 2,
            0.1, 1000
        );
        this.camera.position.z = 10;

        // Create level builder
        this.levelBuilder = new LevelBuilder(this.scene, this.colorSchemes[this.currentColorScheme]);
        
        // Create the ground level
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentColorScheme]);
        
        // Load a tile-based level design
        this.loadTileBasedLevel();
        
        // Create the player
        this.player = new Player(this.scene, this.colorSchemes[this.currentColorScheme]);
        this.player.create();
        
        // Create collision detector
        this.collisionDetector = new CollisionDetector(this.player, this.level);
        
        // Add some ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // Initialize game state
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Update the UI elements with the current color scheme
        this.updateUIColors();
    }

    startGameLoop() {
        this.render();
    }

    render() {
        requestAnimationFrame(this.render.bind(this));
        
        if (!this.isRunning || this.isPaused) return;
        
        // Calculate delta time
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        
        // Update game logic
        this.update(deltaTime);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    update(deltaTime) {
        // Move level elements
        this.level.update(deltaTime, this.gameSpeed);
        
        // Update player
        this.player.update(deltaTime);
        
        // Check for level completion
        if (this.level.isLevelCompleted && this.level.portalExists) {
            if (this.collisionDetector.checkPortalCollision()) {
                this.nextLevel();
                return;
            }
        }
        
        // Check for collisions
        if (this.collisionDetector.checkCollisions()) {
            this.gameOver();
        }
        
        // Update camera to follow player
        this.camera.position.x = this.player.mesh.position.x;
        
        // Update score
        this.distance += this.gameSpeed * deltaTime;

        this.ui.update();
    }

    handleKeyDown(event) {
        if (event.code === 'Space' || event.code === 'ArrowUp') {
            this.player.jump();
        }
        
        if (event.code === 'Escape') {
            this.togglePause();
        }
    }

    handleKeyUp(event) {
        // Additional key up handling if needed
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        // Update UI for pause state
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            if (this.isPaused) {
                // Change to play button (triangle shape)
                pauseBtn.innerHTML = '<div class="play-icon"></div>';
                const playIcon = pauseBtn.querySelector('.play-icon');
                if (playIcon) {
                    playIcon.style.width = '0';
                    playIcon.style.height = '0';
                    playIcon.style.borderTop = '10px solid transparent';
                    playIcon.style.borderBottom = '10px solid transparent';
                    playIcon.style.borderLeft = '15px solid ' + this.convertToHex(this.colorSchemes[this.currentColorScheme].accent);
                    playIcon.style.boxShadow = '0 0 5px ' + this.convertToHex(this.colorSchemes[this.currentColorScheme].accent);
                    playIcon.style.marginLeft = '3px';
                }
            } else {
                // Change back to pause button (two vertical lines)
                pauseBtn.innerHTML = '<div></div><div></div>';
                const pauseBars = pauseBtn.querySelectorAll('div');
                const accentColor = this.convertToHex(this.colorSchemes[this.currentColorScheme].accent);
                pauseBars.forEach(bar => {
                    bar.style.width = '5px';
                    bar.style.height = '20px';
                    bar.style.backgroundColor = accentColor;
                    bar.style.margin = '0 3px';
                    bar.style.boxShadow = '0 0 5px ' + accentColor;
                    bar.style.borderRadius = '2px';
                });
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        
        // Show game over UI using the new UI system
        this.ui.showGameOver(this.distance);
        
        // Make sure the old game-over UI is hidden
        const oldGameOverUI = document.getElementById('game-over');
        if (oldGameOverUI) {
            oldGameOverUI.style.display = 'none';
        }
    }

    restart() {
        // Hide game over UI immediately
        this.ui.hideGameOver();
        
        // Clear the existing level
        if (this.level) {
            this.level.clear();
        }
        
        // Reset player position
        this.player.reset();
        
        // Reset camera position
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        
        // Create a new level with current color scheme
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentColorScheme]);
        
        // Use random predefined level designs
        this.loadRandomLevelDesign();
        
        // Setup collision detection
        this.collisionDetector = new CollisionDetector(this.player, this.level);
        
        // Reset game state
        this.gameSpeed = 10;
        this.distance = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isRunning = true; // Ensure the game is running again
        
        // Reset time for game loop
        this.lastFrameTime = performance.now();
        
        // Force an immediate render
        this.renderer.render(this.scene, this.camera);
        
        // Force update on next frame
        requestAnimationFrame(() => {
            this.update(0.016); // Force an update with a small time step
            this.renderer.render(this.scene, this.camera);
        });
    }

    // Use a random predefined level design
    loadRandomLevelDesign() {
        const levelDesigns = this.getDefaultLevelDesigns();
        const levelKeys = Object.keys(levelDesigns);
        
        // Select a random level design or use procedural generation
        const randomIndex = Math.floor(Math.random() * (levelKeys.length + 1)); // +1 for procedural option
        
        if (randomIndex < levelKeys.length) {
            // Use one of the predefined level designs
            const selectedLevel = levelDesigns[levelKeys[randomIndex]];
            this.level.createFromASCII(selectedLevel);
        } else {
            // Use procedural generation
            this.level.create();
        }
    }

    // Load a tile-based level design for the game
    loadTileBasedLevel() {
        // Use the predefined level designs
        const levelDesigns = this.getDefaultLevelDesigns();
        
        // Determine which level to load based on the current level number
        // For level 1, start with the tutorial level
        if (this.currentLevel === 1) {
            this.level.createFromASCII(levelDesigns.tutorial);
        } else {
            // For other levels, select randomly from the remaining designs
            const availableLevels = Object.keys(levelDesigns).filter(key => key !== 'tutorial');
            const selectedKey = availableLevels[Math.floor(Math.random() * availableLevels.length)];
            this.level.createFromASCII(levelDesigns[selectedKey]);
        }
    }

    onWindowResize() {
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update camera aspect ratio
        const aspectRatio = window.innerWidth / window.innerHeight;
        const cameraHeight = 20;
        const cameraWidth = cameraHeight * aspectRatio;
        
        this.camera.left = -cameraWidth / 2;
        this.camera.right = cameraWidth / 2;
        this.camera.top = cameraHeight / 2;
        this.camera.bottom = -cameraHeight / 2;
        this.camera.updateProjectionMatrix();
    }

    nextLevel() {
        // Create teleportation effect
        this.createTeleportEffect();
        
        // Increment level counter
        this.currentLevel++;
        
        // Change color scheme
        const previousColorScheme = this.currentColorScheme;
        // Select a new color scheme that's different from the current one
        do {
            const randomIndex = Math.floor(Math.random() * this.availableColorSchemes.length);
            this.currentColorScheme = this.availableColorSchemes[randomIndex];
        } while (this.currentColorScheme === previousColorScheme);
        
        // Update scene background color
        this.scene.background = new THREE.Color(this.colorSchemes[this.currentColorScheme].background);
        
        // Clear existing level
        this.level.clear();
        
        // Create new level with new color scheme
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentColorScheme]);
        
        // Load a tile-based level design
        this.loadTileBasedLevel();
        
        // Update player colors
        this.player.updateColors(this.colorSchemes[this.currentColorScheme]);
        
        // Reset player position but maintain current score
        this.player.reset();
        
        // Update collision detector
        this.collisionDetector = new CollisionDetector(this.player, this.level);
        
        // Speed up slightly with each level
        this.gameSpeed = 7 + (this.currentLevel - 1) * 0.5;
        
        // Update UI colors to match new color scheme
        this.updateUIColors();
    }
    
    createTeleportEffect() {
        // Store player position for the effect
        const playerX = this.player.mesh.position.x;
        const playerY = this.player.mesh.position.y;
        
        // Create a flash effect
        const flashGeometry = new THREE.PlaneGeometry(window.innerWidth / 20, window.innerHeight / 20);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.set(playerX, playerY, 1); // Place it at player position
        this.scene.add(flash);
        
        // Create particles for the teleport effect
        const particleCount = 50;
        const particles = new THREE.Group();
        
        // Add particles radiating from the player
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 0.5 + 0.2;
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshBasicMaterial({
                color: this.colorSchemes[this.currentColorScheme].accent,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Position at player center
            particle.position.set(playerX, playerY, 0.5);
            
            // Calculate random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 3;
            
            // Set velocity based on angle
            particle.userData.velocityX = Math.cos(angle) * 10;
            particle.userData.velocityY = Math.sin(angle) * 10;
            particle.userData.distance = distance;
            
            // Add to particle group
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Create wave effect
        const waveGeometry = new THREE.RingGeometry(0, 1, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: this.colorSchemes[this.currentColorScheme].platforms,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.set(playerX, playerY, 0.3);
        this.scene.add(wave);
        
        // Animate the teleport effect
        let time = 0;
        const animateTeleport = () => {
            time += 0.05;
            
            // Flash animation
            flash.scale.x = 1 + time;
            flash.scale.y = 1 + time;
            flash.material.opacity = 1 - time / 1.5;
            
            // Wave animation
            wave.scale.x = time * 5;
            wave.scale.y = time * 5;
            wave.material.opacity = 0.7 - time / 1.5;
            
            // Particle animation
            particles.children.forEach(particle => {
                // Move particles outward
                particle.position.x += particle.userData.velocityX * 0.05;
                particle.position.y += particle.userData.velocityY * 0.05;
                
                // Fade particles
                particle.material.opacity = 1 - time / 1.5;
            });
            
            // Continue animation until complete
            if (time < 1.5) {
                requestAnimationFrame(animateTeleport);
            } else {
                // Clean up effect objects
                this.scene.remove(flash);
                this.scene.remove(particles);
                this.scene.remove(wave);
                
                flash.geometry.dispose();
                flash.material.dispose();
                
                wave.geometry.dispose();
                wave.material.dispose();
                
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        // Start animation
        animateTeleport();
    }

    /**
     * Load a level from ASCII representation
     * @param {string} asciiMap - The ASCII map representing the level design
     */
    loadLevelFromASCII(asciiMap) {
        // Clear the current level if it exists
        if (this.level) {
            this.level.clear();
        }
        
        // Create a new level using the ASCII map
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentLevel % this.colorSchemes.length]);
        this.level.createFromASCII(asciiMap);
        
        // Setup collision detection for the new level
        this.collisionDetector = new CollisionDetector(this.player, this.level);
        
        // Reset player position
        this.player.reset();
        
        // Reset camera position
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        
        // Reset game state
        this.gameSpeed = 10;
        this.distance = 0;
        this.isGameOver = false;
        this.isPaused = false;
    }
    
    /**
     * Get the ASCII legend/documentation for level design
     * @returns {string} ASCII legend documentation
     */
    getLevelDesignLegend() {
        return `
LEVEL DESIGN LEGEND:
-------------------
. = Empty space
# = Regular platform (followed by a number 0-9 for height)
^ = Ground spike
/ = Upward stairs pattern
\\ = Downward stairs pattern
Z = Zigzag platform pattern
G = Ground with central spikes pattern
E = Elevated platform with spikes below
F = Gap with floating platform
V = Vertical challenge with pillars
P = Portal (level end)
S = Saw blade obstacle
D = Decoration

EXAMPLES:
--------
Basic level with platforms at different heights:
.........
....#4...
..#2.....
........P
^...^....

Geometry Dash style pattern:
......
......
GG....
......

Multiple platform types:
.........
..F.....V
.....#3..
..#1.....
^...^....

NOTE: 
- Each column represents one segment
- Numbers after platforms (#) indicate height
- Special patterns use two consecutive letters (GG, FF, etc.)
`;
    }
    
    /**
     * Default level designs to choose from
     * @returns {Object} Object with level design strings
     */
    getDefaultLevelDesigns() {
        return {
            tutorial: `
..............
..............
.....#4.......
...#2...#3....
#1............
.......^...^..
`,
            geometryDash: `
................
.......#5.......
................
.GG.FF...EE..VV.
................
^^^^............
`,
            zigzagStairs: `
................
...#5...........
................
.ZZ....//...\\\\..
................
^...^...........
`,
            challenge: `
.....................
........P............
.#8..................
.....#6...............
...#4..................
.#2...................
....^^^....#2....GG...
^^......^^......^^^...
`
        };
    }

    /**
     * Set the current level design and restart the game
     * @param {string} levelDesign - ASCII level design to use
     */
    setLevelDesign(levelDesign) {
        this.currentLevelDesign = levelDesign;
        this.restart();
    }
    
    /**
     * Clear the current level design to use procedural generation
     */
    clearLevelDesign() {
        this.currentLevelDesign = null;
        this.restart();
    }

    checkGameOver() {
        // Check if player collided with an obstacle
        if (this.collisionDetector && this.collisionDetector.checkCollisions()) {
            // Game over
            this.isGameOver = true;
            this.isRunning = false;
            
            // Show game over UI with final score
            this.ui.showGameOver(this.distance);
        }
        
        // Check for portal collision (level completion)
        if (this.collisionDetector && this.collisionDetector.checkPortalCollision()) {
            // Level completed
            this.nextLevel();
        }
    }

    // Helper function to convert color numbers to hex strings
    convertToHex(colorNum) {
        return '#' + colorNum.toString(16).padStart(6, '0');
    }
    
    // Update UI elements with current color scheme
    updateUIColors() {
        // Get current colors
        const accentColor = this.convertToHex(this.colorSchemes[this.currentColorScheme].accent);
        const playerColor = this.convertToHex(this.colorSchemes[this.currentColorScheme].player);
        
        // Update pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.style.borderColor = accentColor;
            pauseBtn.style.boxShadow = `0 0 10px ${accentColor}, inset 0 0 5px ${accentColor}`;
            
            const pauseBars = pauseBtn.querySelectorAll('div');
            pauseBars.forEach(bar => {
                bar.style.backgroundColor = accentColor;
                bar.style.boxShadow = `0 0 5px ${accentColor}`;
            });
        }
        
        // Update retry button in the original game-over UI
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.style.color = accentColor;
            retryBtn.style.borderColor = accentColor;
            retryBtn.style.boxShadow = `0 0 10px ${accentColor}`;
            retryBtn.style.textShadow = `0 0 5px ${accentColor}`;
        }
        
        // Update game-over UI
        const gameOverUI = document.getElementById('game-over');
        if (gameOverUI) {
            gameOverUI.style.color = playerColor;
            gameOverUI.style.borderColor = accentColor;
            gameOverUI.style.boxShadow = `0 0 20px ${accentColor}, inset 0 0 10px ${accentColor}`;
        }
    }
} 