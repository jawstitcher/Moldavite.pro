const coolNames = [
    "Jörmungandr", "Australite", "Mjölnir", "Bediasite", "Yggdrasil", 
    "Surt", "Fenrir", "Irawan", "Valhalla", "Gungnir", "Bifröst", 
    "Tektite", "Chintamani", "Philippinite", "Indochinite", "Ivoryite"
];

document.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('intro-screen');
    const nameInput = document.getElementById('moldavite-name');
    const suggestBtn = document.getElementById('suggest-btn');
    const awakenBtn = document.getElementById('awaken-btn');
    
    // Auto-suggest a name initially
    nameInput.value = generateRandomName();

    suggestBtn.addEventListener('click', () => {
        nameInput.value = generateRandomName();
        // Little spin animation for the suggest button
        suggestBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            suggestBtn.style.transition = 'none';
            suggestBtn.style.transform = 'rotate(0deg)';
            setTimeout(() => suggestBtn.style.transition = 'transform 0.4s ease', 50);
        }, 400);
    });

    awakenBtn.addEventListener('click', () => {
        const finalName = nameInput.value.trim() || 'Moldormr';
        
        // Hide intro screen with a nice fade out
        introScreen.style.opacity = '0';
        introScreen.style.pointerEvents = 'none';
        
        // Dispatch custom event to notify scene.js to start the game loop
        window.dispatchEvent(new CustomEvent('awakenMoldavite', { detail: { name: finalName } }));
    });

    function generateRandomName() {
        return coolNames[Math.floor(Math.random() * coolNames.length)];
    }
});
