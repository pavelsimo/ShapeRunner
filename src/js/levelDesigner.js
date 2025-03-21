import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class LevelDesigner {
    constructor(level) {
        this.level = level;
        
        // Define ASCII representations for different platform types
        this.platformMap = {
            // Empty space
            '.': null, // No platform
            
            // Basic tiles
            'B': 'platform',      // Solid Block
            '^': 'spike',         // Spike
            '/': 'slope_up',      // Slope Up
            'J': 'jump_pad',      // Jump Pad
            'C': 'coin',          // Coin
            'P': 'portal',        // Portal
            'K': 'key',           // Key
            'O': 'saw',           // Saw Blade
            'S': 'start',         // Start position
            'E': 'end',           // End position
            
            // Legacy mappings for backwards compatibility
            '#': 'platform',      // Old platform notation
            'Z': 'zigzag',        // Zigzag platforms
            'G': 'central_spikes' // Ground with central spikes
        };
        
        // Define height levels (0-9 represents height from ground)
        this.heightLevels = {
            '0': 0,    // Ground level
            '1': 1,    // 1 unit above ground
            '2': 2,    // 2 units above ground
            '3': 3,    // 3 units above ground
            '4': 4,    // 4 units above ground
            '5': 5,    // 5 units above ground
            '6': 6,    // 6 units above ground
            '7': 7,    // 7 units above ground
            '8': 8,    // 8 units above ground
            '9': 9     // 9 units above ground
        };
    }
    
    /**
     * Generate a level from ASCII representation
     * @param {string} asciiMap - The ASCII map with each line representing a row
     * @param {number} segmentWidth - Width of each segment in game units
     */
    generateFromASCII(asciiMap, segmentWidth = 30) {
        // Split the ASCII map into lines
        const lines = asciiMap.trim().split('\n');
        
        // Determine the tallest line for proper alignment
        let maxLength = 0;
        for (const line of lines) {
            maxLength = Math.max(maxLength, line.length);
        }
        
        // Pad shorter lines with empty spaces for consistent alignment
        const paddedLines = lines.map(line => line.padEnd(maxLength, '.'));
        
        // Process each column (which represents a segment of the level)
        for (let col = 0; col < maxLength; col++) {
            // For each column, process all rows to build a complete segment
            this.generateSegmentFromColumn(paddedLines, col, segmentWidth);
        }
    }
    
    /**
     * Generate a segment from a single column in the ASCII map
     * @param {Array<string>} paddedLines - The padded ASCII map lines
     * @param {number} col - The column index
     * @param {number} segmentWidth - Width of the segment
     */
    generateSegmentFromColumn(paddedLines, col, segmentWidth) {
        const segmentX = this.level.currentLevelPosition + segmentWidth / 2;
        let segmentGenerated = false;
        
        // Check for special pattern segments first
        if (this.checkForSpecialPattern(paddedLines, col, segmentX)) {
            segmentGenerated = true;
        } else {
            // Process individual elements in the column
            for (let row = 0; row < paddedLines.length; row++) {
                const char = paddedLines[row][col];
                const nextChar = (col + 1 < paddedLines[0].length) ? paddedLines[row][col + 1] : '.';
                
                // Reverse the row index so the bottom row is the ground
                const reversedRow = paddedLines.length - 1 - row;
                
                if (char !== '.') {
                    // Generate the element based on the ASCII character
                    this.generateElement(char, nextChar, segmentX, reversedRow, segmentWidth);
                    segmentGenerated = true;
                }
            }
        }
        
        // If nothing was generated, create an empty segment
        if (!segmentGenerated) {
            // Empty segment - just advance the position
            this.level.currentLevelPosition += segmentWidth;
        }
    }
    
    /**
     * Check for special multi-character patterns
     * @param {Array<string>} paddedLines - The padded ASCII map lines
     * @param {number} col - The column index
     * @param {number} segmentX - The x-position for the segment
     * @returns {boolean} - Whether a special pattern was found and generated
     */
    checkForSpecialPattern(paddedLines, col, segmentX) {
        // Look for zigzag pattern
        if (this.findPattern(paddedLines, col, ['Z', 'Z'])) {
            this.level.generateZigzagPlatforms(segmentX);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        // Look for stair up pattern
        if (this.findPattern(paddedLines, col, ['/', '/'])) {
            this.generateStairPattern(segmentX, 1);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        // Look for stair down pattern
        if (this.findPattern(paddedLines, col, ['\\', '\\'])) {
            this.generateStairPattern(segmentX, -1);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        // Look for central spikes pattern
        if (this.findPattern(paddedLines, col, ['G', 'G'])) {
            this.level.generateGroundWithCentralSpikes(segmentX);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        // Look for elevated platform with spikes
        if (this.findPattern(paddedLines, col, ['E', 'E'])) {
            this.level.generateElevatedPlatformWithSpikes(segmentX);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        // Look for floating platform pattern
        if (this.findPattern(paddedLines, col, ['F', 'F'])) {
            this.level.generateGapWithFloatingPlatform(segmentX);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        // Look for vertical challenge pattern
        if (this.findPattern(paddedLines, col, ['V', 'V'])) {
            this.level.generateVerticalChallenge(segmentX);
            this.level.currentLevelPosition += this.level.levelSegmentWidth;
            return true;
        }
        
        return false;
    }
    
    /**
     * Find a specific pattern in the ASCII map
     * @param {Array<string>} paddedLines - The padded ASCII map lines
     * @param {number} col - The column index
     * @param {Array<string>} pattern - The pattern to find
     * @returns {boolean} - Whether the pattern was found
     */
    findPattern(paddedLines, col, pattern) {
        // Check if there's enough columns left to check for the pattern
        if (col + pattern.length > paddedLines[0].length) return false;
        
        // Check for the pattern in any row
        for (let row = 0; row < paddedLines.length; row++) {
            let matches = true;
            for (let i = 0; i < pattern.length; i++) {
                if (paddedLines[row][col + i] !== pattern[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) return true;
        }
        
        return false;
    }
    
    /**
     * Generate a specific element based on ASCII character
     * @param {string} char - The ASCII character
     * @param {string} nextChar - The next ASCII character (for height info)
     * @param {number} segmentX - The x-position for the segment
     * @param {number} row - The row index (height)
     * @param {number} segmentWidth - Width of the segment
     */
    generateElement(char, nextChar, segmentX, row, segmentWidth) {
        const elementType = this.platformMap[char];
        
        if (!elementType) {
            // No element to generate
            return;
        }
        
        // Determine height based on next character if it's a number
        let height = row;
        if (nextChar in this.heightLevels) {
            height = this.heightLevels[nextChar];
        }
        
        // Scale height to match game units
        const scaledHeight = this.level.groundY + height + 1;
        
        switch (elementType) {
            case 'platform':
                // Regular platform/solid block
                const platform = this.level.levelBuilder.createPlatform(
                    segmentX,
                    scaledHeight,
                    segmentWidth * 0.8,
                    1
                );
                this.level.platforms.push(platform);
                this.level.currentLevelPosition += segmentWidth;
                break;
                
            case 'spike':
                // Ground spike
                const spike = this.level.levelBuilder.createSpike(
                    segmentX,
                    this.level.groundY + 0.15,
                    0.7
                );
                this.level.obstacles.push(spike);
                this.level.currentLevelPosition += segmentWidth / 4; // Spikes are smaller
                break;
                
            case 'slope_up':
                // Upward slope
                // Creating a series of small platforms in ascending order for the effect
                const slopeWidth = segmentWidth * 0.8;
                const slopeHeight = 1;
                const sections = 5; // Number of small platforms to create the slope
                
                for (let i = 0; i < sections; i++) {
                    const sectionX = segmentX - slopeWidth/2 + (i * slopeWidth/sections) + (slopeWidth/sections/2);
                    const sectionY = scaledHeight + (i * slopeHeight/sections);
                    const sectionWidth = slopeWidth/sections * 1.2; // Slight overlap
                    
                    const slopePlatform = this.level.levelBuilder.createPlatform(
                        sectionX,
                        sectionY,
                        sectionWidth,
                        0.2
                    );
                    this.level.platforms.push(slopePlatform);
                }
                
                this.level.currentLevelPosition += segmentWidth;
                break;
                
            case 'jump_pad':
                // Jump pad - creates a platform with a bounce effect
                const jumpPadSize = segmentWidth * 0.4;
                const jumpPadHeight = 0.4;
                
                // Create visual for the jump pad
                const jumpPad = this.level.levelBuilder.createPlatform(
                    segmentX,
                    scaledHeight,
                    jumpPadSize,
                    jumpPadHeight
                );
                
                // Mark it as a jump pad
                jumpPad.isJumpPad = true;
                jumpPad.jumpForce = 25; // Higher than default jump
                
                // Change color to indicate it's a jump pad
                if (jumpPad.mesh && jumpPad.mesh.children) {
                    jumpPad.mesh.children.forEach(child => {
                        if (child.material && child.material.color) {
                            child.material.color.set(this.level.colors.accent);
                        }
                    });
                }
                
                this.level.platforms.push(jumpPad);
                this.level.currentLevelPosition += segmentWidth / 2;
                break;
                
            case 'coin':
                // Collectible coin
                // Create a simple coin object
                const coinSize = 0.7;
                const coinGeometry = new THREE.CircleGeometry(coinSize/2, 16);
                const coinMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFFD700, // Gold color
                    side: THREE.DoubleSide
                });
                
                const coin = new THREE.Mesh(coinGeometry, coinMaterial);
                coin.position.set(segmentX, scaledHeight, 0);
                
                // Add some glow effect
                const coinGlowGeometry = new THREE.CircleGeometry(coinSize/2 * 1.3, 16);
                const coinGlowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFFD700,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                });
                
                const coinGlow = new THREE.Mesh(coinGlowGeometry, coinGlowMaterial);
                coinGlow.position.z = -0.01;
                
                const coinGroup = new THREE.Group();
                coinGroup.add(coin);
                coinGroup.add(coinGlow);
                
                // Add rotation animation
                const animate = () => {
                    if (coinGroup.parent) {
                        coinGroup.rotation.z += 0.02;
                        requestAnimationFrame(animate);
                    }
                };
                animate();
                
                this.level.scene.add(coinGroup);
                
                // Add coin to collectibles
                if (!this.level.collectibles) {
                    this.level.collectibles = [];
                }
                
                this.level.collectibles.push({
                    mesh: coinGroup,
                    x: segmentX,
                    y: scaledHeight,
                    width: coinSize,
                    height: coinSize,
                    type: 'coin',
                    value: 100,
                    collected: false
                });
                
                this.level.currentLevelPosition += segmentWidth / 3;
                break;
                
            case 'portal':
                // End portal
                const portal = this.level.levelBuilder.createPortal(
                    segmentX,
                    scaledHeight,
                    4 // Portal size
                );
                this.level.portals.push(portal);
                this.level.portalExists = true;
                this.level.portalObject = portal.mesh;
                this.level.currentLevelPosition += segmentWidth;
                break;
                
            case 'key':
                // Key collectible (required to unlock the portal)
                const keySize = 1;
                const keyGeometry = new THREE.PlaneGeometry(keySize, keySize * 1.5);
                const keyMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFFFF00, // Yellow
                    transparent: true,
                    opacity: 0.9
                });
                
                const key = new THREE.Mesh(keyGeometry, keyMaterial);
                key.position.set(segmentX, scaledHeight, 0);
                
                // Add glow effect
                const keyGlowGeometry = new THREE.PlaneGeometry(keySize * 1.5, keySize * 2);
                const keyGlowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFFFF00,
                    transparent: true,
                    opacity: 0.3
                });
                
                const keyGlow = new THREE.Mesh(keyGlowGeometry, keyGlowMaterial);
                keyGlow.position.z = -0.01;
                
                const keyGroup = new THREE.Group();
                keyGroup.add(key);
                keyGroup.add(keyGlow);
                
                // Add floating animation
                let floatDirection = 1;
                const animateKey = () => {
                    if (keyGroup.parent) {
                        keyGroup.position.y += 0.01 * floatDirection;
                        if (keyGroup.position.y > scaledHeight + 0.3) floatDirection = -1;
                        if (keyGroup.position.y < scaledHeight - 0.3) floatDirection = 1;
                        requestAnimationFrame(animateKey);
                    }
                };
                animateKey();
                
                this.level.scene.add(keyGroup);
                
                // Add key to collectibles
                if (!this.level.collectibles) {
                    this.level.collectibles = [];
                }
                
                this.level.collectibles.push({
                    mesh: keyGroup,
                    x: segmentX,
                    y: scaledHeight,
                    width: keySize,
                    height: keySize * 1.5,
                    type: 'key',
                    value: 0, // Keys don't give score, but unlock the portal
                    collected: false
                });
                
                this.level.currentLevelPosition += segmentWidth / 2;
                break;
                
            case 'saw':
                // Saw blade obstacle
                if (this.level.levelBuilder.createSawBlade) {
                    const saw = this.level.levelBuilder.createSawBlade(
                        segmentX,
                        scaledHeight,
                        2 // Saw size
                    );
                    this.level.obstacles.push(saw);
                }
                this.level.currentLevelPosition += segmentWidth / 3;
                break;
                
            case 'start':
                // Player start position
                this.level.startPosition = {
                    x: segmentX,
                    y: scaledHeight + 1 // Place player above this position
                };
                this.level.currentLevelPosition += segmentWidth;
                break;
                
            case 'end':
                // End position (creates a portal)
                const endPortal = this.level.levelBuilder.createPortal(
                    segmentX,
                    scaledHeight,
                    4 // Portal size
                );
                this.level.portals.push(endPortal);
                this.level.portalExists = true;
                this.level.portalObject = endPortal.mesh;
                this.level.currentLevelPosition += segmentWidth;
                break;
                
            default:
                // Unknown element, just advance position
                this.level.currentLevelPosition += segmentWidth / 4;
                break;
        }
    }
    
    /**
     * Generate stair pattern with specified direction
     * @param {number} segmentX - The x-position for the segment
     * @param {number} direction - Direction (1 for up, -1 for down)
     */
    generateStairPattern(segmentX, direction) {
        const stepCount = Math.floor(Math.random() * 3) + 3; // 3-5 steps
        const stepWidth = 2 + Math.random();
        const stepSpacing = 2 + Math.random() * 1.5;
        
        // Calculate starting height based on direction
        let currentHeight = direction === 1 ? 2 : 5 + Math.random() * 2;
        
        // Start position to center stairs in segment
        const startX = segmentX - ((stepCount - 1) * stepSpacing) / 2;
        
        for (let i = 0; i < stepCount; i++) {
            const x = startX + (i * stepSpacing);
            const y = this.level.groundY + currentHeight;
            
            // Create platform
            const platform = this.level.levelBuilder.createPlatform(
                x, y, stepWidth, 1
            );
            this.level.platforms.push(platform);
            
            // Occasionally add a spike
            if (Math.random() > 0.8) {
                const spike = this.level.levelBuilder.createSpike(
                    x, y + 0.6, 0.6
                );
                
                // Track that this spike is on a platform
                spike.onPlatform = true;
                spike.platformRef = platform;
                spike.platformOffsetX = 0;
                spike.platformOffsetY = 0.6;
                
                this.level.obstacles.push(spike);
            }
            
            // Calculate next height
            currentHeight += direction * (1 + Math.random() * 0.5);
        }
    }
} 