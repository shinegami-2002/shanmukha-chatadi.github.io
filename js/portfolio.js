// js/portfolio.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio Systems Online. Standby for data stream...");
    const body = document.body;
    const warpArrivalOverlay = document.getElementById('warpArrivalOverlay');
    const spaceshipCursorElementPortfolio = document.getElementById('spaceshipCursorPortfolio');
    const portfolioStarfieldCanvas = document.getElementById('portfolio-starfield'); // Canvas for this page

    // --- Spaceship Cursor for Portfolio Page ---
    let lastMouseXPortfolio = window.innerWidth / 2;
    let lastMouseYPortfolio = window.innerHeight / 2;
    let targetAnglePortfolio = 0;
    let currentAnglePortfolio = 0;

    function updatePortfolioSpaceshipCursor(event) {
        if (!spaceshipCursorElementPortfolio) return;
        spaceshipCursorElementPortfolio.style.left = `${event.clientX}px`;
        spaceshipCursorElementPortfolio.style.top = `${event.clientY}px`;

        const dx = event.clientX - lastMouseXPortfolio;
        const dy = event.clientY - lastMouseYPortfolio;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { // Threshold for angle update
            targetAnglePortfolio = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        }
        lastMouseXPortfolio = event.clientX;
        lastMouseYPortfolio = event.clientY;
    }

    function rotatePortfolioCursor() {
        currentAnglePortfolio += (targetAnglePortfolio - currentAnglePortfolio) * 0.15; // Smoothing
        if (spaceshipCursorElementPortfolio) {
            spaceshipCursorElementPortfolio.style.transform = `translate(-50%, -50%) rotate(${currentAnglePortfolio}deg)`;
        }
        requestAnimationFrame(rotatePortfolioCursor);
    }

    if (spaceshipCursorElementPortfolio) {
        window.addEventListener('mousemove', updatePortfolioSpaceshipCursor);
        rotatePortfolioCursor();
    }
    document.querySelectorAll('a, button').forEach(el => {
        el.style.cursor = 'none';
    });


    // --- Portfolio Page Starfield (Simpler, persistent version) ---
    let scenePortfolio, cameraPortfolio, rendererPortfolio, starsPortfolio, portfolioStarMaterial;
    const PORTFOLIO_STAR_COUNT = 2000;

    function initPortfolioStarfield() {
        if (!portfolioStarfieldCanvas) {
            console.warn("Portfolio starfield canvas not found.");
            return;
        }
        scenePortfolio = new THREE.Scene();
        cameraPortfolio = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
        cameraPortfolio.position.z = 5; // Closer, static view

        rendererPortfolio = new THREE.WebGLRenderer({ canvas: portfolioStarfieldCanvas, antialias: true, alpha: true });
        rendererPortfolio.setSize(window.innerWidth, window.innerHeight);
        rendererPortfolio.setPixelRatio(window.devicePixelRatio);

        const starGeo = new THREE.BufferGeometry();
        const starPos = [];
        for (let i = 0; i < PORTFOLIO_STAR_COUNT; i++) {
            starPos.push(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        
        // Simple PointsMaterial for portfolio background stars
        portfolioStarMaterial = new THREE.PointsMaterial({
            color: 0xbbccff, // Lighter, softer blueish stars
            size: 0.8,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        // You could use a shader here too if you want more control (e.g. twinkling)

        starsPortfolio = new THREE.Points(starGeo, portfolioStarMaterial);
        scenePortfolio.add(starsPortfolio);

        window.addEventListener('resize', onWindowResizePortfolioStarfield);
        animatePortfolioStarfield();
    }

    function onWindowResizePortfolioStarfield() {
        if (!cameraPortfolio || !rendererPortfolio) return;
        cameraPortfolio.aspect = window.innerWidth / window.innerHeight;
        cameraPortfolio.updateProjectionMatrix();
        rendererPortfolio.setSize(window.innerWidth, window.innerHeight);
    }
    
    const clockPortfolio = new THREE.Clock();
    function animatePortfolioStarfield() {
        if (!scenePortfolio || !rendererPortfolio) return;
        requestAnimationFrame(animatePortfolioStarfield);
        const elapsedTime = clockPortfolio.getElapsedTime();

        if (starsPortfolio) {
            starsPortfolio.rotation.x = elapsedTime * 0.01;
            starsPortfolio.rotation.y = elapsedTime * 0.02;
        }
        // Subtle camera pan based on mouse (optional, can be distracting over content)
        // cameraPortfolio.position.x += (mouseXPortfolio * 0.5 - cameraPortfolio.position.x) * 0.005;
        // cameraPortfolio.position.y += (-mouseYPortfolio * 0.5 - cameraPortfolio.position.y) * 0.005;
        // cameraPortfolio.lookAt(scenePortfolio.position);

        rendererPortfolio.render(scenePortfolio, cameraPortfolio);
    }
    initPortfolioStarfield(); // Initialize stars for this page


    // --- Warp Arrival Animation ---
    if (sessionStorage.getItem('warpActivated') === 'true') {
        console.log("Hyperdrive disengaged. Arrival at portfolio coordinates.");
        body.classList.add('coming-out-of-warp');

        if (warpArrivalOverlay) {
            const tlArrival = gsap.timeline();
            tlArrival
                .set(warpArrivalOverlay, { opacity: 1, display: 'block' })
                .to(warpArrivalOverlay, {
                    opacity: 0, duration: 0.6, ease: "power1.out",
                    onComplete: () => {
                        if (warpArrivalOverlay) warpArrivalOverlay.style.display = 'none';
                        body.classList.remove('coming-out-of-warp');
                    }
                })
                .from(".main-portfolio-content", {
                    opacity: 0, y: 30, duration: 1.0, ease: "expo.out"
                }, "-=0.3");
        }
        sessionStorage.removeItem('warpActivated');
    } else {
        gsap.from(".main-portfolio-content", {
            opacity: 0, y: 20, duration: 1.0, delay: 0.2, ease: "expo.out"
        });
    }

    // --- GSAP ScrollTrigger Animations for Portfolio Content ---
    gsap.utils.toArray('.planet-section').forEach((section) => { // Ensure class name matches portfolio.html
        const heading = section.querySelector('.planet-title'); // Ensure class name matches
        const cards = section.querySelectorAll('.info-card-planet'); // Ensure class name matches

        const tlSection = gsap.timeline({
            scrollTrigger: {
                trigger: section, start: "top 80%", // Adjusted trigger point
                toggleClass: { targets: section, className: "is-visible" },
                once: true
            }
        });

        if (heading) {
            tlSection.fromTo(heading,
                { opacity: 0, y: 35, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out" }
            );
        }
        if (cards.length > 0) {
            tlSection.fromTo(cards,
                { opacity: 0, y: 45, rotationX: -8, scale:0.97 },
                {
                    opacity: 1, y: 0, rotationX: 0, scale: 1,
                    duration: 0.65, stagger: 0.12, ease: "back.out(1.2)" // Slightly different ease
                },
                heading ? "-=0.4" : "+=0"
            );
        }
    });

    // --- Lottie Animations ---
    // Ensure Lottie IDs in portfolio.html are unique (e.g., lottie-code-portfolio)
    const lottiePortfolioFiles = {
        'lottie-code-portfolio': 'https://assets10.lottiefiles.com/packages/lf20_gflqnth6.json',
        'lottie-ai-portfolio': 'https://assets6.lottiefiles.com/packages/lf20_Lpuvb7.json',    
        'lottie-cloud-portfolio': 'https://assets3.lottiefiles.com/packages/lf20_x1gjdldd.json',
        'lottie-chatbot-portfolio': 'https://assets5.lottiefiles.com/packages/lf20_vPvaL1.json', 
        'lottie-rideshare-portfolio': 'https://assets8.lottiefiles.com/packages/lf20_0glp98eq.json',
        'lottie-taskmanager-portfolio': 'https://assets6.lottiefiles.com/packages/lf20_ofa3xwo7.json',
        'lottie-recsys-portfolio': 'https://assets10.lottiefiles.com/packages/lf20_gwnFpm.json', 
        'lottie-lulc-portfolio': 'https://assets4.lottiefiles.com/packages/lf20_mDVAq5.json' 
    };
    for (const id in lottiePortfolioFiles) {
        const container = document.getElementById(id);
        if (container && typeof lottie !== 'undefined') {
            try {
                lottie.loadAnimation({
                    container: container, renderer: 'svg', loop: true, autoplay: true, path: lottiePortfolioFiles[id]
                });
            } catch (e) { console.warn("Lottie (Portfolio) failed for:", id, e); }
        } else if (typeof lottie === 'undefined' && container) {
            console.warn("Lottie library not loaded, cannot animate icon for:", id);
        }
    }

    // --- Dynamic Year ---
    const yearSpanPortfolio = document.getElementById('currentYearPortfolio'); // Ensure unique ID
    if (yearSpanPortfolio) yearSpanPortfolio.textContent = new Date().getFullYear();

    console.log("Portfolio page setup complete. Awaiting user navigation.");
});