let scene, camera, renderer, particles;
let particleCount = 5000;
let particleSize = 0.05;
let sensitivity = 1.0;
let audioContext, analyser, dataArray;
let audioSource;
let cameraAngle = 0;
let raycaster, mouse;
let particleWidth = 80;
let isAudioLoaded = false;
let isAudioStarted = false;
let isControlsActive = false;
let redirectTimer;
let audioTimer;
const AUDIO_DURATION = 196; // 3:16 in seconds
const MODAL_SHOW_TIME = 30; // Show modal 30 seconds before the end

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createParticles();

    camera.position.z = 40;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    const particleCountSlider = document.getElementById('particleCountSlider');
    particleCountSlider.addEventListener('input', function() {
        if (isControlsActive) {
            particleCount = parseInt(this.value);
            createParticles();
        }
    });

    const sizeSlider = document.getElementById('sizeSlider');
    sizeSlider.addEventListener('input', function() {
        if (isControlsActive) {
            particleSize = parseFloat(this.value);
            createParticles();
        }
    });

    const sensitivitySlider = document.getElementById('sensitivitySlider');
    sensitivitySlider.addEventListener('input', function() {
        if (isControlsActive) {
            sensitivity = parseFloat(this.value);
        }
    });

    const widthSlider = document.getElementById('widthSlider');
    widthSlider.addEventListener('input', function() {
        if (isControlsActive) {
            particleWidth = parseInt(this.value);
            createParticles();
        }
    });

    document.addEventListener('mousemove', onMouseMove, false);

    const toggleSlidersButton = document.getElementById('toggleSliders');
    const slidersContent = document.getElementById('slidersContent');
    const controls = document.querySelector('.controls');
    toggleSlidersButton.addEventListener('click', function() {
        if (isControlsActive) {
            if (slidersContent.style.display === 'none') {
                slidersContent.style.display = 'block';
                controls.classList.add('open');
            } else {
                slidersContent.style.display = 'none';
                controls.classList.remove('open');
            }
        }
    });

    const fullScreenButton = document.getElementById('fullScreenButton');
    fullScreenButton.addEventListener('click', function() {
        if (isControlsActive) {
            toggleFullScreen();
        }
    });

    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', startAudio);

    const aboutButton = document.getElementById('aboutButton');
    aboutButton.addEventListener('click', openModal);

    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('aboutModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    setupAudioContext();
    startGlyphCounter();
    animate();
}

function createParticles() {
    if (particles) scene.remove(particles);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        resetParticle(positions, colors, i);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: particleSize,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function resetParticle(positions, colors, index) {
    positions[index] = (Math.random() - 0.5) * particleWidth;
    positions[index + 1] = (Math.random() - 0.5) * (particleWidth / 2);
    positions[index + 2] = (Math.random() - 0.5) * (particleWidth / 2);

    colors[index] = Math.random();
    colors[index + 1] = Math.random();
    colors[index + 2] = Math.random();
}

function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function generateRandomGlyph() {
    const glyphs = '[÷≠≈∞±∑∫∂√∆Ω∏@€£¶÷±πφ⊗⊕⊙⌐¬×°″℮]';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += glyphs[Math.floor(Math.random() * glyphs.length)];
    }
    return result;
}

function startGlyphCounter() {
    let counter = 0;
    const maxCounter = 400;
    const duration = 2000; // 3 seconds
    const interval = duration / maxCounter;
    const glyphChangeInterval = 30; // Change glyph every 50ms for a more dynamic effect

    const counterElement = document.getElementById('percentageCounter');
    const startButton = document.getElementById('startButton');
    
    const updateGlyph = () => {
        counterElement.textContent = generateRandomGlyph();
    };

    const updateCounter = () => {
        counter++;
        
        if (counter >= maxCounter) {
            clearInterval(counterInterval);
            clearInterval(glyphInterval);
            counterElement.style.display = 'none';
            startButton.style.display = 'inline-block';
            startButton.style.color = '#4BA481'; // Set text color to green
        }
    };

    const counterInterval = setInterval(updateCounter, interval);
    const glyphInterval = setInterval(updateGlyph, glyphChangeInterval);
}

function startAudio() {
    console.log('Start button clicked');
    const startButton = document.getElementById('startButton');
    startButton.style.display = 'none';

    loadAudio();
}

function activateControls() {
    console.log('Activating controls');
    isControlsActive = true;
    const inactiveElements = document.querySelectorAll('.inactive');
    inactiveElements.forEach(element => {
        element.classList.remove('inactive');
        console.log('Removed inactive class from:', element);
    });
    console.log('Controls activated');
}

function loadAudio() {
    console.log('Loading audio');
    fetch('https://audio.jukehost.co.uk/zUB1SLo69unK7KIszyg0y1SoMAye8jQy')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            if (audioSource) {
                audioSource.disconnect();
            }
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(analyser);
            audioSource.connect(audioContext.destination);
            audioSource.start(0);
            isAudioLoaded = true;
            console.log('Audio loaded and started');
            
            // Activate controls after audio is loaded
            activateControls();

            // Start the audio timer
            startAudioTimer();

            // Set up redirection after audio ends
            audioSource.onended = function() {
                setTimeout(redirectToLinkedIn, 500); // Redirect 0.5 seconds after audio ends
            };
        })
        .catch(error => {
            console.error('Failed to load audio:', error);
            alert('Failed to load audio. The animation will continue without audio reactivity.');
            // Activate controls even if audio fails to load
            activateControls();
        });
}

function startAudioTimer() {
    let timeElapsed = 0;
    audioTimer = setInterval(() => {
        timeElapsed++;
        if (timeElapsed === AUDIO_DURATION - MODAL_SHOW_TIME) {
            handleModalOpen();
        }
        if (timeElapsed >= AUDIO_DURATION) {
            clearInterval(audioTimer);
        }
    }, 1000);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);

    if (isAudioLoaded) {
        analyser.getByteFrequencyData(dataArray);
    }

    const positions = particles.geometry.attributes.position.array;
    const colors = particles.geometry.attributes.color.array;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(particles);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];

        let audioData = 0;
        if (isAudioLoaded) {
            const distance = Math.sqrt(x * x + y * y + z * z);
            const index = Math.floor((distance / particleWidth) * dataArray.length);
            audioData = dataArray[index] / 255.0;
        } else {
            // Fallback animation when audio is not loaded
            audioData = (Math.sin(Date.now() * 0.001 + i * 0.1) + 1) * 0.5;
        }

        positions[i3 + 2] = z + (audioData - 0.5) * sensitivity;

        // Check if particle is off the scene and reset it
        if (Math.abs(x) > particleWidth / 2 || Math.abs(y) > particleWidth / 4 || Math.abs(z) > particleWidth / 4) {
            resetParticle(positions, colors, i3);
        }

        if (intersects.length > 0 && intersects[0].index === i) {
            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1;
        } else {
            colors[i3] = audioData;
            colors[i3 + 1] = 1 - audioData;
            colors[i3 + 2] = 0.5;
        }
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;

    cameraAngle += 0.005;
    camera.position.x = Math.sin(cameraAngle) * (particleWidth / 2);
    camera.position.z = Math.cos(cameraAngle) * (particleWidth / 2);
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function openModal() {
    if (isControlsActive) {
        handleModalOpen();
    }
}

function handleModalOpen() {
    const modal = document.getElementById('aboutModal');
    modal.style.display = 'flex';
    const terminalText = document.querySelector('.terminal-text');
    terminalText.innerHTML = '';
    typeText("This is the first of a series of experiments I've been doing with Claude and Cursor.\n\nMore are on the way, so if you're interested, watch this space.\n\nIn the meantime let's connect:\n\nGitHub: https://github.com/mayberui\nLinkedIn: https://linkedin.com/in/mayberui");
}

function typeText(text) {
    const terminalText = document.querySelector('.terminal-text');
    terminalText.innerHTML = ''; // Clear existing content
    let i = 0;
    let currentLine = '';
    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'cursor';
    cursorSpan.textContent = '';
    terminalText.appendChild(cursorSpan);

    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '\n') {
                currentLine += '<br>';
                terminalText.innerHTML = currentLine;
                terminalText.appendChild(cursorSpan);
            } else {
                currentLine += text.charAt(i);
                terminalText.innerHTML = currentLine;
                terminalText.appendChild(cursorSpan);
            }
            i++;
            setTimeout(type, 15);
        }
    }
    type();
}

function redirectToLinkedIn() {
    window.location.href = 'https://linkedin.com/in/mayberui';
}

function closeModal() {
    const modal = document.getElementById('aboutModal');
    modal.style.display = 'none';
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('DOMContentLoaded', init);