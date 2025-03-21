import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Import the level designer
import { LevelDesigner } from './levelDesigner.js';

export class Level {
    constructor(scene, levelBuilder, colors, game) {
        this.scene = scene;
        this.levelBuilder = levelBuilder;
        this.colors = colors;
        this.game = game; // Store reference to the game
        
        // Level properties
        this.levelWidth = 1000;
        this.groundY = -8;
        this.levelLength = 300; // Reduced from 500 to make levels shorter
        this.levelSegmentWidth = 30;
        this.segmentsToGenerate = 15; // Increased from 10 to 15 for more immediate obstacles
        
        // Level objects
        this.platforms = [];
        this.obstacles = [];
        this.decorations = [];
        this.portals = [];
        this.collectibles = []; // Array for collectible items
        
        // State tracking
        this.hasKey = false;
        this.startPosition = null;
        
        // Track animation frames for cleanup
        this.animationFrames = [];
        
        // Level progress
        this.currentLevelPosition = 0;
        this.isLevelCompleted = false;
        this.portalExists = false;
        this.portalObject = null;
        
        // Create level designer instance
        this.levelDesigner = new LevelDesigner(this);
    }

    /**
     * Create a level from ASCII representation
     * @param {string} asciiMap - The ASCII map with each line representing a row
     */
    createFromASCII(asciiMap) {
        // Clear any existing level elements
        this.clear();
        
        // Reset position
        this.currentLevelPosition = 0;
        
        // Create the ground
        this.createGround();
        
        // Create backdrop elements
        this.createBackdrop();
        
        // Generate level from ASCII map
        this.levelDesigner.generateFromASCII(asciiMap, this.levelSegmentWidth);
        
        // Calculate level length based on current position
        this.levelLength = this.currentLevelPosition + 100; // Add extra space at the end
    }

    create() {
        // Create the ground
        this.createGround();
        
        // Create backdrop elements
        this.createBackdrop();
        
        // Generate initial level segments
        for (let i = 0; i < this.segmentsToGenerate; i++) {
            this.generateNextSegment();
        }
    }

    createGround() {
        // Create a glowing neon ground line
        const groundGeometry = new THREE.PlaneGeometry(200, 0.3);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: false
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.position.set(0, this.groundY, 0);
        this.scene.add(this.ground);
        
        // Add ground to platforms for collision
        this.platforms.push({
            mesh: this.ground,
            width: 200,
            height: 0.3,
            x: 0,
            y: this.groundY,
            type: 'ground'
        });
    }

    createBackdrop() {
        // Create background grid patterns
        this.createBackgroundGrid();
        
        // Create floating squares in background
        this.createFloatingSquares();
    }

    createBackgroundGrid() {
        // Create a grid pattern in the background
        const gridSize = 200; // Increased from 100 to cover more area
        const lineCount = 20; // Increased from 10 for more grid lines
        const gridGroup = new THREE.Group();
        
        // Horizontal lines
        for (let i = 0; i <= lineCount; i++) {
            const y = (i / lineCount) * gridSize - gridSize / 2;
            const lineGeometry = new THREE.PlaneGeometry(gridSize, 0.1);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.platforms,
                transparent: true,
                opacity: 0.1
            });
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(0, y, -5);
            gridGroup.add(line);
        }
        
        // Vertical lines
        for (let i = 0; i <= lineCount; i++) {
            const x = (i / lineCount) * gridSize - gridSize / 2;
            const lineGeometry = new THREE.PlaneGeometry(0.1, gridSize);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.platforms,
                transparent: true,
                opacity: 0.1
            });
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(x, 0, -5);
            gridGroup.add(line);
        }
        
        this.scene.add(gridGroup);
        this.decorations.push(gridGroup);
        
        // This grid moves with the camera, not with the level
        gridGroup.userData.isFixedBackground = true;
    }

    createFloatingSquares() {
        // Create floating squares in the background for decoration
        const squareCount = 20;
        const squareGroup = new THREE.Group();
        
        for (let i = 0; i < squareCount; i++) {
            const size = Math.random() * 3 + 1;
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.platforms,
                transparent: true,
                opacity: 0.05 + Math.random() * 0.1
            });
            
            const square = new THREE.Mesh(geometry, material);
            
            // Random position
            const x = Math.random() * 100 - 50;
            const y = Math.random() * 50 - 25;
            square.position.set(x, y, -10);
            
            // Add pulsing animation data
            square.userData.pulseFactor = Math.random() * 0.5 + 0.5;
            square.userData.pulseSpeed = Math.random() * 2 + 1;
            square.userData.initialOpacity = square.material.opacity;
            
            squareGroup.add(square);
        }
        
        this.scene.add(squareGroup);
        this.decorations.push(squareGroup);
    }

    generateNextSegment() {
        // Generate a segment of the level with obstacles
        const segmentX = this.currentLevelPosition + this.levelSegmentWidth / 2;
        
        // Choose a random segment type with more pattern variety
        // Added new chunk patterns inspired by Geometry Dash
        const segmentType = Math.floor(Math.random() * 9); // Increased to 9 for more variety
        
        switch (segmentType) {
            case 0:
                // Spike segment
                this.generateSpikes(segmentX);
                break;
            case 1:
                // Platform segment
                this.generatePlatforms(segmentX);
                break;
            case 2:
                // Combined segment
                this.generateCombinedObstacles(segmentX);
                break;
            case 3:
                // Empty segment with decorations
                this.generateEmptySegment(segmentX);
                break;
            case 4:
                // Stair pattern
                this.generateStairPattern(segmentX);
                break;
            case 5:
                // CHUNK 1: Basic ground with central spikes
                this.generateGroundWithCentralSpikes(segmentX);
                break;
            case 6:
                // CHUNK 2: Elevated platform with spikes below
                this.generateElevatedPlatformWithSpikes(segmentX);
                break;
            case 7:
                // CHUNK 3: Gap with a small floating platform
                this.generateGapWithFloatingPlatform(segmentX);
                break;
            case 8:
                // CHUNK 4: Vertical challenge or "climb"
                this.generateVerticalChallenge(segmentX);
                break;
        }
        
        // Update current position
        this.currentLevelPosition += this.levelSegmentWidth;
    }

    generateSpikes(xPosition) {
        // Generate spike groups (3-5 triangles close to each other)
        // Number of groups in this segment
        const groupCount = Math.floor(Math.random() * 3) + 1;
        const groupSpacing = this.levelSegmentWidth / (groupCount + 1);
        
        for (let g = 0; g < groupCount; g++) {
            // Position for this group
            const groupX = xPosition - this.levelSegmentWidth / 2 + groupSpacing * (g + 1);
            
            // Each group has 3-5 spikes
            const spikeCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 spikes
            
            // Spacing between spikes in a group
            const spikeSpacing = 0.7; // Close together
            
            // Calculate start position to center the group
            const groupStartX = groupX - ((spikeCount - 1) * spikeSpacing) / 2;
            
            for (let i = 0; i < spikeCount; i++) {
                const x = groupStartX + (i * spikeSpacing);
                // Place spikes exactly at ground level (no floating)
                const y = this.groundY + 0.15; // Just a tiny bit above ground for visual clarity
                const size = 0.8 + Math.random() * 0.6; // Slightly varied spike sizes for visual interest
                
                const spike = this.levelBuilder.createSpike(x, y, size);
                this.obstacles.push(spike);
            }
        }
    }

    generatePlatforms(xPosition) {
        // Generate platforms of varying heights and patterns
        // Choose between regular platforms and zigzag pattern
        if (Math.random() > 0.4) {
            // Regular platform pattern
            this.generateRegularPlatforms(xPosition);
        } else {
            // Zigzag platform pattern
            this.generateZigzagPlatforms(xPosition);
        }
    }

    generateRegularPlatforms(xPosition) {
        // The original platform generation code
        const platformCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < platformCount; i++) {
            const x = xPosition - this.levelSegmentWidth / 3 + (this.levelSegmentWidth / 2) * (i / platformCount);
            const height = Math.random() * 3 + 2;
            const width = Math.random() * 2 + 2;
            
            const platform = this.levelBuilder.createPlatform(x, this.groundY + height, width, 1.5);
            this.platforms.push(platform);
            
            // Add spike groups on some platforms
            if (Math.random() > 0.5) {
                // Create a small group of spikes (2-3) on the platform
                const spikeCount = Math.floor(Math.random() * 2) + 2; // 2 to 3 spikes
                const spikeSpacing = 0.6;
                
                // Center the spikes on the platform
                const groupStartX = x - ((spikeCount - 1) * spikeSpacing) / 2;
                
                for (let j = 0; j < spikeCount; j++) {
                    const spikeX = groupStartX + (j * spikeSpacing);
                    // Place spikes directly on top of the platform
                    const spikeY = this.groundY + height + 0.9;
                    const spikeSize = 0.7 + Math.random() * 0.3;
                    
                    const spike = this.levelBuilder.createSpike(spikeX, spikeY, spikeSize);
                    
                    // Track that this spike is on a platform
                    spike.onPlatform = true;
                    spike.platformRef = platform;
                    spike.platformOffsetX = spikeX - x; // Offset from platform center
                    spike.platformOffsetY = spikeY - (this.groundY + height); // Offset from platform center
                    
                    this.obstacles.push(spike);
                }
            }
        }
    }

    generateZigzagPlatforms(xPosition) {
        // Create a zigzag pattern of platforms (2-4 platforms alternating sides)
        const platformCount = Math.floor(Math.random() * 3) + 2; // 2-4 platforms
        const baseHeight = Math.random() * 2 + 2; // Starting height
        const heightIncrease = 1.2; // Height increase per step
        const platformWidth = 2.5;
        const sideOffset = 4; // How far platforms are from center
        
        for (let i = 0; i < platformCount; i++) {
            // Alternate left and right
            const side = i % 2 === 0 ? -1 : 1;
            const x = xPosition + (side * sideOffset);
            const height = baseHeight + (i * heightIncrease);
            
            const platform = this.levelBuilder.createPlatform(x, this.groundY + height, platformWidth, 1);
            this.platforms.push(platform);
            
            // Occasionally add a spike on the platform (less frequent)
            if (Math.random() > 0.7) {
                const spike = this.levelBuilder.createSpike(x, this.groundY + height + 0.6, 0.8);
                
                // Track that this spike is on a platform
                spike.onPlatform = true;
                spike.platformRef = platform;
                spike.platformOffsetX = 0; // Centered on platform
                spike.platformOffsetY = 0.6; // Offset from platform center
                
                this.obstacles.push(spike);
            }
        }
    }

    generateCombinedObstacles(xPosition) {
        // Generate a mix of spikes and platforms
        
        // Add a spike group
        const spikeCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 spikes in a group
        const spikeSpacing = 0.7; // Close together
        const groupX = xPosition - this.levelSegmentWidth / 4;
        
        // Calculate start position to center the group
        const groupStartX = groupX - ((spikeCount - 1) * spikeSpacing) / 2;
        
        for (let i = 0; i < spikeCount; i++) {
            const x = groupStartX + (i * spikeSpacing);
            // Place spikes exactly at ground level
            const y = this.groundY + 0.15;
            const size = 0.8 + Math.random() * 0.4;
            
            const spike = this.levelBuilder.createSpike(x, y, size);
            this.obstacles.push(spike);
        }
        
        // Add a platform
        const platformX = xPosition + this.levelSegmentWidth / 4;
        const platformHeight = Math.random() * 4 + 3;
        const platform = this.levelBuilder.createPlatform(platformX, this.groundY + platformHeight, 3, 2);
        this.platforms.push(platform);
    }

    generateFloatingSpikes(xPosition) {
        // This method has been replaced by properly grounded spikes on platforms
        const platformY = this.groundY + Math.random() * 3 + 2;
        const platformWidth = Math.random() * 2 + 2;
        
        // Create a platform
        const platform = this.levelBuilder.createPlatform(xPosition, platformY, platformWidth, 1.5);
        this.platforms.push(platform);
        
        // Add a spike group on top of the platform
        const spikeCount = Math.floor(Math.random() * 2) + 3; // 3 to 4 spikes
        const spikeSpacing = 0.6;
        
        // Calculate start position to center the group on the platform
        const groupStartX = xPosition - ((spikeCount - 1) * spikeSpacing) / 2;
        
        for (let i = 0; i < spikeCount; i++) {
            const x = groupStartX + (i * spikeSpacing);
            // Place spikes directly on the platform
            const y = platformY + 0.15 + platform.height/2;
            const size = 0.7;
            
            const spike = this.levelBuilder.createSpike(x, y, size);
            this.obstacles.push(spike);
        }
    }

    generateEmptySegment(xPosition) {
        // Just add some decorative elements
        const decorCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < decorCount; i++) {
            const x = xPosition - this.levelSegmentWidth / 2 + this.levelSegmentWidth * Math.random();
            const y = Math.random() * 10 - 3;
            
            // Create a decorative element (non-collidable)
            const size = Math.random() * 1.5 + 0.5;
            const decorGeometry = new THREE.PlaneGeometry(size, size);
            const decorMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.accent,
                transparent: true,
                opacity: 0.5
            });
            
            const decoration = new THREE.Mesh(decorGeometry, decorMaterial);
            decoration.position.set(x, y, -1);
            this.scene.add(decoration);
            
            this.decorations.push(decoration);
        }
    }

    generateStairPattern(xPosition) {
        // Generate a stair pattern of platforms with more randomness
        const stepCount = Math.floor(Math.random() * 3) + 3; // 3-5 steps
        const direction = Math.random() > 0.5 ? 1 : -1; // Up or down stairs
        
        let currentHeight = direction === 1 ? 2 : 5 + Math.random() * 2;
        
        // Add more randomness to step properties
        const stepWidth = 2 + Math.random();
        const stepSpacing = 2 + Math.random() * 1.5; // Varied spacing between steps
        
        // Choose a pattern type
        const patternType = Math.floor(Math.random() * 3); // 0: standard stairs, 1: zigzag, 2: floating
        
        // Start position adjustment to center stairs in segment
        const startX = xPosition - ((stepCount - 1) * stepSpacing) / 2;
        
        for (let i = 0; i < stepCount; i++) {
            // Add some horizontal randomness
            let xOffset = 0;
            if (patternType === 1) { // Zigzag
                xOffset = (i % 2 === 0) ? -2 - Math.random() : 2 + Math.random();
            } else if (patternType === 2) { // Floating
                xOffset = (Math.random() * 4) - 2;
            }
            
            const x = startX + (i * stepSpacing) + xOffset;
            
            // Add some height randomness
            let heightOffset = 0;
            if (patternType === 2) { // More random height for floating pattern
                heightOffset = (Math.random() * 2) - 1;
            }
            
            const y = this.groundY + currentHeight + heightOffset;
            
            // Randomize platform width a bit
            const platWidth = stepWidth * (0.8 + Math.random() * 0.4);
            const platHeight = 0.8 + Math.random() * 0.4;
            
            // Create platform
            const platform = this.levelBuilder.createPlatform(x, y, platWidth, platHeight);
            this.platforms.push(platform);
            
            // Add spike on some steps (less frequently)
            if (Math.random() > 0.8) {
                const spikeCount = Math.floor(Math.random() * 2) + 1; // 1-2 spikes
                const spikeSpacing = 0.5;
                
                for (let j = 0; j < spikeCount; j++) {
                    const spikeX = x + (j - (spikeCount - 1) / 2) * spikeSpacing;
                    const spikeY = y + (platHeight / 2) + 0.05; // On top of platform
                    const spikeSize = 0.5 + Math.random() * 0.2;
                    
                    const spike = this.levelBuilder.createSpike(spikeX, spikeY, spikeSize);
                    
                    // Track that this spike is on a platform
                    spike.onPlatform = true;
                    spike.platformRef = platform;
                    spike.platformOffsetX = spikeX - x; // Offset from platform center
                    spike.platformOffsetY = (platHeight / 2) + 0.05; // Offset from platform center
                    
                    this.obstacles.push(spike);
                }
            }
            
            // Calculate next height based on pattern
            if (patternType === 0) { // Standard stairs
                currentHeight += direction * (1 + Math.random() * 0.5);
            } else if (patternType === 1) { // Zigzag
                currentHeight += (Math.random() * 1.5) * (i % 2 === 0 ? 1 : -1);
            } else { // Floating
                currentHeight += direction * (Math.random() * 2 - 0.5);
            }
        }
    }

    // CHUNK 1: Basic ground with central spikes modified to use elevated platforms
    // ====#####     #####====
    //          ^ ^ ^
    generateGroundWithCentralSpikes(xPosition) {
        const gapWidth = 6; // Width of the gap with spikes
        const platformWidth = (this.levelSegmentWidth - gapWidth) / 2; // Width of each platform
        const platformHeight = 2.5; // Elevated platforms instead of ground-level
        
        // Create left platform (elevated)
        const leftPlatform = this.levelBuilder.createPlatform(
            xPosition - gapWidth/2 - platformWidth/2, 
            this.groundY + platformHeight, 
            platformWidth, 
            1
        );
        this.platforms.push(leftPlatform);
        
        // Create right platform (elevated)
        const rightPlatform = this.levelBuilder.createPlatform(
            xPosition + gapWidth/2 + platformWidth/2, 
            this.groundY + platformHeight, 
            platformWidth, 
            1
        );
        this.platforms.push(rightPlatform);
        
        // Generate spikes in the gap
        const spikeCount = Math.floor(gapWidth / 0.8); // Space spikes evenly
        const spikeSpacing = gapWidth / spikeCount;
        
        for (let i = 0; i < spikeCount; i++) {
            const spikeX = xPosition - gapWidth/2 + (i + 0.5) * spikeSpacing;
            const spike = this.levelBuilder.createSpike(spikeX, this.groundY + 0.15, 0.7);
            this.obstacles.push(spike);
        }
    }
    
    // CHUNK 2: Elevated platform with spikes below (modified)
    //        #####
    //        #   #
    //
    //        ^^^^
    generateElevatedPlatformWithSpikes(xPosition) {
        const elevatedWidth = 7; // Width of elevated platform
        const elevatedHeight = 3; // Height of elevated platform
        
        // Create elevated platform
        const elevatedPlatform = this.levelBuilder.createPlatform(
            xPosition, 
            this.groundY + elevatedHeight, 
            elevatedWidth, 
            1.5
        );
        this.platforms.push(elevatedPlatform);
        
        // Add spikes below the elevated platform
        const spikeCount = Math.floor(elevatedWidth / 0.8) - 1; // Space for spikes
        const spikeSpacing = elevatedWidth / (spikeCount + 1);
        
        for (let i = 0; i < spikeCount; i++) {
            const spikeX = xPosition - elevatedWidth/2 + (i + 1) * spikeSpacing;
            const spike = this.levelBuilder.createSpike(spikeX, this.groundY + 0.15, 0.7);
            this.obstacles.push(spike);
        }
    }
    
    // CHUNK 3: Gap with a small floating platform (modified)
    //          ###
    //          ###
    // 
    //      ^       ^
    generateGapWithFloatingPlatform(xPosition) {
        const gapWidth = 12; // Width of the gap
        const floatingPlatformWidth = 3; // Width of the floating platform
        
        // Create floating platform in the middle
        const floatingHeight = 3.5; // Increased height
        const floatingPlatform = this.levelBuilder.createPlatform(
            xPosition, 
            this.groundY + floatingHeight, 
            floatingPlatformWidth, 
            1
        );
        this.platforms.push(floatingPlatform);
        
        // Optionally add some spikes on the ground
        if (Math.random() > 0.5) {
            // Left spike
            const spike1 = this.levelBuilder.createSpike(xPosition - 3.5, this.groundY + 0.15, 0.7);
            // Right spike
            const spike2 = this.levelBuilder.createSpike(xPosition + 3.5, this.groundY + 0.15, 0.7);
            this.obstacles.push(spike1);
            this.obstacles.push(spike2);
        }
    }
    
    // CHUNK 4: Vertical challenge or "climb" (modified)
    //     #   #
    //     #   #
    //
    // ^ ^      ^ ^
    generateVerticalChallenge(xPosition) {
        const gapWidth = 7; // Width of the central gap
        const pillarWidth = 2; // Width of the vertical pillars
        const pillarHeight = 6; // Height of vertical pillars
        
        // Create vertical pillars
        // Left pillar
        const leftPillar = this.levelBuilder.createPlatform(
            xPosition - gapWidth/2 + pillarWidth/2, 
            this.groundY + pillarHeight/2, 
            pillarWidth, 
            pillarHeight
        );
        this.platforms.push(leftPillar);
        
        // Right pillar
        const rightPillar = this.levelBuilder.createPlatform(
            xPosition + gapWidth/2 - pillarWidth/2, 
            this.groundY + pillarHeight/2, 
            pillarWidth, 
            pillarHeight
        );
        this.platforms.push(rightPillar);
        
        // Add spikes on the ground
        // Left side spikes
        for (let i = 0; i < 2; i++) {
            const spikeX = xPosition - gapWidth - 1 + i * 1.2;
            const spike = this.levelBuilder.createSpike(spikeX, this.groundY + 0.15, 0.7);
            this.obstacles.push(spike);
        }
        
        // Right side spikes
        for (let i = 0; i < 2; i++) {
            const spikeX = xPosition + gapWidth + 1 - i * 1.2;
            const spike = this.levelBuilder.createSpike(spikeX, this.groundY + 0.15, 0.7);
            this.obstacles.push(spike);
        }
    }

    update(deltaTime, gameSpeed) {
        // Update level elements
        
        // If portal doesn't exist yet and we've traveled far enough, create it
        if (!this.portalExists && this.currentLevelPosition > this.levelLength - 100) {
            this.portalExists = true;
            this.createLevelEndPortal();
        }
        
        // Update the level position based on game speed
        this.currentLevelPosition += gameSpeed * deltaTime;
    }
    
    createLevelEndPortal() {
        // Calculate portal position at the end of the level
        const portalX = this.currentLevelPosition + 50; // Place it ahead of current position
        const portalY = this.groundY + 6; // Position it 6 units above the ground
        
        // Create portal with a more visually appealing design
        const portalGroup = new THREE.Group();
        
        // Create outer ring
        const outerRingGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.accent,
            side: THREE.DoubleSide
        });
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        portalGroup.add(outerRing);
        
        // Create inner circle (portal center)
        const innerCircleGeometry = new THREE.CircleGeometry(2.8, 32);
        const innerCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
        portalGroup.add(innerCircle);
        
        // Create swirl effect
        const swirlGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const numSpirals = 2;
        const pointsPerSpiral = 50;
        
        for (let i = 0; i < numSpirals; i++) {
            const spiralOffset = (Math.PI * 2 / numSpirals) * i;
            for (let j = 0; j < pointsPerSpiral; j++) {
                const t = j / pointsPerSpiral;
                const angle = spiralOffset + t * Math.PI * 6;
                const radius = 0.3 + t * 2.3;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                vertices.push(x, y, 0.1);
            }
        }
        
        swirlGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const swirlMaterial = new THREE.LineBasicMaterial({ color: this.colors.primary || this.colors.platforms });
        const swirl = new THREE.Line(swirlGeometry, swirlMaterial);
        portalGroup.add(swirl);
        
        // Create portal glow
        const glowGeometry = new THREE.CircleGeometry(4, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.accent,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.1; // Behind the portal
        portalGroup.add(glow);
        
        // Position portal at the end of the level
        portalGroup.position.set(portalX, portalY, 0);
        this.scene.add(portalGroup);
        
        // Add portal to the level objects
        this.portalObject = portalGroup;
        
        // Add rotation animation for the portal
        const animate = () => {
            if (this.portalObject) {
                // Rotate outer ring
                outerRing.rotation.z += 0.01;
                
                // Rotate swirl in opposite direction
                swirl.rotation.z -= 0.015;
                
                // Pulse glow
                const pulseScale = 1 + 0.1 * Math.sin(performance.now() / 300);
                glow.scale.set(pulseScale, pulseScale, 1);
                
                const animationFrame = requestAnimationFrame(animate);
                this.animationFrames.push(animationFrame);
            }
        };
        const initialFrame = requestAnimationFrame(animate);
        this.animationFrames.push(initialFrame);
        
        console.log("Created portal at position:", portalX, portalY);
    }

    getFarthestObstacleX() {
        let farthestX = 0;
        
        // Check obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.x > farthestX) {
                farthestX = obstacle.x;
            }
        });
        
        // Check platforms
        this.platforms.forEach(platform => {
            if (platform.type !== 'ground' && platform.x > farthestX) {
                farthestX = platform.x;
            }
        });
        
        return farthestX;
    }

    clear() {
        // Clear all level elements
        
        // Clean up platforms
        for (const platform of this.platforms) {
            if (platform.cleanup) {
                platform.cleanup();
            }
            
            if (platform.mesh && this.scene) {
                this.scene.remove(platform.mesh);
            }
        }
        this.platforms = [];
        
        // Clean up obstacles
        for (const obstacle of this.obstacles) {
            if (obstacle.cleanup) {
                obstacle.cleanup();
            }
            
            if (obstacle.mesh && this.scene) {
                this.scene.remove(obstacle.mesh);
            }
        }
        this.obstacles = [];
        
        // Clean up decorations
        for (const decoration of this.decorations) {
            // Cancel animation frames if they exist
            if (decoration.userData && decoration.userData.animationFrame) {
                cancelAnimationFrame(decoration.userData.animationFrame);
                decoration.userData.animationFrame = null;
            }
            
            // Remove from scene
            if (this.scene) {
                this.scene.remove(decoration);
            }
            
            // Dispose of geometries and materials
            if (decoration.geometry) {
                decoration.geometry.dispose();
            }
            if (decoration.material) {
                decoration.material.dispose();
            }
        }
        this.decorations = [];
        
        // Clean up portals
        for (const portal of this.portals) {
            if (portal.cleanup) {
                portal.cleanup();
            }
            
            if (portal.mesh && this.scene) {
                this.scene.remove(portal.mesh);
            }
        }
        this.portals = [];
        
        // Reset progression
        this.completedDistance = 0;
        this.isCompleted = false;
    }

    getAllObstacles() {
        return this.obstacles;
    }

    getAllPlatforms() {
        return this.platforms;
    }

    getAllPortals() {
        return this.portals;
    }
} 