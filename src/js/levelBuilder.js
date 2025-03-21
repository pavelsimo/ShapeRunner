export class LevelBuilder {
    constructor(scene, colorScheme) {
        this.scene = scene;
        this.colors = colorScheme;
    }

    createSpike(x, y, size) {
        // Create a spike obstacle with enhanced Tron-like glow
        const spikeGroup = new THREE.Group();
        
        // Create the spike shape using triangles
        const spikeGeometry = new THREE.BufferGeometry();
        
        // Spike points (triangle)
        const vertices = new Float32Array([
            0, size, 0,      // top point
            -size/2, 0, 0,   // bottom left
            size/2, 0, 0     // bottom right
        ]);
        
        spikeGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        spikeGeometry.setIndex([0, 1, 2]); // Create a face
        
        const spikeMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.spikes,
            side: THREE.DoubleSide
        });
        
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        
        // Create spike outline for Tron-like glow effect
        const outlineGeometry = new THREE.EdgesGeometry(spikeGeometry);
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff, // Bright white outline
            transparent: true,
            opacity: 0.9,
            linewidth: 2
        });
        
        const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
        
        // Create primary glow effect around spike
        const glowGeometry = new THREE.BufferGeometry();
        // Create a slightly larger triangle for the glow
        const glowSize = size * 1.1;
        const glowVertices = new Float32Array([
            0, glowSize, -0.01,      // top point
            -glowSize/2, 0, -0.01,   // bottom left
            glowSize/2, 0, -0.01     // bottom right
        ]);
        
        glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowVertices, 3));
        glowGeometry.setIndex([0, 1, 2]); // Create a face
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.spikes,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        // Create a second, larger glow for more intense effect
        const outerGlowGeometry = new THREE.BufferGeometry();
        const outerGlowSize = size * 1.25;
        const outerGlowVertices = new Float32Array([
            0, outerGlowSize, -0.02,      // top point
            -outerGlowSize/2, 0, -0.02,   // bottom left
            outerGlowSize/2, 0, -0.02     // bottom right
        ]);
        
        outerGlowGeometry.setAttribute('position', new THREE.BufferAttribute(outerGlowVertices, 3));
        outerGlowGeometry.setIndex([0, 1, 2]); // Create a face
        
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.spikes,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.15
        });
        
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        
        // Add all elements to group
        spikeGroup.add(outerGlow);
        spikeGroup.add(glow);
        spikeGroup.add(spike);
        spikeGroup.add(outline);
        
        // Position spike
        spikeGroup.position.set(x, y, 0);
        
        // Setup animation data
        spikeGroup.userData.glowIntensity = 1.0;
        spikeGroup.userData.glowDirection = 1;
        spikeGroup.userData.animationFrame = null;
        
        // Create animation for pulsing glow effect
        const animate = () => {
            // Pulse the glow intensity
            spikeGroup.userData.glowIntensity += 0.02 * spikeGroup.userData.glowDirection;
            
            // Reverse direction at limits
            if (spikeGroup.userData.glowIntensity > 1.4) {
                spikeGroup.userData.glowDirection = -1;
            } else if (spikeGroup.userData.glowIntensity < 0.7) {
                spikeGroup.userData.glowDirection = 1;
            }
            
            // Update glow opacity based on intensity
            glow.material.opacity = 0.3 * spikeGroup.userData.glowIntensity;
            outerGlow.material.opacity = 0.15 * spikeGroup.userData.glowIntensity;
            
            // Continue animation if spike is in the scene
            if (spikeGroup.parent) {
                spikeGroup.userData.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        // Start animation
        spikeGroup.userData.animationFrame = requestAnimationFrame(animate);
        
        // Add to scene
        this.scene.add(spikeGroup);
        
        // Return spike object with metadata for collision detection
        return {
            mesh: spikeGroup,
            x: x,
            y: y,
            width: size,
            height: size,
            type: 'spike',
            cleanup: () => {
                // Cancel animation frame if it exists
                if (spikeGroup.userData.animationFrame) {
                    cancelAnimationFrame(spikeGroup.userData.animationFrame);
                    spikeGroup.userData.animationFrame = null;
                }
                
                // Dispose of geometries and materials
                spikeGeometry.dispose();
                spikeMaterial.dispose();
                outlineGeometry.dispose();
                outlineMaterial.dispose();
                glowGeometry.dispose();
                glowMaterial.dispose();
                outerGlowGeometry.dispose();
                outerGlowMaterial.dispose();
            }
        };
    }

    createPlatform(x, y, width, height) {
        // Create a platform with enhanced Tron-like glow
        const platformGroup = new THREE.Group();
        
        // Create outer platform (main shape)
        const outerGeometry = new THREE.PlaneGeometry(width, height);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: false,
            opacity: 1
        });
        
        const outerPlatform = new THREE.Mesh(outerGeometry, outerMaterial);
        
        // Create inner platform (slightly darker)
        const innerGeometry = new THREE.PlaneGeometry(width * 0.9, height * 0.9);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.colors.platforms).multiplyScalar(0.7),
            transparent: false,
            opacity: 1
        });
        
        const innerPlatform = new THREE.Mesh(innerGeometry, innerMaterial);
        innerPlatform.position.z = 0.01;
        
        // Add Tron-like border glow effect
        const edgesGeometry = new THREE.EdgesGeometry(outerGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, // Bright white for Tron effect
            linewidth: 2,
            transparent: true,
            opacity: 0.9
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.position.z = 0.02;
        
        // Create primary glow effect
        const glowGeometry = new THREE.PlaneGeometry(width + 0.2, height + 0.2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01;
        
        // Create outer glow for more intense effect
        const outerGlowGeometry = new THREE.PlaneGeometry(width + 0.4, height + 0.4);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.z = -0.02;
        
        // Add platform parts to group
        platformGroup.add(outerGlow);
        platformGroup.add(glow);
        platformGroup.add(outerPlatform);
        platformGroup.add(innerPlatform);
        platformGroup.add(edges);
        
        // Position platform
        platformGroup.position.set(x, y, 0);
        
        // Add animation for neon glow effect
        platformGroup.userData.glowIntensity = 1.0;
        platformGroup.userData.glowDirection = 1;
        platformGroup.userData.animationFrame = null;
        
        const animate = () => {
            // Subtle pulse effect
            platformGroup.userData.glowIntensity += 0.015 * platformGroup.userData.glowDirection;
            
            // Reverse direction when reaching limits
            if (platformGroup.userData.glowIntensity > 1.3) {
                platformGroup.userData.glowDirection = -1;
            } else if (platformGroup.userData.glowIntensity < 0.7) {
                platformGroup.userData.glowDirection = 1;
            }
            
            // Update glow opacity based on intensity
            glow.material.opacity = 0.3 * platformGroup.userData.glowIntensity;
            outerGlow.material.opacity = 0.15 * platformGroup.userData.glowIntensity;
            
            // Continue animation if platform is in the scene
            if (platformGroup.parent) {
                platformGroup.userData.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        // Start animation
        platformGroup.userData.animationFrame = requestAnimationFrame(animate);
        
        // Add to scene
        this.scene.add(platformGroup);
        
        // Return platform object with metadata for collision detection
        return {
            mesh: platformGroup,
            x: x,
            y: y,
            width: width,
            height: height,
            type: 'platform',
            cleanup: () => {
                // Cancel animation frame if it exists
                if (platformGroup.userData.animationFrame) {
                    cancelAnimationFrame(platformGroup.userData.animationFrame);
                    platformGroup.userData.animationFrame = null;
                }
                
                // Dispose of geometries and materials
                outerGeometry.dispose();
                outerMaterial.dispose();
                innerGeometry.dispose();
                innerMaterial.dispose();
                edgesGeometry.dispose();
                edgesMaterial.dispose();
                glowGeometry.dispose();
                glowMaterial.dispose();
                outerGlowGeometry.dispose();
                outerGlowMaterial.dispose();
            }
        };
    }

    createSawBlade(x, y, size) {
        // Create a saw blade obstacle with spinning animation
        const sawGroup = new THREE.Group();
        
        // Create the saw circle
        const circleGeometry = new THREE.CircleGeometry(size/2, 16);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.spikes,
            side: THREE.DoubleSide
        });
        
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        
        // Create saw teeth (triangles around the circle)
        const teethCount = 8;
        const teethSize = size / 5;
        
        for (let i = 0; i < teethCount; i++) {
            const angle = (i / teethCount) * Math.PI * 2;
            const toothGeometry = new THREE.BufferGeometry();
            
            // Tooth vertices (triangle)
            const centerX = Math.cos(angle) * (size/2);
            const centerY = Math.sin(angle) * (size/2);
            
            const tooth1X = centerX + Math.cos(angle) * teethSize;
            const tooth1Y = centerY + Math.sin(angle) * teethSize;
            
            const tooth2X = centerX + Math.cos(angle + 0.2) * teethSize;
            const tooth2Y = centerY + Math.sin(angle + 0.2) * teethSize;
            
            const tooth3X = centerX + Math.cos(angle - 0.2) * teethSize;
            const tooth3Y = centerY + Math.sin(angle - 0.2) * teethSize;
            
            const vertices = new Float32Array([
                centerX, centerY, 0,
                tooth1X, tooth1Y, 0,
                tooth2X, tooth2Y, 0,
                tooth3X, tooth3Y, 0
            ]);
            
            toothGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            toothGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 1]); // Create triangular faces
            
            const toothMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.spikes,
                side: THREE.DoubleSide
            });
            
            const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
            sawGroup.add(tooth);
        }
        
        // Create saw edge (glow effect)
        const edgeGeometry = new THREE.EdgesGeometry(circleGeometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        
        // Create center dot
        const dotGeometry = new THREE.CircleGeometry(size/10, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        
        // Add parts to group
        sawGroup.add(circle);
        sawGroup.add(edge);
        sawGroup.add(dot);
        
        // Position the saw
        sawGroup.position.set(x, y, 0);
        
        // Set up rotation animation
        sawGroup.userData.rotationSpeed = 2;
        sawGroup.userData.animationFrames = [];
        
        // Animation function
        const animate = () => {
            if (sawGroup.parent) { // Only animate if still in the scene
                sawGroup.rotation.z += sawGroup.userData.rotationSpeed * 0.01;
                const frame = requestAnimationFrame(animate);
                sawGroup.userData.animationFrames.push(frame);
            }
        };
        
        // Start animation
        const initialFrame = requestAnimationFrame(animate);
        sawGroup.userData.animationFrames.push(initialFrame);
        
        // Add to scene
        this.scene.add(sawGroup);
        
        // Return saw object with metadata for collision detection
        return {
            mesh: sawGroup,
            x: x,
            y: y,
            width: size,
            height: size,
            type: 'sawblade',
            cleanup: () => {
                // Cancel animation frames when removed
                sawGroup.userData.animationFrames.forEach(frame => cancelAnimationFrame(frame));
            }
        };
    }

    createPortal(x, y, size) {
        // Create a portal with pulsing animation
        const portalGroup = new THREE.Group();
        
        // Create outer ring
        const outerRingGeometry = new THREE.RingGeometry(size/2 * 0.8, size/2, 16);
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.accent,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        
        // Create inner ring
        const innerRingGeometry = new THREE.RingGeometry(size/2 * 0.5, size/2 * 0.6, 16);
        const innerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        
        // Create center
        const centerGeometry = new THREE.CircleGeometry(size/2 * 0.4, 16);
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.accent,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        
        // Add to group
        portalGroup.add(outerRing);
        portalGroup.add(innerRing);
        portalGroup.add(center);
        
        // Position portal
        portalGroup.position.set(x, y, 0);
        
        // Add spinning animation on top of pulsing
        portalGroup.userData.pulseSpeed = 2;
        portalGroup.userData.baseSize = size;
        portalGroup.userData.rotationSpeed = 0.5;
        
        // Animation function
        const animate = () => {
            // Pulse effect
            const scale = 1 + Math.sin(performance.now() * 0.002 * portalGroup.userData.pulseSpeed) * 0.1;
            portalGroup.scale.set(scale, scale, 1);
            
            // Rotation effect
            portalGroup.rotation.z += portalGroup.userData.rotationSpeed * 0.01;
            
            // Additional inner ring rotation in opposite direction
            innerRing.rotation.z -= portalGroup.userData.rotationSpeed * 0.02;
            
            // Continue animation
            requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
        
        // Add to scene
        this.scene.add(portalGroup);
        
        // Return portal object with metadata
        return {
            mesh: portalGroup,
            x: x,
            y: y,
            width: size,
            height: size,
            type: 'portal'
        };
    }
} 