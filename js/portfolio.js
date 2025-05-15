// js/portfolio.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio page loaded.");

    const spaceshipCursorElementPortfolio = document.getElementById('spaceshipCursorPortfolio');

    function updatePortfolioSpaceshipCursor(event) {
        if (!spaceshipCursorElementPortfolio) return;
        spaceshipCursorElementPortfolio.style.left = `${event.clientX}px`;
        spaceshipCursorElementPortfolio.style.top = `${event.clientY}px`;
        
        const dx = event.clientX - (window.innerWidth / 2);
        const dy = event.clientY - (window.innerHeight / 2);
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        spaceshipCursorElementPortfolio.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
    window.addEventListener('mousemove', updatePortfolioSpaceshipCursor);
    document.querySelectorAll('a, button').forEach(el => { // Ensure custom cursor on interactive elements
        el.style.cursor = 'none';
    });


    // Check if warp was activated (example)
    if (sessionStorage.getItem('warpActivated') === 'true') {
        console.log("Arrived via warp drive!");
        // TODO: Add a "warp cooldown" visual effect or welcome animation
        sessionStorage.removeItem('warpActivated'); // Clear flag
    }

    // Placeholder for initializing Three.js scenes for each planet section
    // And GSAP ScrollTrigger animations for content on this page.
    // Example for one planet:
    // const aboutPlanetCanvas = document.getElementById('about-planet-canvas');
    // if (aboutPlanetCanvas) {
    //     // initThreePlanet(aboutPlanetCanvas, {texture: 'path/to/about_texture.jpg', color: 0xff0000});
    // }

    // Example GSAP scroll animations for portfolio cards (adapt from previous magnum opus)
    // gsap.utils.toArray('.planet-section .info-card-planet').forEach(card => {
    //     gsap.from(card, {
    //         scrollTrigger: {
    //             trigger: card,
    //             start: "top 90%",
    //             end: "bottom 10%",
    //             toggleActions: "play none none none", // Play once on enter
    //             // markers: true,
    //         },
    //         opacity: 0,
    //         y: 50,
    //         duration: 0.8,
    //         ease: "power2.out"
    //     });
    // });
});

// function initThreePlanet(canvasElement, planetConfig) {
//     // Simplified Three.js scene for a single planet sphere
//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(75, canvasElement.clientWidth / canvasElement.clientHeight, 0.1, 1000);
//     camera.position.z = 5;
//     const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true, antialias: true });
//     renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);

//     const geometry = new THREE.SphereGeometry(2, 32, 32);
//     const material = new THREE.MeshStandardMaterial({ color: planetConfig.color || 0x0077ff });
//     if (planetConfig.texture) {
//         const textureLoader = new THREE.TextureLoader();
//         material.map = textureLoader.load(planetConfig.texture);
//     }
//     const planet = new THREE.Mesh(geometry, material);
//     scene.add(planet);

//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
//     scene.add(ambientLight);
//     const pointLight = new THREE.PointLight(0xffffff, 0.7);
//     pointLight.position.set(5, 5, 5);
//     scene.add(pointLight);

//     function animate() {
//         requestAnimationFrame(animate);
//         planet.rotation.y += 0.005;
//         renderer.render(scene, camera);
//     }
//     animate();
// }