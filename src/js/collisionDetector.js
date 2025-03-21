import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class CollisionDetector {
    constructor(player, level) {
        this.player = player;
        this.level = level;
    }

    checkCollisions() {
        // Get player hitbox
        const playerHitbox = this.player.getHitbox();
        
        // Reset player platform state at the beginning of collision checks
        this.player.onPlatform = false;
        
        // First check for platform collisions
        const collisionResult = this.checkPlatformCollisions();
        if (collisionResult) {
            // Handle each type of collision
            if (collisionResult.side === 'top') {
                // Player landed on top of a platform
                const platform = collisionResult.platform;
                const platformTop = platform.y + platform.height / 2;
                
                // Position player exactly on top of platform - no buffer needed
                const newY = platformTop + this.player.hitbox.height / 2;
                this.player.mesh.position.y = newY;
                this.player.position.y = newY;
                
                // Reset vertical velocity
                this.player.velocity.y = 0;
                this.player.isJumping = false;
                this.player.mesh.rotation.z = 0; // Reset rotation when on platform
                
                // Signal to the player that they are on a platform
                this.player.onPlatform = true;
                
                // Check if the player is near the edge of the platform
                const playerCenter = this.player.mesh.position.x;
                const platformLeft = platform.x - platform.width / 2;
                const platformRight = platform.x + platform.width / 2;
                const edgeThreshold = this.player.hitbox.width * 0.3; // Reduced to allow better edge handling
                
                // If the player is too close to the edge, they should fall off
                if (playerCenter < platformLeft + edgeThreshold || 
                    playerCenter > platformRight - edgeThreshold) {
                    this.player.onPlatform = false;
                }
            } 
            else if (collisionResult.side === 'bottom') {
                // Player hit the bottom of a platform
                const platform = collisionResult.platform;
                const platformBottom = platform.y - platform.height / 2;
                
                // Position player exactly below the platform
                const newY = platformBottom - this.player.hitbox.height / 2;
                this.player.mesh.position.y = newY;
                this.player.position.y = newY;
                
                // Stop upward movement
                this.player.velocity.y = Math.min(0, this.player.velocity.y * 0.5); // Add a bounce effect
            }
            else if (collisionResult.side === 'left' || collisionResult.side === 'right') {
                // Horizontal collision - push player away from platform
                const platform = collisionResult.platform;
                const pushDirection = collisionResult.side === 'left' ? -1 : 1;
                const platformEdge = collisionResult.side === 'left' ? 
                    platform.x - platform.width / 2 : 
                    platform.x + platform.width / 2;
                    
                // Position player exactly beside the platform
                const newX = platformEdge + pushDirection * this.player.hitbox.width / 2;
                this.player.mesh.position.x = newX;
                this.player.position.x = newX;
            }
            
            // No death from platform collisions
            return false;
        }
        
        // Check collisions with obstacles (spikes, etc.)
        const obstacles = this.level.getAllObstacles();
        for (const obstacle of obstacles) {
            if (this.checkRectCollision(playerHitbox, obstacle)) {
                return true; // Collision detected with hazard
            }
        }
        
        // No collisions detected
        return false;
    }

    checkRectCollision(rect1, rect2) {
        // Check if two rectangles overlap
        // rect1 is the player hitbox
        // rect2 is an obstacle or platform
        
        // For spike collision, use a more forgiving hitbox
        if (rect2.type === 'spike') {
            // Smaller hitbox for spikes (more forgiving)
            const spikeHitbox = {
                x: rect2.x - rect2.width * 0.3,
                y: rect2.y,
                width: rect2.width * 0.6,
                height: rect2.height * 0.7
            };
            
            return this.rectanglesIntersect(rect1, spikeHitbox);
        } else if (rect2.type === 'saw') {
            // Use circular hitbox for saw blades
            const sawCenter = {
                x: rect2.x,
                y: rect2.y
            };
            
            const playerCenter = {
                x: rect1.x + rect1.width / 2,
                y: rect1.y + rect1.height / 2
            };
            
            const distance = Math.sqrt(
                Math.pow(sawCenter.x - playerCenter.x, 2) +
                Math.pow(sawCenter.y - playerCenter.y, 2)
            );
            
            // If the distance is less than the sum of the radii, there's a collision
            return distance < (rect2.width * 0.4 + rect1.width / 2);
        } else if (rect2.type === 'portal') {
            // Portals aren't obstacles - they trigger effects
            // For this implementation, we'll just pass through them
            return false;
        }
        
        // Default rectangle collision check
        return this.rectanglesIntersect(rect1, rect2);
    }

    rectanglesIntersect(rect1, rect2) {
        // Check if two rectangles intersect
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect2.x + rect2.width < rect1.x ||
            rect1.y + rect1.height < rect2.y ||
            rect2.y + rect2.height < rect1.y
        );
    }

    checkPlatformCollisions() {
        // Get player hitbox and velocity
        const playerHitbox = this.player.getHitbox();
        const playerVelocity = this.player.velocity;
        
        // Previous position (approximate) - important for determining landing
        const prevPlayerY = playerHitbox.y - playerVelocity.y * 0.016; // Based on previous frame
        const prevPlayerBottom = prevPlayerY + playerHitbox.height;
        
        // Get the player's current sides
        const playerLeft = playerHitbox.x;
        const playerRight = playerHitbox.x + playerHitbox.width;
        const playerTop = playerHitbox.y;
        const playerBottom = playerHitbox.y + playerHitbox.height;
        
        // Check all platforms
        const platforms = this.level.getAllPlatforms();
        
        for (const platform of platforms) {
            // Skip ground platform for side collisions (always allow movement on ground)
            if (platform.type === 'ground') continue;
            
            // Calculate platform boundaries
            const platformLeft = platform.x - platform.width / 2;
            const platformRight = platform.x + platform.width / 2;
            const platformTop = platform.y + platform.height / 2;
            const platformBottom = platform.y - platform.height / 2;
            
            // Special case: If the player was above the platform in the previous frame
            // and is now intersecting or very close to the top, treat it as a landing
            const landingThreshold = 0.1; // Close enough to consider landing
            if (prevPlayerBottom <= platformTop + landingThreshold && 
                playerBottom >= platformTop - landingThreshold &&
                playerRight > platformLeft && 
                playerLeft < platformRight) {
                
                return {
                    platform: platform,
                    side: 'top'
                };
            }
            
            // Check for AABB collision
            if (playerRight > platformLeft && 
                playerLeft < platformRight && 
                playerBottom > platformBottom && 
                playerTop < platformTop) {
                
                // Calculate overlap on each axis
                const overlapLeft = playerRight - platformLeft;
                const overlapRight = platformRight - playerLeft;
                const overlapTop = playerBottom - platformTop;
                const overlapBottom = platformTop - playerTop;
                
                // Determine the collision side based on the smallest overlap
                // and the direction of movement
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                // Prefer vertical collision when falling onto a platform
                if (minOverlap === overlapTop && playerVelocity.y >= 0) {
                    // Top collision - player landing on platform
                    return {
                        platform: platform,
                        side: 'top'
                    };
                } else if (minOverlap === overlapBottom && playerVelocity.y < 0) {
                    // Bottom collision - player hitting platform from below
                    return {
                        platform: platform,
                        side: 'bottom'
                    };
                } else if (minOverlap === overlapLeft) {
                    // Left collision - player hitting left side of platform
                    return {
                        platform: platform,
                        side: 'left'
                    };
                } else if (minOverlap === overlapRight) {
                    // Right collision - player hitting right side of platform
                    return {
                        platform: platform,
                        side: 'right'
                    };
                }
            }
        }
        
        // No collisions
        return null;
    }

    checkPortalCollision() {
        // Early return if no portal or level is already completed
        if (!this.level.portalExists || this.level.isLevelCompleted) return false;
        
        const player = this.player.mesh;
        const portal = this.level.portalObject;
        
        if (!portal) return false;
        
        // Get player position
        const playerX = player.position.x;
        const playerY = player.position.y;
        
        // Get portal position
        const portalX = portal.position.x;
        const portalY = portal.position.y;
        
        // Calculate distance between player and portal
        const dx = playerX - portalX;
        const dy = playerY - portalY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player is close enough to the portal (within 3 units)
        if (distance < 3) {
            // Set level as completed
            this.level.isLevelCompleted = true;
            return true;
        }
        
        return false;
    }
} 