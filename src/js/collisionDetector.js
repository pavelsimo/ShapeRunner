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
                
                // Check if the platform is a jump pad
                if (platform.isJumpPad) {
                    // Apply a stronger jump force
                    this.player.velocity.y = platform.jumpForce || this.player.jumpForce * 1.5;
                    this.player.isJumping = true;
                    this.player.onPlatform = false;
                    
                    // Create jump pad effect
                    this.createJumpPadEffect(platform.x, platformTop);
                } else {
                    // Reset vertical velocity for normal platforms
                    this.player.velocity.y = 0;
                    this.player.isJumping = false;
                    
                    // Maintain 45 degree rotation, don't reset it
                    this.player.mesh.rotation.z = Math.PI / 4;
                    
                    // Signal to the player that they are on a platform
                    this.player.onPlatform = true;
                }
                
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
        
        // Check collectibles if they exist
        if (this.level.collectibles && this.level.collectibles.length > 0) {
            this.checkCollectibles(playerHitbox);
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
        // Early return if no portal exists
        if (!this.level.portalExists) return false;
        
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
        
        // Store the last check time to avoid multiple triggers
        const now = performance.now();
        if (!this.lastPortalCheck) this.lastPortalCheck = 0;
        
        // Check if player is close enough to the portal
        // Increased detection radius and reduced cooldown for more reliable portal detection
        if (distance < 4.0 && now - this.lastPortalCheck > 500) {
            console.log("Portal collision detected! Distance:", distance);
            this.lastPortalCheck = now;
            
            // Show a message that the portal is being entered
            if (this.level.game && this.level.game.ui) {
                this.level.game.ui.showLevelMessage("ENTERING PORTAL", 1000);
            }
            
            // Return true to trigger portal collision in game update
            return true;
        }
        
        return false;
    }

    /**
     * Create a visual effect when the player activates a jump pad
     * @param {number} x - X position of the jump pad
     * @param {number} y - Y position of the jump pad top
     */
    createJumpPadEffect(x, y) {
        // Create particles shooting up from the jump pad
        const particleCount = 15;
        const particles = new THREE.Group();
        
        // Use theme accent color instead of hardcoded yellow
        const particleColor = this.level.colors ? this.level.colors.accent : 0xFFFF00;
        
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshBasicMaterial({
                color: particleColor,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Position particles around jump pad
            particle.position.x = x + (Math.random() * 2 - 1);
            particle.position.y = y;
            particle.position.z = 0.2;
            
            // Random upward velocity
            particle.userData.velocity = {
                x: Math.random() * 2 - 1,
                y: Math.random() * 5 + 5
            };
            
            // Life span
            particle.userData.life = 1.0;
            particle.userData.decay = Math.random() * 0.2 + 0.3;
            
            particles.add(particle);
        }
        
        this.level.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            let allDead = true;
            
            particles.children.forEach(particle => {
                // Move particle
                particle.position.x += particle.userData.velocity.x * 0.1;
                particle.position.y += particle.userData.velocity.y * 0.1;
                
                // Slow down vertical velocity
                particle.userData.velocity.y -= 0.2;
                
                // Decay life
                particle.userData.life -= particle.userData.decay * 0.1;
                
                // Update opacity
                particle.material.opacity = particle.userData.life;
                
                if (particle.userData.life > 0) {
                    allDead = false;
                }
            });
            
            // Continue animation if particles are still alive
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                // Remove particles from scene
                this.level.scene.remove(particles);
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        animateParticles();
    }
    
    /**
     * Check collisions with collectible items
     * @param {Object} playerHitbox - The player's hitbox
     */
    checkCollectibles(playerHitbox) {
        for (let i = 0; i < this.level.collectibles.length; i++) {
            const collectible = this.level.collectibles[i];
            
            // Skip already collected items
            if (collectible.collected) continue;
            
            // Check for collision
            if (this.rectanglesIntersect(playerHitbox, collectible)) {
                // Mark as collected
                collectible.collected = true;
                
                // Remove from scene
                this.level.scene.remove(collectible.mesh);
                
                // Handle different collectible types
                switch (collectible.type) {
                    case 'coin':
                        // Increase score
                        this.level.game.distance += collectible.value;
                        this.createCollectEffect(collectible.x, collectible.y, 0xFFD700);
                        break;
                        
                    case 'key':
                        // Collect key - in a more complex game, this would unlock something
                        this.level.hasKey = true;
                        this.createCollectEffect(collectible.x, collectible.y, 0xFFFF00);
                        break;
                }
            }
        }
    }
    
    /**
     * Create a collection effect when collecting an item
     * @param {number} x - X position of the collectible
     * @param {number} y - Y position of the collectible
     * @param {number} color - Color of the effect
     */
    createCollectEffect(x, y, color) {
        // Create a burst of particles
        const particleCount = 12;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Calculate angle for circular burst
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = Math.random() * 2 + 2;
            
            // Position particles at collectible location
            particle.position.x = x;
            particle.position.y = y;
            particle.position.z = 0.2;
            
            // Velocity in circle pattern
            particle.userData.velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // Life span
            particle.userData.life = 1.0;
            particle.userData.decay = Math.random() * 0.05 + 0.05;
            
            particles.add(particle);
        }
        
        this.level.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            let allDead = true;
            
            particles.children.forEach(particle => {
                // Move particle
                particle.position.x += particle.userData.velocity.x * 0.1;
                particle.position.y += particle.userData.velocity.y * 0.1;
                
                // Slow down
                particle.userData.velocity.x *= 0.95;
                particle.userData.velocity.y *= 0.95;
                
                // Decay life
                particle.userData.life -= particle.userData.decay;
                
                // Update opacity and scale based on life
                particle.material.opacity = particle.userData.life;
                particle.scale.set(
                    particle.userData.life * 2, 
                    particle.userData.life * 2, 
                    1
                );
                
                if (particle.userData.life > 0) {
                    allDead = false;
                }
            });
            
            // Continue animation if particles are still alive
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                // Remove particles from scene
                this.level.scene.remove(particles);
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        animateParticles();
    }

    checkCollectibleCollisions() {
        const player = this.player.mesh;
        const collectibles = this.level.collectibles;
        
        // Early exit if there are no collectibles
        if (!collectibles || collectibles.length === 0) return;
        
        const collectibleRadius = 0.5; // Approximate radius of collectible
        const playerRadius = 0.5; // Approximate radius of player
        
        // Array to track which collectibles need to be removed
        const toRemove = [];
        
        // Check each collectible for collision with player
        collectibles.forEach((collectible, index) => {
            // Skip if collectible is already marked for removal
            if (collectible.markedForRemoval) return;
            
            // Get positions
            const playerX = player.position.x;
            const playerY = player.position.y;
            const collectibleX = collectible.position.x;
            const collectibleY = collectible.position.y;
            
            // Calculate distance between player and collectible (2D for simplicity)
            const dx = playerX - collectibleX;
            const dy = playerY - collectibleY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If distance is less than sum of radii, collision occurred
            if (distance < (playerRadius + collectibleRadius)) {
                console.log("Collectible collected!");
                
                // Mark collectible for removal
                collectible.markedForRemoval = true;
                toRemove.push(index);
                
                // Create collection effect
                this.createCollectionEffect(collectible.position);
                
                // Update level collected items count
                this.level.collectedItems++;
                
                // Update game score if game reference exists
                if (this.level.game) {
                    this.level.game.score += 100;
                    this.level.game.updateScoreDisplay();
                    
                    // Show temporary score popup if UI exists
                    if (this.level.game.ui) {
                        this.level.game.ui.showScorePopup("+100", collectible.position);
                    }
                }
                
                // Check if all items are collected, make portal appear if it doesn't exist yet
                if (this.level.collectedItems === this.level.totalItems && !this.level.portalExists) {
                    console.log("All items collected! Creating portal...");
                    this.level.createPortal(15, 15, 0.5);
                    
                    if (this.level.game && this.level.game.ui) {
                        this.level.game.ui.showLevelMessage("PORTAL OPENED!", 2000);
                    }
                }
            }
        });
        
        // Remove collected items from scene and array (in reverse order to avoid index issues)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const index = toRemove[i];
            const collectible = collectibles[index];
            
            // Remove from scene
            this.level.scene.remove(collectible);
            
            // Dispose of geometry and material
            if (collectible.geometry) collectible.geometry.dispose();
            if (collectible.material) collectible.material.dispose();
            
            // Remove from array
            collectibles.splice(index, 1);
        }
        
        return toRemove.length > 0; // Return true if any collectibles were collected
    }

    createCollectionEffect(position) {
        // Simple visual feedback for collection
        // This would typically be a particle effect, but we'll just log for now
        console.log("Collection effect at", position);
    }
} 