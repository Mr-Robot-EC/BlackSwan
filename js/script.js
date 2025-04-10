document.addEventListener("DOMContentLoaded", function () {
    let currentCardIndex = 1;
    const totalCards = 12;
    let collectedPayloadPieces = "";
    let challengeCompleted = false;
    let currentTypewriterTimeouts = [];

    //const TARGET_PAYLOAD = "eyJ1cmwiOiJodHRwczovL21yLXJvYm90LWV2Yy5naXRodWIuaW8vSGlkZGVuUGFnZS8iLCJydWxlcyI6eyIxIjoiaW5kZXggMDozLCBpbmRleDE6MiAuLiBldGMuIiwiMyI6IkNvbnZlcnQgZWFjaCBudW1iZXIgaW50byBpdHMgQVNDSUkgcmVwcmVzZW50YXRpb24uIn19";

    // Matrix rain setup
    const rainCanvas = document.getElementById('matrix');
    const ctxRain = rainCanvas ? rainCanvas.getContext('2d') : null;
    let rainInterval;
    let dropsRain = [];
    let columnsRain = 0;
    const fontSizeRain = 16;
    let matrixCharsRain = [];

    console.log("Looking for something?");

    // Typewriter effect function
    function typeWriterEffect(element, text, speed, callback) {
        let i = 0;
        element.innerHTML = '';
        element.classList.add('typewriter-target');

        function type() {
            if (!currentTypewriterTimeouts.includes(timeoutId)) {
                element.classList.remove('typewriter-target');
                return;
            }
            if (i < text.length) {
                if (text.substring(i, i + 4).toLowerCase() === '<br>') {
                    element.innerHTML += '<br>';
                    i += 4;
                } else {
                    element.innerHTML += text.charAt(i);
                    i++;
                }
                const nextTimeoutId = setTimeout(type, speed);
                const index = currentTypewriterTimeouts.indexOf(timeoutId);
                if (index > -1) currentTypewriterTimeouts[index] = nextTimeoutId;
                timeoutId = nextTimeoutId;
            } else {
                element.classList.remove('typewriter-target');
                const index = currentTypewriterTimeouts.indexOf(timeoutId);
                if (index > -1) currentTypewriterTimeouts.splice(index, 1);
                if (callback) callback();
            }
        }
        
        let timeoutId = setTimeout(type, 5);
        currentTypewriterTimeouts.push(timeoutId);
    }

    // Clear all typewriter timeouts
    function clearTypewriterTimeouts() {
        const timeoutsToClear = [...currentTypewriterTimeouts];
        timeoutsToClear.forEach(clearTimeout);
        currentTypewriterTimeouts = [];
        
        document.querySelectorAll('.typewriter-target').forEach(el => {
            const originalText = el.getAttribute('data-original-text');
            if (originalText) el.innerHTML = originalText;
            el.classList.remove('typewriter-target');
        });
        
        // Make sure options are visible if interrupted
        document.querySelectorAll('.card.active .options').forEach(optDiv => {
            if(optDiv) optDiv.style.visibility = 'visible';
        });
        
        document.querySelectorAll('.card.active .option, .card.active .btn').forEach(btn => {
            if(btn) btn.style.opacity = '1';
        });
    }

    // Run typewriter effects on card elements
    async function runCardTypewriters(cardElement) {
        clearTypewriterTimeouts();
        const elementsToType = cardElement.querySelectorAll('[data-original-text]');
        const optionsDiv = cardElement.querySelector('.options');
        const buttons = cardElement.querySelectorAll('.option, .btn');

        if (optionsDiv) optionsDiv.style.visibility = 'hidden';
        buttons.forEach(btn => btn.style.opacity = '0');
        elementsToType.forEach(el => el.innerHTML = '');

        for (const el of elementsToType) {
            const text = el.getAttribute('data-original-text') || '';
            const speed = 15;
            await new Promise(resolve => typeWriterEffect(el, text, speed, resolve));
            if (currentTypewriterTimeouts.length === 0 && el.classList.contains('typewriter-target')) {
                console.log("...");
                return; 
            }
        }

        // Make options visible after typing finishes
        //console.log("Typing finished for card:", cardElement.id, "Making options visible.");
        if (optionsDiv) optionsDiv.style.visibility = 'visible';
        buttons.forEach(btn => btn.style.opacity = '1');
    }

    // Show a specific card
    function showCard(cardNumber) {
        if (challengeCompleted) return;
        //console.log("Showing card:", cardNumber);

        clearTypewriterTimeouts();

        document.querySelectorAll(".card").forEach((card) => {
            card.style.display = 'none';
            card.classList.remove("active");
        });

        const cardIdToShow = (cardNumber > totalCards) ? 'card-final' : `card-${cardNumber}`;
        const cardToShow = document.getElementById(cardIdToShow);

        if (cardToShow) {
            const optionsDiv = cardToShow.querySelector('.options');
            if (optionsDiv) optionsDiv.style.visibility = 'hidden';
            cardToShow.querySelectorAll('.option, .btn').forEach(btn => btn.style.opacity = '0');
            if (cardNumber <= totalCards) {
                cardToShow.querySelectorAll('[data-original-text]').forEach(el => el.innerHTML = '');
            }

            cardToShow.style.display = 'block';
            setTimeout(() => {
                cardToShow.classList.add("active");
                if (cardNumber <= totalCards) {
                    runCardTypewriters(cardToShow);
                } else {
                    challengeCompleted = true;
                    document.body.classList.add('final-room-active');
                    const finalButtons = cardToShow.querySelectorAll('.contact-link, .final-gift a, #restart-button');
                    finalButtons.forEach(btn => btn.style.opacity = '1');
                    checkAndFinalize();
                }
            }, 50);
        } else {
            console.error("Card not found:", cardIdToShow);
        }
    }
    /*
    // Check and finalize challenge completion
    function checkAndFinalize() {
        //console.log("Checking payload. Collected:", collectedPayloadPieces.length, "Target:", TARGET_PAYLOAD.length);
        if (collectedPayloadPieces === TARGET_PAYLOAD) {
            localStorage.setItem('blackSwanPayloadFragment', collectedPayloadPieces);
            console.log("Look deep down in your heart... where you store your memories");
            document.getElementById('final-message').style.display = 'none';
        } else {
            //console.error("Payload Mismatch! Challenge failed at final check.");
            document.getElementById('final-message').innerHTML = '<p style="color: var(--wrong-color);">Payload sequence mismatch. Memory corrupted.</p>';
            document.getElementById('final-message').style.display = 'block';
            localStorage.removeItem('blackSwanPayloadFragment');
        }
    }
    */
    function checkAndFinalize() {
        // Check if we've collected all 12 pieces (one from each card)
        const expectedPieceCount = totalCards; // We expect one piece per card
        
        // Get actual length of base64 data or count of distinct pieces
        const collectedPiecesLength = collectedPayloadPieces.length;
        
        console.log(`Collected ${collectedPiecesLength} characters from payload pieces`);
        
        // Check if we've collected pieces from all cards
        if (collectedPiecesLength > 0 && currentCardIndex > totalCards) {
            localStorage.setItem('blackSwanPayloadFragment', collectedPayloadPieces);
            console.log("Look deep down in your heart... where you store your memories");
            document.getElementById('final-message').style.display = 'none';
        } else {
            document.getElementById('final-message').innerHTML = '<p style="color: var(--wrong-color);">Payload sequence incomplete. Memory corrupted.</p>';
            document.getElementById('final-message').style.display = 'block';
            localStorage.removeItem('blackSwanPayloadFragment');
        }
    }

    // Complete the challenge
    function completeChallenge() {
        if (challengeCompleted) return;
        //console.log("Completing challenge");
        challengeCompleted = true;
        clearTypewriterTimeouts();

        document.body.classList.add('final-room-active');

        document.querySelectorAll(".card:not(#card-final)").forEach((card) => {
            card.style.display = 'none';
            card.classList.remove("active");
        });

        const finalCard = document.getElementById('card-final');
        const finalButtons = finalCard.querySelectorAll('.contact-link, .final-gift a, #restart-button');
        finalButtons.forEach(btn => btn.style.opacity = '1');

        finalCard.style.display = 'block';
        setTimeout(() => finalCard.classList.add('active'), 50);

        checkAndFinalize();
    }

    // Handle correct answer selection
    function handleCorrectAnswer(button) {
        if (challengeCompleted) return;
        //console.log("Correct answer on card:", currentCardIndex);
        clearTypewriterTimeouts();

        const piece = button.getAttribute('data-payload-piece');
        collectedPayloadPieces += piece;
        button.classList.add('correct-answer-flash');
        setTimeout(() => button.classList.remove('correct-answer-flash'), 400);

        setTimeout(() => {
            currentCardIndex++;
            if (currentCardIndex > totalCards) {
                completeChallenge();
            } else {
                showCard(currentCardIndex);
            }
        }, 500);
    }

    // Handle wrong answer selection
    function handleWrongAnswer(button) {
        if (challengeCompleted) return;
        //console.log("Wrong answer on card:", currentCardIndex);
        clearTypewriterTimeouts();

        if (button) button.classList.add('wrong-answer');
        document.body.style.backgroundColor = 'rgba(50, 0, 0, 0.5)';

        console.clear();
        //console.log("%cERROR: Sequence disrupted. Memory trace corrupted.", "color: #ff0000; font-weight: bold;");
        localStorage.removeItem('blackSwanPayloadFragment');

        setTimeout(() => {
            if (button) button.classList.remove('wrong-answer');
            document.body.style.backgroundColor = 'var(--bg-color)';
            restartExperience();
        }, 1000);
    }

    // Restart the experience
    function restartExperience() {
        console.clear();
        console.log("Curiosity killed the cat, but satisfaction brought it back.");
        console.log("Looking for something?");

        clearTypewriterTimeouts();
        document.body.classList.remove('final-room-active');
        
        if (rainCanvas) {
            rainCanvas.style.display = 'block';
            rainCanvas.style.opacity = '0.15';
            //console.log("Rain opacity set to:", rainCanvas.style.opacity);
            setupRain();
        } else {
            console.error("Rain canvas not found on restart.");
        }

        collectedPayloadPieces = "";
        localStorage.removeItem('blackSwanPayloadFragment');
        currentCardIndex = 1;
        challengeCompleted = false;
        
        document.querySelectorAll('.option, .btn').forEach(btn => {
            btn.style.backgroundColor = '';
            btn.style.opacity = '0';
            btn.classList.remove('correct-answer-flash', 'wrong-answer');
        });
        
        document.querySelectorAll('.options').forEach(optDiv => optDiv.style.visibility = 'hidden');

        document.getElementById('final-message').style.display = 'none';
        document.getElementById('final-message').innerHTML = '';

        document.querySelectorAll('[data-original-text]').forEach(el => el.innerHTML = '');

        showCard(currentCardIndex);
    }

    // MATRIX RAIN FUNCTIONS
    function setupRain() {
        if (!ctxRain) {
            console.error("Canvas context not available for rain.");
            return;
        }
        
        // Set canvas to full window size
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;
        
        // Character set for the rain
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        const katakana = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘﾇﾈﾉﾀﾁﾃﾄﾍﾎﾏﾑﾒﾕﾗﾘﾚﾛﾜﾝ';
        matrixCharsRain = (katakana + base64Chars + '0123456789').split('');
        
        // Calculate number of columns based on font size
        columnsRain = Math.floor(rainCanvas.width / fontSizeRain);
        
        // Initialize drops with random starting positions
        dropsRain = [];
        for (let i = 0; i < columnsRain; i++) {
            dropsRain[i] = Math.floor(Math.random() * -100); // Start above the canvas
        }
        
        // Clear any existing interval
        if (rainInterval) {
            clearInterval(rainInterval);
        }
        
        // Start the animation
        rainInterval = setInterval(drawManifestoRain, 33);
    }

    function drawManifestoRain() {
        if (!ctxRain || !rainCanvas) return;
        
        // Create fade effect by drawing semi-transparent black rectangle
        ctxRain.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctxRain.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
        
        // Green text for Matrix effect
        ctxRain.fillStyle = '#00ff00';
        ctxRain.font = fontSizeRain + 'px monospace';
        
        // Draw each drop
        for (let i = 0; i < dropsRain.length; i++) {
            // Choose a random character
            const charIndex = Math.floor(Math.random() * matrixCharsRain.length);
            const text = matrixCharsRain[charIndex];
            
            // Calculate position
            const x = i * fontSizeRain;
            const y = dropsRain[i] * fontSizeRain;
            
            // Draw the character
            ctxRain.fillText(text, x, y);
            
            // Reset drop to top when it goes below screen with random chance
            if (dropsRain[i] * fontSizeRain > rainCanvas.height && Math.random() > 0.975) {
                dropsRain[i] = 0;
            } else {
                // Move drop down
                dropsRain[i] += 0.5;
            }
        }
    }

    // EVENT LISTENERS
    // Option buttons event listeners
    document.querySelectorAll(".option").forEach((button) => {
        button.addEventListener("click", function () {
            const isCorrect = this.getAttribute("data-correct") === "true";
            if (isCorrect) {
                handleCorrectAnswer(this);
            } else {
                handleWrongAnswer(this);
            }
        });
    });

    // Restart button event listener
    document.getElementById("restart-button").addEventListener("click", restartExperience);

    // External links event listeners
    document.querySelectorAll(".contact-link, .final-gift a").forEach((link) => {
        link.addEventListener("click", function (e) {
            //console.log("External protocol initiated. Clearing session cache.");
            localStorage.removeItem('blackSwanPayloadFragment');
            collectedPayloadPieces = "";
        });
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Reinitialize rain on resize
            if (rainCanvas) {
                setupRain();
            }
        }, 250);
    });

    // INITIALIZATION
    // Prepare card content for typewriter effect
    document.querySelectorAll('.card:not(#card-final)').forEach(card => {
        card.querySelectorAll('h2, p, h3').forEach(el => {
            if (!el.hasAttribute('data-original-text')) {
                el.setAttribute('data-original-text', el.innerHTML);
            }
            el.innerHTML = '';
        });
    });

    // Initialize the Matrix rain effect
    if (rainCanvas) {
        rainCanvas.style.display = 'block';
        rainCanvas.style.opacity = '0.15';
        setupRain();
        
        // Draw immediately once
        drawManifestoRain();
    } else {
        //console.error("Matrix canvas not found on initial load!");
    }

    // Show the first card
    showCard(currentCardIndex);
    });