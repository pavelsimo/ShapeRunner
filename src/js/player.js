export class Player {
    constructor(scene, colorScheme) {
        this.scene = scene;
        this.colors = colorScheme;
        
        // Player properties
        this.size = 1;
        this.gravity = 25;
        this.jumpForce = 17;
        this.isJumping = false;
        this.onPlatform = false; // Track if player is standing on a platform
        this.onGround = false; // Track if player is on the ground
        this.velocity = { x: 0, y: 0 };
        this.position = { x: 0, y: 0 };
        this.rotation = 0;
        this.maxVelocity = 30; // Maximum falling speed
        this.groundLevel = -8; // Y position of the ground
        
        // Initial position
        this.startX = -5;
        this.startY = 3;
    }

    create() {
        // Create player mesh - a neon outlined square with Tron-like glow
        const outerGeometry = new THREE.PlaneGeometry(this.size, this.size);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.player,
            transparent: false,
            opacity: 1
        });
        this.outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
        
        // Create inner square (slightly smaller)
        const innerGeometry = new THREE.PlaneGeometry(this.size * 0.7, this.size * 0.7);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        this.innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
        
        // Create innermost square (for accent)
        const accentGeometry = new THREE.PlaneGeometry(this.size * 0.4, this.size * 0.4);
        const accentMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.accent,
            transparent: true,
            opacity: 1
        });
        this.accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
        
        // Create edge outline for Tron effect
        const edgesGeometry = new THREE.EdgesGeometry(outerGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff, // Bright white for Tron effect
            linewidth: 2, // Reduced from 3
            transparent: true,
            opacity: 0.9
        });
        this.edgesMesh = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.edgesMesh.position.z = 0.01;
        
        // Create primary glow effect (reduced from 1.3)
        const glowGeometry = new THREE.PlaneGeometry(this.size * 1.2, this.size * 1.2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.player,
            transparent: true,
            opacity: 0.3, // Reduced from 0.4
            side: THREE.DoubleSide
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.position.z = -0.01;
        
        // Create outer glow for more intense effect (reduced from 1.6)
        const outerGlowGeometry = new THREE.PlaneGeometry(this.size * 1.35, this.size * 1.35);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.player,
            transparent: true,
            opacity: 0.15, // Reduced from 0.2
            side: THREE.DoubleSide
        });
        this.outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.outerGlowMesh.position.z = -0.02;
        
        // Group all player elements
        this.mesh = new THREE.Group();
        this.mesh.add(this.outerGlowMesh);
        this.mesh.add(this.glowMesh);
        this.mesh.add(this.outerMesh);
        this.mesh.add(this.innerMesh);
        this.mesh.add(this.accentMesh);
        this.mesh.add(this.edgesMesh);
        
        // Set initial position
        this.mesh.position.set(this.startX, this.startY, 0);
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create hitbox for collision detection (slightly smaller than visual)
        this.hitbox = {
            width: this.size * 0.9,
            height: this.size * 0.9
        };
        
        // Setup animation data for glow effect
        this.glowIntensity = 1.0;
        this.glowDirection = 1;
        this.animationFrame = null;
        
        // Start the glow animation
        this.animateGlow();
    }

    animateGlow() {
        // Pulse the glow intensity
        this.glowIntensity += 0.015 * this.glowDirection;
        
        // Reverse direction at limits
        if (this.glowIntensity > 1.3) {
            this.glowDirection = -1;
        } else if (this.glowIntensity < 0.7) {
            this.glowDirection = 1;
        }
        
        // Update glow opacity based on intensity
        if (this.glowMesh) {
            this.glowMesh.material.opacity = 0.3 * this.glowIntensity;
        }
        if (this.outerGlowMesh) {
            this.outerGlowMesh.material.opacity = 0.15 * this.glowIntensity;
        }
        
        // Continue animation
        this.animationFrame = requestAnimationFrame(() => this.animateGlow());
    }

    update(deltaTime) {
        // Calculate and apply gravity
        if (!this.onPlatform) {
            this.velocity.y -= this.gravity * deltaTime;
            // Clamp velocity to prevent excessive speed
            this.velocity.y = Math.max(this.velocity.y, -this.maxVelocity);
        } else {
            // When on a platform, ensure vertical velocity is exactly zero
            this.velocity.y = 0;
        }
        
        // Calculate the new positions
        const newX = this.mesh.position.x + this.velocity.x * deltaTime;
        const newY = this.mesh.position.y + this.velocity.y * deltaTime;
        
        // Update position smoothly
        this.mesh.position.x = newX;
        this.mesh.position.y = newY;
        
        // Keep position synced with mesh
        this.position.x = this.mesh.position.x;
        this.position.y = this.mesh.position.y;
        
        // Check ground collision
        if (this.mesh.position.y - this.hitbox.height/2 <= this.groundLevel) {
            // Place player exactly on ground
            const newGroundY = this.groundLevel + this.hitbox.height/2;
            this.mesh.position.y = newGroundY;
            this.position.y = newGroundY;
            this.velocity.y = 0;
            this.isJumping = false;
            this.mesh.rotation.z = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Handle platform state
        if (this.onPlatform) {
            this.isJumping = false;
            this.mesh.rotation.z = 0;
            
            // Stop any rotation immediately when landing on platform
            if (Math.abs(this.mesh.rotation.z) > 0.001) {
                this.mesh.rotation.z = 0;
            }
        }
        
        // Update rotation if in the air (not on ground or platform)
        if (!this.onGround && !this.onPlatform) {
            this.mesh.rotation.z -= 3 * deltaTime;
            this.isJumping = true;
        }
    }

    jump() {
        // Allow jumping when on the ground or on a platform
        if (!this.isJumping) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.onPlatform = false; // No longer on platform when jumping
            
            // Add particle effect for jump
            this.createJumpParticles();
        }
    }

    createJumpParticles() {
        // Create a simple particle effect when jumping
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 0.2 + 0.1;
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.accent,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Position around player bottom
            particle.position.x = this.mesh.position.x + (Math.random() * 1 - 0.5);
            particle.position.y = this.mesh.position.y - this.size/2;
            particle.position.z = 0.1;
            
            // Random velocity
            particle.userData.velocity = {
                x: Math.random() * 2 - 1,
                y: Math.random() * 3 + 1
            };
            
            // Life span
            particle.userData.life = 1.0;
            particle.userData.decay = Math.random() * 0.2 + 0.3;
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            let allDead = true;
            
            particles.children.forEach(particle => {
                // Move particle
                particle.position.x += particle.userData.velocity.x * 0.1;
                particle.position.y += particle.userData.velocity.y * 0.1;
                
                // Decay life
                particle.userData.life -= particle.userData.decay * 0.1;
                
                // Update opacity
                particle.material.opacity = particle.userData.life;
                
                if (particle.userData.life > 0) {
                    allDead = false;
                }
            });
            
            // Render particles
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                // Remove particles from scene
                this.scene.remove(particles);
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        animateParticles();
    }

    reset() {
        // Reset player position and state
        this.mesh.position.set(this.startX, this.startY, 0);
        this.position.x = this.startX;
        this.position.y = this.startY;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.isJumping = false;
        this.onPlatform = false;
        this.onGround = false;
        this.mesh.rotation.z = 0;
    }

    remove() {
        // Cancel animation frame if it exists
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Dispose of geometries and materials
        if (this.outerMesh) {
            this.outerMesh.geometry.dispose();
            this.outerMesh.material.dispose();
        }
        
        if (this.innerMesh) {
            this.innerMesh.geometry.dispose();
            this.innerMesh.material.dispose();
        }
        
        if (this.accentMesh) {
            this.accentMesh.geometry.dispose();
            this.accentMesh.material.dispose();
        }
        
        if (this.edgesMesh) {
            this.edgesMesh.geometry.dispose();
            this.edgesMesh.material.dispose();
        }
        
        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
        
        if (this.outerGlowMesh) {
            this.outerGlowMesh.geometry.dispose();
            this.outerGlowMesh.material.dispose();
        }
        
        // Remove from scene
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
        }
    }

    getHitbox() {
        return {
            x: this.position.x - this.hitbox.width/2,
            y: this.position.y - this.hitbox.height/2,
            width: this.hitbox.width,
            height: this.hitbox.height
        };
    }

    updateColors(newColorScheme) {
        // Update player colors when changing levels
        
        // Update outer mesh (main player color)
        if (this.outerMesh) {
            this.outerMesh.material.color.set(newColorScheme.player);
        }
        
        // Update accent mesh (inner color)
        if (this.accentMesh) {
            this.accentMesh.material.color.set(newColorScheme.accent);
        }
        
        // Store new colors for future reference
        this.colors = newColorScheme;
    }
} 