// js/portfolio.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio page systems online.");
    const body = document.body;
    const warpArrivalOverlay = document.getElementById('warpArrivalOverlay');
    const spaceshipCursorElementPortfolio = document.getElementById('spaceshipCursorPortfolio'); // Ensure this ID exists in portfolio.html

    // --- Spaceship Cursor for Portfolio Page ---
    function updatePortfolioSpaceshipCursor(event) {
        if (!spaceshipCursorElementPortfolio) return;
        spaceshipCursorElementPortfolio.style.left = `${event.clientX}px`;
        spaceshipCursorElementPortfolio.style.top = `${event.clientY}px`;
        
        const dx = event.clientX - (window.innerWidth / 2);
        const dy = event.clientY - (window.innerHeight / 2);
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        spaceshipCursorElementPortfolio.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
    if (spaceshipCursorElementPortfolio) { // Check if element exists before adding listener
        window.addEventListener('mousemove', updatePortfolioSpaceshipCursor);
        document.querySelectorAll('a, button').forEach(el => {
            el.style.cursor = 'none';
        });
    }


    // --- Warp Arrival Animation ---
    if (sessionStorage.getItem('warpActivated') === 'true') {
        console.log("Hyperdrive disengaged. Arrival at portfolio coordinates.");
        body.classList.add('coming-out-of-warp');

        if (warpArrivalOverlay) {
            const tlArrival = gsap.timeline();
            tlArrival
                .set(warpArrivalOverlay, { opacity: 1, display: 'block' })
                .to(warpArrivalOverlay, {
                    opacity: 0,
                    duration: 0.7, // Faster fade from white
                    ease: "power2.out",
                    onComplete: () => {
                        if (warpArrivalOverlay) warpArrivalOverlay.style.display = 'none';
                        body.classList.remove('coming-out-of-warp');
                    }
                })
                .from(".main-portfolio-content", { // Animate in main content after overlay
                    opacity: 0,
                    y: 40, // Slide in from bottom
                    duration: 1.0, // Slower, more graceful entry
                    ease: "expo.out"
                }, "-=0.4"); // Overlap slightly with overlay fade
        }
        sessionStorage.removeItem('warpActivated');
    } else {
        // If not arriving from warp, just animate in content normally
        gsap.from(".main-portfolio-content", {
            opacity: 0,
            y: 20,
            duration: 1.2,
            delay: 0.3, // Slight delay
            ease: "expo.out"
        });
    }

    // --- GSAP ScrollTrigger Animations for Portfolio Content ---
    gsap.utils.toArray('.planet-section').forEach((section, index) => {
        const heading = section.querySelector('.planet-title');
        const cards = section.querySelectorAll('.info-card-planet');

        const tlSection = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 75%", // Trigger a bit earlier
                end: "bottom 25%",
                toggleClass: { targets: section, className: "is-visible" }, // For heading underline animation
                // markers: true, // Uncomment for debugging
                once: true // Animation plays once per section
            }
        });

        if (heading) {
            tlSection.fromTo(heading,
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
            );
        }

        if (cards.length > 0) {
            tlSection.fromTo(cards,
                { opacity: 0, y: 40, rotationX: -10, scale:0.98 }, // Slight 3D tilt effect
                {
                    opacity: 1, y: 0, rotationX: 0, scale: 1,
                    duration: 0.7,
                    stagger: 0.15, // Stagger animation of cards
                    ease: "back.out(1.4)" // A bouncier ease
                },
                heading ? "-=0.5" : "+=0" // Overlap with heading animation
            );
        }
    });


    // --- Lottie Animations (Ensure Lottie player is loaded in portfolio.html if used) ---
    // Make sure to add <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
    // to portfolio.html if you intend to use Lottie icons here as well.
    // For now, this is just a placeholder, assuming Lottie might be used.
    const lottiePortfolioFiles = { /* Define Lottie files if needed for this page */ };
    for (const id in lottiePortfolioFiles) {
        const container = document.getElementById(id); // Make sure these IDs exist on portfolio.html
        if (container && typeof lottie !== 'undefined') {
            try {
                lottie.loadAnimation({
                    container: container, renderer: 'svg', loop: true, autoplay: true, path: lottiePortfolioFiles[id]
                });
            } catch (e) { console.warn("Lottie (Portfolio) failed for:", id, e); }
        }
    }

    // --- Placeholder for Planet-Specific Three.js Backgrounds ---
    // This would involve creating a Three.js scene for each '.planet-background-canvas'
    // and initializing it, possibly when it scrolls into view.
    // Example:
    // const aboutPlanetCanvas = document.getElementById('about-planet-canvas');
    // if (aboutPlanetCanvas) {
    //     // initPlanetScene(aboutPlanetCanvas, { type: 'terrestrial', texture: 'path/to/earth.jpg' });
    // }
    // function initPlanetScene(canvasEl, config) { /* ... Three.js planet logic ... */ }


    console.log("Portfolio page interactive elements and animations initialized.");
});