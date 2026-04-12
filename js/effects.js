Object.assign(App, {
    // Feedback Háptico (Vibração)
    haptic(type = 'light') {
        if (!window.navigator || !window.navigator.vibrate) return;

        switch (type) {
            case 'light':
                window.navigator.vibrate(10);
                break;
            case 'medium':
                window.navigator.vibrate(30);
                break;
            case 'heavy':
                window.navigator.vibrate([50, 30, 50]);
                break;
            case 'success':
                window.navigator.vibrate([10, 30, 10, 30]);
                break;
        }
    },

    // Efeito de Confete Customizado (Leve e rápido)
    triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Ajustar tamanho do canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const numberOfPieces = 100;
        const colors = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#ffffff'];

        for (let i = 0; i < numberOfPieces; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 5 + 2,
                opacity: 1
            });
        }

        const update = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            pieces.forEach(p => {
                p.y += p.speed;
                p.rotation += p.speed;
                p.opacity -= 0.005;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            if (pieces.some(p => p.opacity > 0)) {
                requestAnimationFrame(update);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        this.haptic('success');
        update();
    }
});
