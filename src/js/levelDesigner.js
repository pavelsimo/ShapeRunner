export class LevelDesigner {
    constructor(level) {
        this.level = level;
        
        // Define ASCII representations for different platform types
        this.platformMap = {
            // Empty space
            '.': null, // No platform
            
            // Basic platforms
            '#': 'platform',         // Regular platform
            '=': 'ground',           // Ground-level platform
            '^': 'spike',            // Ground spike
            
            // Platform combinations
            '/': 'stair_up',         // Upward stair
            '\\': 'stair_down',      // Downward stair
            'Z': 'zigzag',           // Zigzag platforms
            
            // Geometry Dash patterns
            'G': 'central_spikes',   // Ground with central spikes
            'E': 'elevated_spikes',  // Elevated platform with spikes below
            'F': 'floating_platform', // Gap with floating platform
            'V': 'vertical_challenge', // Vertical pillar challenge
            
            // Special elements
            'P': 'portal',           // End portal
            'S': 'saw',              // Saw blade obstacle
            'D': 'decoration'        // Decorative element
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
                // Regular platform
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
                
            case 'saw':
                // Saw blade
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
                
            case 'decoration':
                // Decorative element
                const size = Math.random() * 1.5 + 0.5;
                const decorGeometry = new THREE.PlaneGeometry(size, size);
                const decorMaterial = new THREE.MeshBasicMaterial({
                    color: this.level.colors.accent,
                    transparent: true,
                    opacity: 0.5
                });
                
                const decoration = new THREE.Mesh(decorGeometry, decorMaterial);
                decoration.position.set(segmentX, scaledHeight, -1);
                this.level.scene.add(decoration);
                this.level.decorations.push(decoration);
                this.level.currentLevelPosition += segmentWidth / 4;
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