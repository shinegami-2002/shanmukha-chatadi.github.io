// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const starfieldCanvas = document.getElementById('landing-starfield');
    const spaceshipCursorElement = document.getElementById('spaceshipCursor');
    const warpButton = document.getElementById('warp-button');

    let scene, camera, renderer, stars, starMaterial;
    const STAR_COUNT = 5000;
    let starPositions = [];
    let starVelocities = []; // For warp effect
    let starInitialSizes = [];

    let isWarping = false;
    let mouse = new THREE.Vector2();
    let targetRotation = new THREE.Vector2(); // For spaceship cursor rotation

    // --- Spaceship Cursor ---
    function updateSpaceshipCursor(event) {
        if (!spaceshipCursorElement) return;
        spaceshipCursorElement.style.left = `${event.clientX}px`;
        spaceshipCursorElement.style.top = `${event.clientY}px`;

        // Calculate rotation based on mouse movement direction (simplified)
        const dx = event.clientX - (window.innerWidth / 2); // Simplified origin for rotation
        const dy = event.clientY - (window.innerHeight / 2);
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // +90 to point "up"
        
        // Smooth rotation (optional, can be complex)
        // For now, direct rotation
        spaceshipCursorElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
    window.addEventListener('mousemove', updateSpaceshipCursor);
    // Hide default cursor for links too
    document.querySelectorAll('a, button').forEach(el => {
        el.style.cursor = 'none';
    });


    // --- Three.js Starfield ---
    function initStarfield() {
        if (!starfieldCanvas) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.z = 1; // Start close for warp effect

        renderer = new THREE.WebGLRenderer({ canvas: starfieldCanvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const starGeometry = new THREE.BufferGeometry();
        for (let i = 0; i < STAR_COUNT; i++) {
            const x = (Math.random() - 0.5) * 1500; // Spread them out initially for depth
            const y = (Math.random() - 0.5) * 1500;
            const z = (Math.random() - 0.5) * 1500; // Depth
            starPositions.push(x, y, z);
            starVelocities.push(0, 0, 0); // Initial velocity for warp
            starInitialSizes.push(Math.random() * 1.5 + 0.5);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        // We'll use a shader material for streaking stars during warp
        starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png') },
                uSize: { value: 1.0 }, // Base size multiplier
                uWarpFactor: { value: 0.0 } // 0 = normal, >0 = streaking
            },
            vertexShader: `
                attribute float size; // If we pass individual sizes
                uniform float uSize;
                uniform float uWarpFactor;
                varying float vWarp;
                void main() {
                    vWarp = uWarpFactor;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Make stars smaller further away, larger closer
                    gl_PointSize = uSize * (200.0 / -mvPosition.z) * (1.0 + uWarpFactor * 5.0) ; 
                    // Elongate point size based on warp factor (simplified streaking)
                    if (uWarpFactor > 0.0) {
                         mvPosition.z -= uWarpFactor * 50.0; // Pull them towards camera for streak
                    }
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vWarp;
                void main() {
                    float alpha = 1.0;
                    if (vWarp > 0.0) {
                        // Make streaks more transparent at the tail (very simplified)
                        // A real streak would involve sampling along a line in screen space
                        // or using line geometry. This is a PointsMaterial trick.
                        alpha = 1.0 - clamp(length(gl_PointCoord - vec2(0.5)) * 2.0 - vWarp * 0.5, 0.0, 1.0);
                    }
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        // Add initial sizes if you implement per-particle size in shader
        // starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starInitialSizes, 1));


        stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        window.addEventListener('resize', onWindowResizeStarfield);
        animateStarfield();
    }

    function onWindowResizeStarfield() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const clock = new THREE.Clock();
    function animateStarfield() {
        if (!scene || !camera || !renderer) return;
        requestAnimationFrame(animateStarfield);
        const delta = clock.getDelta();

        if (!isWarping) {
            // Slow rotation or drift when not warping
            if (stars) stars.rotation.y += delta * 0.01;
            camera.position.z += (50 - camera.position.z) * 0.01; // Slowly move camera to a resting view distance
        } else {
            // WARP EFFECT LOGIC
            const warpSpeed = 150 + starMaterial.uniforms.uWarpFactor.value * 300; // Faster as warp factor increases
            camera.position.z -= warpSpeed * delta;

            // Update star positions to move towards camera for streaking effect
            // This is a simplified approach. A true warp streaking is complex.
            const positions = stars.geometry.attributes.position.array;
            for (let i = 0; i < STAR_COUNT; i++) {
                const i3 = i * 3;
                // Move stars towards camera (or past it)
                // A more advanced method would re-generate stars that go behind the camera
                // positions[i3+2] -= starVelocities[i3+2] * delta;
                // if(positions[i3+2] < camera.position.z - 100) positions[i3+2] += 1500; // Respawn far away
            }
            // stars.geometry.attributes.position.needsUpdate = true;

            if (camera.position.z < -1000) { // Warp finished (adjust threshold)
                // Navigate to portfolio page
                window.location.href = "portfolio.html"; // Or your main content page
                // Optionally, store a flag that warp happened:
                // sessionStorage.setItem('warpActivated', 'true');
                isWarping = false; // Stop animation (though page will change)
            }
        }
        renderer.render(scene, camera);
    }

    // --- Warp Button ---
    if (warpButton) {
        // GSAP animation for button entrance
        gsap.to(warpButton, { opacity: 1, duration: 1, delay: 2.5, ease: "power2.out" });

        warpButton.addEventListener('click', () => {
            if (isWarping) return;
            isWarping = true;
            body.classList.add('warp-active'); // For CSS transitions on other elements

            // Animate warp factor in shader
            gsap.to(starMaterial.uniforms.uWarpFactor, {
                value: 1.0, // Max streak
                duration: 1.5, // Duration of streaking build-up
                ease: "power2.in",
                onComplete: () => {
                    // The animateStarfield loop will then carry the camera forward fast
                }
            });

            // Fade out button
            gsap.to(warpButton, { opacity: 0, duration: 0.5, ease: "power1.in" });
        });
    }

    // Start starfield
    initStarfield();
});