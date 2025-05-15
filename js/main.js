// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const starfieldCanvas = document.getElementById('landing-starfield');
    const spaceshipCursorElement = document.getElementById('spaceshipCursor');
    const warpButton = document.getElementById('warp-button');
    const landingContent = document.querySelector('.landing-content'); // Get the container

    let scene, camera, renderer, stars, starMaterial;
    const STAR_COUNT = 3000;
    let starPositions = []; // Will be populated in initStarfield
    let isWarping = false;
    let animationFrameId_main;

    console.log("main.js: DOMContentLoaded. warpButton found?", !!warpButton); // Debug log

    // --- Spaceship Cursor (Simplified for stability) ---
    if (spaceshipCursorElement) {
        window.addEventListener('mousemove', (event) => {
            spaceshipCursorElement.style.left = `${event.clientX}px`;
            spaceshipCursorElement.style.top = `${event.clientY}px`;
            // For now, no rotation to ensure it's not the cause of issues
            spaceshipCursorElement.style.transform = `translate(-50%, -50%)`;
        });
        document.querySelectorAll('a, button').forEach(el => {
            el.style.cursor = 'none';
        });
    } else {
        console.warn("main.js: Spaceship cursor element not found.");
    }

    // --- Three.js Starfield ---
    function initStarfield() {
        if (!starfieldCanvas) {
            console.error("main.js: Starfield canvas not found!");
            // Animate content in even if starfield fails, so page isn't blank
            if(landingContent) gsap.to(landingContent, { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power2.out" });
            if(warpButton) gsap.to(warpButton, { opacity: 1, duration: 1, delay: 1.0, ease: "power2.out" });
            return;
        }
        console.log("main.js: Initializing Starfield...");

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2500);
        camera.position.z = 50;

        try {
            renderer = new THREE.WebGLRenderer({ canvas: starfieldCanvas, antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        } catch (e) {
            console.error("main.js: Error initializing WebGLRenderer:", e);
            if(landingContent) gsap.to(landingContent, { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power2.out" });
            if(warpButton) gsap.to(warpButton, { opacity: 1, duration: 1, delay: 1.0, ease: "power2.out" });
            return;
        }


        const starGeometry = new THREE.BufferGeometry();
        const tempStarPositions = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            tempStarPositions.push(
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 1200
            );
        }
        starPositions = new Float32Array(tempStarPositions);
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

        try {
            starMaterial = new THREE.ShaderMaterial({ // Ensure THREE is available
                uniforms: {
                    pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png') },
                    uSize: { value: 1.8 },
                    uWarpFactor: { value: 0.0 }
                },
                vertexShader: `
                    uniform float uSize;
                    uniform float uWarpFactor;
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        float perspectiveFactor = 350.0 / -mvPosition.z;
                        float basePointSize = uSize * perspectiveFactor;
                        float warpedPointSize = basePointSize * (1.0 + uWarpFactor * 8.0);
                        gl_PointSize = clamp(warpedPointSize, 1.0, 200.0);
                        if (uWarpFactor > 0.0) {
                            mvPosition.z -= uWarpFactor * pow(abs(position.z), 0.5) * 0.5 ;
                        }
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform sampler2D pointTexture;
                    uniform float uWarpFactor;
                    void main() {
                        float alpha = 1.0;
                        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
                        alpha *= (1.0 - smoothstep(0.35, 0.5, distanceToCenter));
                        if (uWarpFactor > 0.0) {
                            alpha *= (1.0 - gl_PointCoord.y * 0.8);
                        }
                        gl_FragColor = vec4(0.8, 0.9, 1.0, alpha) * texture2D(pointTexture, gl_PointCoord);
                        if (gl_FragColor.a < 0.01) discard;
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true
            });
            stars = new THREE.Points(starGeometry, starMaterial);
            scene.add(stars);
            console.log("main.js: Starfield initialized successfully.");
        } catch(e) {
            console.error("main.js: Error creating star material or points:", e);
             // Animate content in even if star material fails
            if(landingContent) gsap.to(landingContent, { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power2.out" });
            if(warpButton) gsap.to(warpButton, { opacity: 1, duration: 1, delay: 1.0, ease: "power2.out" });
            return;
        }


        window.addEventListener('resize', onWindowResizeStarfield);
        animateStarfield(); // Start animation loop only if initialization was successful
    }

    function onWindowResizeStarfield() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    const clock = new THREE.Clock();
    function animateStarfield() {
        if (!scene || !camera || !renderer || !starMaterial) { // Add !starMaterial check
            if(animationFrameId_main) cancelAnimationFrame(animationFrameId_main);
            return;
        }
        animationFrameId_main = requestAnimationFrame(animateStarfield);
        const delta = clock.getDelta();

        if (!isWarping) {
            if (stars) stars.rotation.y += delta * 0.008;
            camera.position.z += (60 - camera.position.z) * 0.01 * delta * 60;
            if (starMaterial.uniforms.uWarpFactor.value > 0) {
                 starMaterial.uniforms.uWarpFactor.value -= delta * 0.8;
                 if (starMaterial.uniforms.uWarpFactor.value < 0) starMaterial.uniforms.uWarpFactor.value = 0;
            }
        } else {
            if (starMaterial.uniforms.uWarpFactor.value < 3.0) {
                 starMaterial.uniforms.uWarpFactor.value += delta * 1.2;
            }
            const warpSpeed = 300 + starMaterial.uniforms.uWarpFactor.value * 600;
            camera.position.z -= warpSpeed * delta;

            if (camera.position.z < -2500 && starfieldCanvas.style.opacity !== "0") {
                if (!starfieldCanvas.classList.contains('fading-out')) {
                    starfieldCanvas.classList.add('fading-out');
                    gsap.to(starfieldCanvas, { opacity: 0, duration: 0.3, ease: "power1.in" });
                }
            }
            if (camera.position.z < -3000) {
                if (isWarping) { // Check flag before navigating
                    isWarping = false;
                    sessionStorage.setItem('warpActivated', 'true');
                    if(animationFrameId_main) cancelAnimationFrame(animationFrameId_main);
                    window.location.href = "portfolio.html";
                }
            }
        }
        renderer.render(scene, camera);
    }

    // --- GSAP Animations for Landing Content ---
    if (landingContent) {
        gsap.to(landingContent, {
            opacity: 1,
            y: 0, // Assuming it starts with a slight translateY in CSS or default
            duration: 1.2,
            delay: 0.5, // Delay for page load and Three.js init
            ease: "expo.out"
        });
    } else {
        console.error("main.js: .landing-content element not found!");
    }

    // --- Warp Button Logic ---
    if (warpButton) {
        gsap.to(warpButton, { // Animate button to be visible
            opacity: 1,
            duration: 1,
            delay: 1.5, // Delay after landingContent fades in
            ease: "power2.out"
        });

        warpButton.addEventListener('click', () => {
            if (!starMaterial) { // Check for starMaterial *inside* the click handler
                console.warn("main.js: Star material not ready for warp. Cannot engage hyperdrive.");
                sessionStorage.setItem('warpActivated', 'false'); // Indicate no visual warp
                window.location.href = "portfolio.html"; // Still navigate
                return;
            }
            if (isWarping) return;

            isWarping = true;
            body.classList.add('warp-active');
            gsap.to(starMaterial.uniforms.uWarpFactor, {
                value: 1.0, duration: 1.0, ease: "power2.inOut",
            });
            // Fade out button and landing content (which should already be mostly visible)
            gsap.to(warpButton, { opacity: 0, scale: 0.7, duration: 0.5, ease: "power1.in" });
            gsap.to(landingContent, { opacity: 0, scale: 0.85, y: -30, duration: 0.6, ease: "power1.in" });
        });
    } else {
        console.error("main.js: Warp button element (#warp-button) not found in HTML.");
    }

    // --- Initialize Starfield ---
    // Call it after other initial setups, especially if it might error.
    // The GSAP fade-ins for content and button will run regardless.
    initStarfield();

});