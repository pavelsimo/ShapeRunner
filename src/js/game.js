import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { LevelBuilder } from './levelBuilder.js';
import { CollisionDetector } from './collisionDetector.js';
import { GameUI } from './ui.js';
import { LevelManager } from './levelManager.js';

export class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameSpeed = 10;
        this.distance = 0;
        this.currentLevel = 1;
        this.colorSchemes = {
            purple: {
                background: 0x220044,
                platforms: 0x6633ff,
                player: 0x66ffff,
                spikes: 0xffdd00,
                accent: 0x00ffcc
            },
            magenta: {
                background: 0x800040,
                platforms: 0xff0066,
                player: 0x99ff00,
                spikes: 0xffdd00,
                accent: 0xffcc00
            },
            blue: {
                background: 0x000066,
                platforms: 0x3399ff,
                player: 0x00ffff,
                spikes: 0xffdd00,
                accent: 0x00ff88
            },
            green: {
                background: 0x003322,
                platforms: 0x00ff66,
                player: 0x66ff66,
                spikes: 0xffdd00,
                accent: 0xccff00
            },
            amber: {
                background: 0x331100,
                platforms: 0xff6600,
                player: 0xffbb22,
                spikes: 0xffdd00, 
                accent: 0xffdd00
            }
        };
        this.availableColorSchemes = Object.keys(this.colorSchemes);
        this.currentColorScheme = 'purple';
        
        // Create level manager
        this.levelManager = new LevelManager();
        
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
        
        // Initialize the game
        this.initialize();
        
        // Start the game loop
        this.startGameLoop();
    }

    async initialize() {
        try {
            // First initialize the level manager
            await this.levelManager.initialize();
            
            // Create the renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);
            
            // Create the scene
            this.scene = new THREE.Scene();
            
            // Create scene background with gradient effect
            this.createGradientBackground(this.colorSchemes[this.currentColorScheme].background);
            
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
            
            // Create the ground level - pass the game reference
            this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentColorScheme], this);
            
            // Load a tile-based level design
            this.loadTileBasedLevel();
            
            // Create the player
            this.player = new Player(this.scene, this.colorSchemes[this.currentColorScheme]);
            this.player.create();
            
            // If there's a start position defined in the level, use that
            if (this.level.startPosition) {
                this.player.startX = this.level.startPosition.x;
                this.player.startY = this.level.startPosition.y;
                this.player.reset();
            }
            
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
            
            console.log("Game initialized successfully");
        } catch (error) {
            console.error("Error initializing game:", error);
        }
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
        if (this.isPaused || !this.isRunning) return;
        
        // Move level elements
        this.level.update(deltaTime, this.gameSpeed);
        
        // Update player
        this.player.update(deltaTime);
        
        // Check for collisions and portal
        this.checkGameOver();
        
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
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentColorScheme], this);
        
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
        // Get a level from the level manager
        const difficulty = Math.min(this.currentLevel, 5); // Cap difficulty at 5
        const levelData = this.levelManager.generateLevel(this.currentLevel, difficulty);
        
        // Set theme based on the level data
        if (levelData.theme) {
            this.colorSchemes.custom = {
                background: new THREE.Color(levelData.theme.background),
                platforms: new THREE.Color(levelData.theme.platforms),
                player: new THREE.Color(levelData.theme.player),
                spikes: 0xffdd00, // Default color for spikes
                accent: new THREE.Color(levelData.theme.accent)
            };
            this.currentColorScheme = 'custom';
            
            // Update background with gradient using theme color
            // First remove existing background
            const existingBackground = this.scene.getObjectByName("background");
            if (existingBackground) {
                this.scene.remove(existingBackground);
                existingBackground.geometry.dispose();
                existingBackground.material.dispose();
            }
            
            // Create new gradient background using hex color
            const hexColor = levelData.theme.background;
            const color = new THREE.Color(hexColor);
            this.createGradientBackground(color.getHex());
            
            // Update the levelBuilder with the new color scheme
            this.levelBuilder = new LevelBuilder(this.scene, this.colorSchemes.custom);
            
            // Update player colors
            this.player.updateColors(this.colorSchemes.custom);
            
            // Update UI colors to match new color scheme
            this.updateUIColors();
        }
        
        // Create level from ASCII map
        this.level.createFromASCII(levelData.level);
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
        console.log("Starting next level transition!");
        
        // Create teleportation effect
        this.createTeleportEffect();
        
        // Increment level counter
        this.currentLevel++;
        console.log("Moving to level:", this.currentLevel);
        
        // Select a new color scheme different from the current one
        const previousColorScheme = this.currentColorScheme;
        
        // Force a distinct color theme change by rotating through available schemes
        // This ensures each level has a noticeably different appearance
        const availableSchemes = [...this.availableColorSchemes];
        const currentIndex = availableSchemes.indexOf(this.currentColorScheme);
        
        // Force a new color scheme - ensure it's different by picking one at least 2 positions away
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * availableSchemes.length);
        } while (nextIndex === currentIndex || Math.abs(nextIndex - currentIndex) < 2);
        
        this.currentColorScheme = availableSchemes[nextIndex];
        
        console.log(`Color scheme changed from ${previousColorScheme} to ${this.currentColorScheme}`);
        
        // Display level transition message
        this.ui.showLevelMessage(`LEVEL ${this.currentLevel}`, 2000);
        
        // Update background with new color scheme using gradient
        // First remove existing background
        const existingBackground = this.scene.getObjectByName("background");
        if (existingBackground) {
            this.scene.remove(existingBackground);
            existingBackground.geometry.dispose();
            existingBackground.material.dispose();
        }
        
        // Create new gradient background
        this.createGradientBackground(this.colorSchemes[this.currentColorScheme].background);
        
        // Clear existing level
        this.level.clear();
        
        // Create new levelBuilder with new color scheme
        this.levelBuilder = new LevelBuilder(this.scene, this.colorSchemes[this.currentColorScheme]);
        
        // Create new level with new color scheme
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentColorScheme], this);
        
        // Load a tile-based level design with forced regeneration
        this.loadTileBasedLevel();
        
        // Update player colors
        this.player.updateColors(this.colorSchemes[this.currentColorScheme]);
        
        // Reset player position but maintain current score
        this.player.reset();
        
        // Update collision detector
        this.collisionDetector = new CollisionDetector(this.player, this.level);
        
        // Speed up slightly with each level
        this.gameSpeed = 10 + (this.currentLevel - 1) * 0.5;
        
        // Update UI colors to match new color scheme
        this.updateUIColors();
        
        console.log("Level transition complete!");
    }
    
    createTeleportEffect() {
        // Store player position for the effect
        const playerX = this.player.mesh.position.x;
        const playerY = this.player.mesh.position.y;
        
        // Get next color scheme to use in the effect
        const nextColorScheme = this.colorSchemes[this.currentColorScheme];
        
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
        const particleCount = 100; // Increased for more dramatic effect
        const particles = new THREE.Group();
        
        // Add particles radiating from the player
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 0.5 + 0.2;
            const geometry = new THREE.PlaneGeometry(size, size);
            
            // Use colors from the next color scheme
            const useColor = i % 3 === 0 ? 
                nextColorScheme.platforms : 
                (i % 3 === 1 ? nextColorScheme.accent : nextColorScheme.player);
                
            const material = new THREE.MeshBasicMaterial({
                color: useColor,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Position at player center
            particle.position.set(playerX, playerY, 0.5);
            
            // Calculate random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 6; // Increased for more spread
            
            // Set velocity based on angle
            particle.userData.velocityX = Math.cos(angle) * (10 + Math.random() * 10); // Varied speeds
            particle.userData.velocityY = Math.sin(angle) * (10 + Math.random() * 10);
            particle.userData.distance = distance;
            
            // Add to particle group
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Create multiple wave effects with next theme colors
        const waveCount = 3;
        const waves = [];
        
        for (let i = 0; i < waveCount; i++) {
            const waveGeometry = new THREE.RingGeometry(0, 1, 32);
            const waveMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? nextColorScheme.platforms : 
                      i === 1 ? nextColorScheme.accent : nextColorScheme.player,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const wave = new THREE.Mesh(waveGeometry, waveMaterial);
            wave.position.set(playerX, playerY, 0.3 - i * 0.1);
            wave.userData.delay = i * 0.2; // Stagger the waves
            wave.userData.speed = 1 + i * 0.5; // Different speeds
            this.scene.add(wave);
            waves.push(wave);
        }
        
        // Animate the teleport effect
        let time = 0;
        const animateTeleport = () => {
            time += 0.05;
            
            // Flash animation
            flash.material.opacity = 1 - time / 0.5;
            flash.scale.x = 1 + time * 2;
            flash.scale.y = 1 + time * 2;
            
            // Wave animation
            waves.forEach(wave => {
                // Only start animating a wave after its delay
                if (time > wave.userData.delay) {
                    const waveTime = time - wave.userData.delay;
                    wave.scale.x = waveTime * 5 * wave.userData.speed;
                    wave.scale.y = waveTime * 5 * wave.userData.speed;
                    wave.material.opacity = Math.max(0, 0.7 - waveTime / 1.5);
                }
            });
            
            // Particle animation
            particles.children.forEach(particle => {
                particle.position.x += particle.userData.velocityX * 0.03;
                particle.position.y += particle.userData.velocityY * 0.03;
                particle.material.opacity = 1 - time / 0.8;
                
                // Rotate particle for visual interest
                particle.rotation.z += 0.1;
            });
            
            // Continue animation until completed
            if (time < 1) {
                requestAnimationFrame(animateTeleport);
            } else {
                // Clean up animation elements
                this.scene.remove(flash);
                this.scene.remove(particles);
                
                // Remove all wave objects
                waves.forEach(wave => this.scene.remove(wave));
                
                // Dispose of geometries and materials
                flash.geometry.dispose();
                flash.material.dispose();
                
                waves.forEach(wave => {
                    wave.geometry.dispose();
                    wave.material.dispose();
                });
                
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        // Start the teleport animation
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
        this.level = new Level(this.scene, this.levelBuilder, this.colorSchemes[this.currentLevel % this.colorSchemes.length], this);
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
            console.log("Portal collision detected! Changing level...");
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

    /**
     * Create a gradient background for the scene
     * @param {number} baseColor - The base color for the gradient
     */
    createGradientBackground(baseColor) {
        // Create a gradient background with the base color
        // Convert the numeric color to a three.js color
        const color = new THREE.Color(baseColor);
        
        // Get the RGB components
        const r = color.r;
        const g = color.g;
        const b = color.b;
        
        // Create a slightly lighter version for the top
        const colorTop = new THREE.Color(
            Math.min(r * 1.2, 1),
            Math.min(g * 1.2, 1),
            Math.min(b * 1.2, 1)
        );
        
        // Create a darker version for the bottom
        const colorBottom = new THREE.Color(
            r * 0.5,
            g * 0.5,
            b * 0.5
        );
        
        // Create a large plane for the background
        const geometry = new THREE.PlaneGeometry(2000, 2000);
        
        // Create a shader material with vertical gradient
        const material = new THREE.ShaderMaterial({
            uniforms: {
                colorTop: { value: colorTop },
                colorBottom: { value: colorBottom }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 colorTop;
                uniform vec3 colorBottom;
                varying vec2 vUv;
                
                void main() {
                    gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        // Create and add the background mesh
        const backgroundMesh = new THREE.Mesh(geometry, material);
        backgroundMesh.position.z = -10; // Behind everything
        backgroundMesh.name = "background";
        this.scene.add(backgroundMesh);
    }
} 