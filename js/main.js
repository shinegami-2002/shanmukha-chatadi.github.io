// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const starfieldCanvas = document.getElementById('landing-starfield');
    const spaceshipCursorElement = document.getElementById('spaceshipCursor');
    const warpButton = document.getElementById('warp-button');

    let scene, camera, renderer, stars, starMaterial;
    const STAR_COUNT = 5000; // Keep this high for a dense field during warp
    let starPositions = [];
    // starVelocities and starInitialSizes are not directly used in the current simplified shader
    // but can be kept if you plan to expand the shader later.

    let isWarping = false;
    // mouse and targetRotation for spaceship cursor are not used in this simplified cursor version
    // but can be re-added if you implement more complex cursor rotation.

    let animationFrameId_main; // To cancel animation frame

    // --- Spaceship Cursor ---
    function updateSpaceshipCursor(event) {
        if (!spaceshipCursorElement) return;
        spaceshipCursorElement.style.left = `${event.clientX}px`;
        spaceshipCursorElement.style.top = `${event.clientY}px`;

        // Simple rotation towards center for a bit of dynamism (can be improved)
        const dx = event.clientX - (window.innerWidth / 2);
        const dy = event.clientY - (window.innerHeight / 2);
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // +90 to generally point "up"
        spaceshipCursorElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
    window.addEventListener('mousemove', updateSpaceshipCursor);
    document.querySelectorAll('a, button').forEach(el => {
        el.style.cursor = 'none';
    });


    // --- Three.js Starfield ---
    function initStarfield() {
        if (!starfieldCanvas) {
            console.error("Starfield canvas not found!");
            return;
        }

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000); // Increased far plane
        camera.position.z = 50; // Start further back to see initial stars

        renderer = new THREE.WebGLRenderer({ canvas: starfieldCanvas, antialias: true, alpha: true }); // alpha:true if body has image bg
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const starGeometry = new THREE.BufferGeometry();
        const tempStarPositions = []; // Use a temporary array before assigning to attribute
        for (let i = 0; i < STAR_COUNT; i++) {
            // Reduced initial spread for better visibility on landing
            const x = (Math.random() - 0.5) * 600;
            const y = (Math.random() - 0.5) * 600;
            const z = (Math.random() - 0.5) * 1000; // More depth, some in front, some behind initial camera
            tempStarPositions.push(x, y, z);
        }
        starPositions = new Float32Array(tempStarPositions); // Assign to global for potential reuse
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

        starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png') },
                uSize: { value: 1.5 }, // Adjusted base size
                uWarpFactor: { value: 0.0 }
            },
            vertexShader: `
                uniform float uSize;
                uniform float uWarpFactor;
                varying float vWarpAlpha;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    float basePointSize = uSize * (300.0 / -mvPosition.z); // Perspective scaling
                    float warpedPointSize = basePointSize * (1.0 + uWarpFactor * 8.0); // Streak length
                    
                    gl_PointSize = warpedPointSize;
                    
                    // For fragment shader to adjust alpha based on streak
                    vWarpAlpha = uWarpFactor > 0.0 ? clamp(1.0 - (length(position.xy) / 200.0), 0.1, 1.0) : 1.0;
                                        
                    // Simple streaking by pulling points towards camera Z during warp
                    // A more advanced streak involves line geometry or screen-space effects
                    if (uWarpFactor > 0.0) {
                        mvPosition.z -= uWarpFactor * pow(abs(position.z), 0.5) * 0.5 ; // Pull based on distance and warp
                    }
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vWarpAlpha;
                void main() {
                    float alpha = vWarpAlpha;
                    // Soften edges of points
                    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
                    alpha *= (1.0 - smoothstep(0.4, 0.5, distanceToCenter));

                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha) * texture2D(pointTexture, gl_PointCoord);
                    if (gl_FragColor.a < 0.01) discard; // Discard fully transparent pixels
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false, // Usually true for opaque, false for transparent additive
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

        if (!isWarping) {
            if (stars) stars.rotation.y += delta * 0.005; // Slower idle rotation
            // Camera resting position logic (already handled by GSAP if we add it, or manual adjustment)
             camera.position.z += (50 - camera.position.z) * 0.02 * delta * 60; // Smoothly move to resting Z

            if (starMaterial && starMaterial.uniforms.uWarpFactor.value > 0) {
                 starMaterial.uniforms.uWarpFactor.value -= delta * 0.5; // Slowly reduce warp after effect
                 if (starMaterial.uniforms.uWarpFactor.value < 0) starMaterial.uniforms.uWarpFactor.value = 0;
            }
        } else { // WARPING
            if (starMaterial && starMaterial.uniforms.uWarpFactor.value < 2.5) { // Allow warp factor to increase further for intensity
                 starMaterial.uniforms.uWarpFactor.value += delta * 0.8; // Faster increase
            }

            const warpSpeed = 250 + starMaterial.uniforms.uWarpFactor.value * 500; // Increase base and multiplier
            camera.position.z -= warpSpeed * delta;

            // Optional: Animate star positions to move towards/past camera (for more dynamic streaking)
            // This requires careful management of star respawning.
            // For simplicity, the shader currently handles visual streaking.

            // Fade out the starfield canvas itself as we are about to navigate
            if (camera.position.z < -1800 && starfieldCanvas.style.opacity !== "0") {
                if (!starfieldCanvas.classList.contains('fading-out')) { // Prevent multiple GSAP calls
                    starfieldCanvas.classList.add('fading-out');
                    gsap.to(starfieldCanvas, {
                        opacity: 0,
                        duration: 0.4, // Quicker fade
                        ease: "power1.in",
                        onComplete: () => {
                            // Navigation happens on camera.position.z check
                        }
                    });
                }
            }

            if (camera.position.z < -2200) { // Warp finished threshold
                if (isWarping) { // Ensure it only runs once
                    isWarping = false; // Set immediately to prevent re-entry
                    sessionStorage.setItem('warpActivated', 'true');
                    cancelAnimationFrame(animationFrameId_main);
                    window.location.href = "portfolio.html";
                    // No return here, let the navigation happen
                }
            }
        }
        renderer.render(scene, camera);
    }

    // --- Warp Button ---
    if (warpButton) {
        gsap.to(warpButton, { opacity: 1, duration: 1, delay: 2.0, ease: "power2.out" }); // Slightly shorter delay

        warpButton.addEventListener('click', () => {
            if (isWarping || !starMaterial) return; // Prevent multiple clicks or if not initialized
            isWarping = true;
            body.classList.add('warp-active'); // For CSS transitions on other elements

            gsap.to(starMaterial.uniforms.uWarpFactor, {
                value: 1.0, // Target warp factor for streaking
                duration: 1.2, // Duration of streaking build-up
                ease: "power2.inOut",
            });

            gsap.to(warpButton, { opacity: 0, scale: 0.7, duration: 0.5, ease: "power1.in" });
            gsap.to(".landing-content", { opacity: 0, scale: 0.85, y: -30, duration: 0.6, ease: "power1.in" });
        });
    }

    // Start starfield
    initStarfield();
});