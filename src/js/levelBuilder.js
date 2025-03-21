import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class LevelBuilder {
    constructor(scene, colorScheme) {
        this.scene = scene;
        this.colors = colorScheme;
        this.uniqueObstacles = new Set();
    }

    clearUniqueObstacles() {
        // Clear the set of unique obstacles when transitioning to a new level
        this.uniqueObstacles.clear();
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

    createPlatform(x, y, width, height, isJumpPad = false) {
        // Apply Tron-like style to platforms with strong glow
        const platformGroup = new THREE.Group();
        
        // Main platform body - black core with neon outline
        const platformGeometry = new THREE.BoxGeometry(width, height, 1);
        const platformMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black interior
            transparent: true,
            opacity: 0.7
        });
        const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformGroup.add(platformMesh);
        
        // Edge outline for bright neon effect
        const edgesGeometry = new THREE.EdgesGeometry(platformGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: this.colors.platforms,
            linewidth: 3,
            transparent: false,
            opacity: 1.0
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.position.z = 0.01;
        platformGroup.add(edges);
        
        // Add grid lines for Tron effect
        if (width > 2 && height > 1) {
            const gridLines = new THREE.Group();
            const gridMaterial = new THREE.LineBasicMaterial({
                color: this.colors.platforms,
                linewidth: 1,
                transparent: true,
                opacity: 0.5 // Increased opacity for grid lines
            });
            
            // Horizontal grid lines - increased density
            const hSegments = Math.floor(width / 0.8); // Reduced from 1.5 to 0.8 for more lines
            for (let i = 1; i < hSegments; i++) {
                const lineGeometry = new THREE.BufferGeometry();
                const lineSpacing = (width * 0.94) / hSegments;
                const x1 = -width/2 + lineSpacing * i;
                
                const points = [
                    new THREE.Vector3(x1, -height/2 + 0.1, 0.03),
                    new THREE.Vector3(x1, height/2 - 0.1, 0.03)
                ];
                
                lineGeometry.setFromPoints(points);
                const line = new THREE.Line(lineGeometry, gridMaterial);
                gridLines.add(line);
            }
            
            // Vertical grid lines for larger platforms - increased density
            if (height > 1.5) {
                const vSegments = Math.floor(height / 0.4); // Reduced from 0.8 to 0.4 for more lines
                for (let i = 1; i < vSegments; i++) {
                    const lineGeometry = new THREE.BufferGeometry();
                    const lineSpacing = (height * 0.94) / vSegments;
                    const y1 = -height/2 + lineSpacing * i;
                    
                    const points = [
                        new THREE.Vector3(-width/2 + 0.1, y1, 0.03),
                        new THREE.Vector3(width/2 - 0.1, y1, 0.03)
                    ];
                    
                    lineGeometry.setFromPoints(points);
                    const line = new THREE.Line(lineGeometry, gridMaterial);
                    gridLines.add(line);
                }
            }
            
            // Add diagonal grid lines for more Tron-like effect
            if (width > 3 && height > 1.5) {
                const diagonalCount = Math.floor((width + height) / 3);
                
                // Top-left to bottom-right diagonals
                for (let i = 0; i < diagonalCount; i++) {
                    const lineGeometry = new THREE.BufferGeometry();
                    const startX = -width/2 + (i * width / diagonalCount);
                    const startY = height/2;
                    const endX = startX + height;
                    const endY = -height/2;
                    
                    // Only draw the line if it intersects the platform
                    if (startX < width/2 && endX > -width/2) {
                        const points = [
                            new THREE.Vector3(Math.max(startX, -width/2), Math.min(startY, height/2), 0.03),
                            new THREE.Vector3(Math.min(endX, width/2), Math.max(endY, -height/2), 0.03)
                        ];
                        
                        lineGeometry.setFromPoints(points);
                        const line = new THREE.Line(lineGeometry, gridMaterial);
                        gridLines.add(line);
                    }
                }
            }
            
            platformGroup.add(gridLines);
        }
        
        // Create stronger outer glow for platforms - first layer
        const glowSize = 0.8; // Increased glow size further (was 0.6)
        const glowGeometry = new THREE.PlaneGeometry(width + glowSize, height + glowSize);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: true,
            opacity: 0.9, // Increased opacity for more visibility (was 0.8)
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01;
        platformGroup.add(glow);
        
        // Create second, larger glow for more intense effect
        const outerGlowGeometry = new THREE.PlaneGeometry(width + glowSize * 4, height + glowSize * 4); // Increased from 3.5 to 4
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: true,
            opacity: 0.6, // Increased opacity (was 0.5)
            side: THREE.DoubleSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.z = -0.02;
        platformGroup.add(outerGlow);
        
        // Add a third, very subtle outer glow for extended effect
        const farGlowGeometry = new THREE.PlaneGeometry(width + glowSize * 7, height + glowSize * 7); // Increased from 6 to 7
        const farGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.platforms,
            transparent: true,
            opacity: 0.3, // Increased opacity (was 0.25)
            side: THREE.DoubleSide
        });
        const farGlow = new THREE.Mesh(farGlowGeometry, farGlowMaterial);
        farGlow.position.z = -0.03;
        platformGroup.add(farGlow);
        
        // If it's a jump pad, add a special indicator
        if (isJumpPad) {
            const indicatorGeometry = new THREE.BoxGeometry(width * 0.7, height * 0.3, 0.1);
            const indicatorMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.accent,
                transparent: true,
                opacity: 0.8
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.position.z = 0.04;
            
            // Add neon outline to jump pad indicator
            const indicatorEdges = new THREE.LineSegments(
                new THREE.EdgesGeometry(indicatorGeometry),
                new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    linewidth: 2,
                    transparent: true,
                    opacity: 0.9
                })
            );
            indicator.add(indicatorEdges);
            
            // Add pulsing animation to jump pad
            indicator.userData.pulse = true;
            indicator.userData.pulseDirection = 1;
            indicator.userData.pulseIntensity = 1;
            
            // Add animation function to the scene's update loop
            const animate = () => {
                if (indicator.userData.pulse) {
                    // Pulse effect
                    indicator.userData.pulseIntensity += 0.05 * indicator.userData.pulseDirection;
                    if (indicator.userData.pulseIntensity > 1.5) {
                        indicator.userData.pulseDirection = -1;
                    } else if (indicator.userData.pulseIntensity < 0.5) {
                        indicator.userData.pulseDirection = 1;
                    }
                    
                    // Apply scale and opacity changes
                    const scale = indicator.userData.pulseIntensity;
                    indicator.scale.set(1, scale, 1);
                    indicator.material.opacity = 0.8 * indicator.userData.pulseIntensity;
                    
                    // Continue animation
                    requestAnimationFrame(animate);
                }
            };
            
            // Start animation
            animate();
            
            platformGroup.add(indicator);
        }
        
        // Add pulsing animation to the platform glow
        platformGroup.userData.pulseDirection = 1;
        platformGroup.userData.pulseIntensity = 1;
        platformGroup.userData.animationFrame = null;
        
        const animateGlow = () => {
            // Subtle pulse effect
            platformGroup.userData.pulseIntensity += 0.015 * platformGroup.userData.pulseDirection;
            
            // Reverse direction at limits
            if (platformGroup.userData.pulseIntensity > 1.3) {
                platformGroup.userData.pulseDirection = -1;
            } else if (platformGroup.userData.pulseIntensity < 0.7) {
                platformGroup.userData.pulseDirection = 1;
            }
            
            // Update glow opacity and scale based on intensity
            const intensity = platformGroup.userData.pulseIntensity;
            glow.material.opacity = 0.9 * intensity;
            outerGlow.material.opacity = 0.6 * intensity;
            farGlow.material.opacity = 0.3 * intensity;
            
            // Continue animation if platform is in the scene
            if (platformGroup.parent) {
                platformGroup.userData.animationFrame = requestAnimationFrame(animateGlow);
            }
        };
        
        // Start animation
        platformGroup.userData.animationFrame = requestAnimationFrame(animateGlow);
        
        // Position platform group
        platformGroup.position.set(x, y, 0);
        
        // Add platform to scene
        this.scene.add(platformGroup);
        
        // Return platform data
        return {
            mesh: platformGroup,
            x: x,
            y: y,
            width: width,
            height: height,
            isJumpPad: isJumpPad,
            jumpForce: isJumpPad ? 20 : 0,
            type: 'platform',
            cleanup: () => {
                // Cancel animation frame if it exists
                if (platformGroup.userData.animationFrame) {
                    cancelAnimationFrame(platformGroup.userData.animationFrame);
                    platformGroup.userData.animationFrame = null;
                }
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

    createTriangle(x, y, size, direction = 'up') {
        // Apply enhanced Tron-like style to triangles (spikes)
        const triangleGroup = new THREE.Group();
        
        // Create the triangle shape
        const shapeGeometry = new THREE.BufferGeometry();
        let vertices;
        
        // Set vertices based on direction
        if (direction === 'up') {
            vertices = new Float32Array([
                -size/2, -size/2, 0,
                size/2, -size/2, 0,
                0, size/2, 0
            ]);
        } else if (direction === 'down') {
            vertices = new Float32Array([
                -size/2, size/2, 0,
                size/2, size/2, 0,
                0, -size/2, 0
            ]);
        } else if (direction === 'left') {
            vertices = new Float32Array([
                size/2, -size/2, 0,
                size/2, size/2, 0,
                -size/2, 0, 0
            ]);
        } else { // right
            vertices = new Float32Array([
                -size/2, -size/2, 0,
                -size/2, size/2, 0,
                size/2, 0, 0
            ]);
        }
        
        shapeGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        shapeGeometry.computeVertexNormals();
        
        // Main body (black with bright outline for Tron effect)
        const triangleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black interior
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const triangleMesh = new THREE.Mesh(shapeGeometry, triangleMaterial);
        triangleGroup.add(triangleMesh);
        
        // Use more striking color for hazards based on the images
        const hazardColor = 0xFFDD00; // Yellow/gold for hazards like in second image
        
        // Bright neon edge outline
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: hazardColor,
            linewidth: 3,
            transparent: false,
            opacity: 1
        });
        
        // Create edges for triangle
        const edges = new THREE.Line(new THREE.BufferGeometry(), edgesMaterial);
        const edgeVertices = [];
        
        if (direction === 'up' || direction === 'down') {
            edgeVertices.push(vertices[0], vertices[1], vertices[2]);
            edgeVertices.push(vertices[3], vertices[4], vertices[5]);
            edgeVertices.push(vertices[6], vertices[7], vertices[8]);
            edgeVertices.push(vertices[0], vertices[1], vertices[2]);
        } else {
            edgeVertices.push(vertices[0], vertices[1], vertices[2]);
            edgeVertices.push(vertices[3], vertices[4], vertices[5]);
            edgeVertices.push(vertices[6], vertices[7], vertices[8]);
            edgeVertices.push(vertices[0], vertices[1], vertices[2]);
        }
        
        edges.geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
        edges.position.z = 0.01;
        triangleGroup.add(edges);
        
        // Create first glow layer
        const glowGeometry = new THREE.BufferGeometry();
        glowGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: hazardColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.set(1.2, 1.2, 1.2);
        glow.position.z = -0.01;
        triangleGroup.add(glow);
        
        // Create second, larger glow for more intense effect
        const outerGlowGeometry = new THREE.BufferGeometry();
        outerGlowGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: hazardColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.scale.set(1.5, 1.5, 1.5);
        outerGlow.position.z = -0.02;
        triangleGroup.add(outerGlow);
        
        // Position triangle group
        triangleGroup.position.set(x, y, 0);
        
        // Add animation for triangle glow pulsing
        triangleGroup.userData.pulseDirection = 1;
        triangleGroup.userData.pulseIntensity = 1;
        triangleGroup.userData.animationFrame = null;
        
        const animate = () => {
            // Pulse effect
            triangleGroup.userData.pulseIntensity += 0.03 * triangleGroup.userData.pulseDirection;
            if (triangleGroup.userData.pulseIntensity > 1.3) {
                triangleGroup.userData.pulseDirection = -1;
            } else if (triangleGroup.userData.pulseIntensity < 0.7) {
                triangleGroup.userData.pulseDirection = 1;
            }
            
            // Apply opacity and scale changes to glow
            const intensity = triangleGroup.userData.pulseIntensity;
            glow.material.opacity = 0.5 * intensity;
            outerGlow.material.opacity = 0.3 * intensity;
            
            // Continue animation if still in the scene
            if (triangleGroup.parent) {
                triangleGroup.userData.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        // Start animation
        triangleGroup.userData.animationFrame = requestAnimationFrame(animate);
        
        // Add to scene
        this.scene.add(triangleGroup);
        
        // Return triangle data
        return {
            mesh: triangleGroup,
            x: x,
            y: y,
            width: size,
            height: size,
            type: 'spike',
            direction: direction,
            cleanup: () => {
                // Cancel animation frame if it exists
                if (triangleGroup.userData.animationFrame) {
                    cancelAnimationFrame(triangleGroup.userData.animationFrame);
                    triangleGroup.userData.animationFrame = null;
                }
            }
        };
    }
} 