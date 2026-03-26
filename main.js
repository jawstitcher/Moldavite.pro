const alienPhrases = [
    "ᚠᚢᚦᚨᚱᚲ ᚷᚹᚺᚾᛁᛃ",
    "អង្គរវត្ត ព្រះវិហារ",
    "ᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ",
    "នាគរាជ គ្រុឌ",
    "ᚼᚾᛁᛅᛋᛏᛒᛘᛚᛦ",
    "សួស្តី ពិភពលោក",
];

const typingSpeedAlien = 100; // ms per char
const typingSpeedEnglish = 50;
const pauseBetweenPhrases = 2000;
const timeBeforeNoticingUser = 10000; // 10 seconds of alien mumbling

document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.getElementById('moldormr-text');
    const tabletContainer = document.getElementById('tablet-container');
    const userInputSection = document.getElementById('user-input-section');
    const greetingText = document.getElementById('greeting-text');
    const userResponseInput = document.getElementById('user-response');
    const sendBtn = document.getElementById('send-btn');
    
    let isAlienTyping = true;
    let currentPhraseIdx = 0;
    
    // Start alien typing sequence
    typeAlienPhrase();
    
    // Schedule stopping alien mumbling and switching to English
    setTimeout(() => {
        isAlienTyping = false;
        transitionToEnglish();
    }, timeBeforeNoticingUser);

    function typeAlienPhrase() {
        if (!isAlienTyping) return;
        
        const phrase = alienPhrases[currentPhraseIdx % alienPhrases.length];
        currentPhraseIdx++;
        
        textElement.textContent = '';
        let charIdx = 0;
        
        function typeChar() {
            if (!isAlienTyping) return;
            
            if (charIdx < phrase.length) {
                textElement.textContent += phrase[charIdx];
                charIdx++;
                setTimeout(typeChar, typingSpeedAlien + (Math.random() * 50));
            } else {
                setTimeout(typeAlienPhrase, pauseBetweenPhrases);
            }
        }
        
        typeChar();
    }
    
    function transitionToEnglish() {
        // Clear alien text and add glitch effect or fade out
        textElement.style.opacity = '0';
        
        setTimeout(() => {
            textElement.className = 'english-text';
            textElement.textContent = '';
            textElement.style.opacity = '1';
            
            const englishIntro = "...Wait. A presence? Ah.";
            let charIdx = 0;
            
            function typeEnglishIntro() {
                if (charIdx < englishIntro.length) {
                    textElement.textContent += englishIntro[charIdx];
                    charIdx++;
                    setTimeout(typeEnglishIntro, typingSpeedEnglish);
                } else {
                    // Show interaction section after a short pause
                    setTimeout(() => {
                        tabletContainer.classList.add('hidden');
                        userInputSection.classList.remove('hidden');
                        typeFinalGreeting();
                    }, 1500);
                }
            }
            typeEnglishIntro();
        }, 1000);
    }

    function typeFinalGreeting() {
        const fullGreeting = "I marvel at your magnificence! traveler, you have brought me just what I was looking for... a piece of mind. To return this gift I will grant you a piece of mine.";
        greetingText.textContent = '';
        let charIdx = 0;
        
        function typeChar() {
            if (charIdx < fullGreeting.length) {
                greetingText.textContent += fullGreeting[charIdx];
                charIdx++;
                setTimeout(typeChar, typingSpeedEnglish);
            }
        }
        
        typeChar();
    }

    // Interaction handling
    sendBtn.addEventListener('click', handleInteraction);
    userResponseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleInteraction();
    });

    function handleInteraction() {
        const val = userResponseInput.value.trim();
        if (!val) return;
        
        // Disable input while Moldormr "thinks"
        userResponseInput.disabled = true;
        sendBtn.disabled = true;
        
        // Simple response logic (in a real app this would call an LLM API)
        greetingText.textContent = "Processing your energy...";
        greetingText.style.fontStyle = 'normal';
        greetingText.style.color = 'var(--emerald-text)';
        
        setTimeout(() => {
            greetingText.textContent = `You offer "${val}"... I absorb this concept. It resonates within my crystalline structure. We are now linked.`;
            userResponseInput.value = '';
            userResponseInput.disabled = false;
            sendBtn.disabled = false;
            userResponseInput.focus();
        }, 2000);
    }
});
