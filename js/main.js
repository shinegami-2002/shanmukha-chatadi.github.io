// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const starfieldCanvas = document.getElementById('landing-starfield');
    const spaceshipCursorElement = document.getElementById('spaceshipCursor');
    const warpButton = document.getElementById('warp-button');

    let scene, camera, renderer, stars, starMaterial;
    const STAR_COUNT = 3000; // Reduced for potentially better performance on landing
    let starPositions = [];

    let isWarping = false;
    let animationFrameId_main;

    // --- Spaceship Cursor ---
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;
    let targetAngle = 0;
    let currentAngle = 0;

    function updateSpaceshipCursor(event) {
        if (!spaceshipCursorElement) return;

        spaceshipCursorElement.style.left = `${event.clientX}px`;
        spaceshipCursorElement.style.top = `${event.clientY}px`;

        const dx = event.clientX - lastMouseX;
        const dy = event.clientY - lastMouseY;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { // Only update angle if mouse moved significantly
            targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        }
        
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
    // Separate loop for smoother GSAP rotation
    function rotateCursor() {
        currentAngle += (targetAngle - currentAngle) * 0.15; // Smoothing factor
        if (spaceshipCursorElement) {
            spaceshipCursorElement.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;
        }
        requestAnimationFrame(rotateCursor);
    }
    
    if (spaceshipCursorElement) {
        window.addEventListener('mousemove', updateSpaceshipCursor);
        rotateCursor(); // Start the rotation loop
    }
    document.querySelectorAll('a, button').forEach(el => {
        el.style.cursor = 'none';
    });


    // --- Three.js Starfield ---
    function initStarfield() {
        if (!starfieldCanvas) { console.error("Starfield canvas not found!"); return; }

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2500); // Adjusted far plane
        camera.position.z = 50;

        renderer = new THREE.WebGLRenderer({ canvas: starfieldCanvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const starGeometry = new THREE.BufferGeometry();
        const tempStarPositions = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            tempStarPositions.push(
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 1200 // More depth
            );
        }
        starPositions = new Float32Array(tempStarPositions);
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

        starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png') },
                uSize: { value: 1.8 }, // Slightly larger base size
                uWarpFactor: { value: 0.0 },
                uTime: { value: 0.0 } // For subtle twinkle
            },
            vertexShader: `
                uniform float uSize;
                uniform float uWarpFactor;
                varying float vFinalSize;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    float perspectiveFactor = 350.0 / -mvPosition.z;
                    vFinalSize = uSize * perspectiveFactor;
                    // During warp, elongate points based on their original Z and warp factor
                    // This is a visual trick; real streaks need lines or more complex shaders
                    if (uWarpFactor > 0.0) {
                         // Points closer to original camera Z (further from current camera during warp) streak less
                        float streakLength = uWarpFactor * 15.0 * (1.0 - smoothstep(0.0, 1000.0, abs(position.z)));
                        gl_PointSize = clamp(vFinalSize * (1.0 + streakLength), 1.0, 200.0); // Max streak size
                        mvPosition.z -= streakLength * 2.0; // Pull towards camera
                    } else {
                        gl_PointSize = clamp(vFinalSize, 1.0, 50.0); // Max normal size
                    }
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                uniform float uTime; // Not used in this simple version, but available
                uniform float uWarpFactor;
                varying float vFinalSize; // Not directly used in fragment, but good practice
                void main() {
                    float alpha = 1.0;
                     // Soften edges
                    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
                    alpha *= (1.0 - smoothstep(0.35, 0.5, distanceToCenter)); // Softer edges

                    if (uWarpFactor > 0.0) {
                        // Make streaks fade at the "tail" - simple version
                        alpha *= (1.0 - gl_PointCoord.y * 0.8); // Fade along one axis of point sprite
                    }

                    gl_FragColor = vec4(0.8, 0.9, 1.0, alpha) * texture2D(pointTexture, gl_PointCoord); // Slightly bluish stars
                    if (gl_FragColor.a < 0.01) discard;
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });

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
        if (!scene || !camera || !renderer) {
            if(animationFrameId_main) cancelAnimationFrame(animationFrameId_main);
            return;
        }
        animationFrameId_main = requestAnimationFrame(animateStarfield);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        
        if (starMaterial) starMaterial.uniforms.uTime.value = elapsedTime;


        if (!isWarping) {
            if (stars) stars.rotation.y += delta * 0.008;
            camera.position.x += (0 - camera.position.x) * 0.01; // Gently center camera X
            camera.position.y += (0 - camera.position.y) * 0.01; // Gently center camera Y
            camera.position.z += (60 - camera.position.z) * 0.01 * delta * 60; // Target resting Z

            if (starMaterial && starMaterial.uniforms.uWarpFactor.value > 0) {
                 starMaterial.uniforms.uWarpFactor.value -= delta * 0.8; // Faster fade out of warp
                 if (starMaterial.uniforms.uWarpFactor.value < 0) starMaterial.uniforms.uWarpFactor.value = 0;
            }
        } else { // WARPING
            if (starMaterial && starMaterial.uniforms.uWarpFactor.value < 3.0) {
                 starMaterial.uniforms.uWarpFactor.value += delta * 1.2; // Quicker ramp up
            }

            const warpSpeed = 300 + starMaterial.uniforms.uWarpFactor.value * 600;
            camera.position.z -= warpSpeed * delta;

            if (camera.position.z < -2500 && starfieldCanvas.style.opacity !== "0") {
                if (!starfieldCanvas.classList.contains('fading-out')) {
                    starfieldCanvas.classList.add('fading-out');
                    gsap.to(starfieldCanvas, {
                        opacity: 0, duration: 0.3, ease: "power1.in"
                    });
                }
            }

            if (camera.position.z < -3000) {
                if (isWarping) {
                    isWarping = false;
                    sessionStorage.setItem('warpActivated', 'true');
                    if(animationFrameId_main) cancelAnimationFrame(animationFrameId_main);
                    window.location.href = "portfolio.html";
                }
            }
        }
        renderer.render(scene, camera);
    }

    if (warpButton && starMaterial) { // Ensure starMaterial is ready
        gsap.to(warpButton, { opacity: 1, duration: 1, delay: 2.0, ease: "power2.out" });
        warpButton.addEventListener('click', () => {
            if (isWarping || !starMaterial) return;
            isWarping = true;
            body.classList.add('warp-active');
            gsap.to(starMaterial.uniforms.uWarpFactor, {
                value: 1.0, duration: 1.0, ease: "power2.inOut",
            });
            gsap.to(warpButton, { opacity: 0, scale: 0.7, duration: 0.5, ease: "power1.in" });
            gsap.to(".landing-content", { opacity: 0, scale: 0.85, y: -30, duration: 0.6, ease: "power1.in" });
        });
    } else if (warpButton && !starMaterial) {
        // Fallback if starMaterial isn't ready for some reason, unlikely with DOMContentLoaded
        warpButton.addEventListener('click', () => {
            console.warn("Star material not ready for warp.");
            sessionStorage.setItem('warpActivated', 'true'); // Still allow navigation for testing
            window.location.href = "portfolio.html";
        });
    }

    initStarfield();
});