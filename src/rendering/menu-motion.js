(() => {
    const menu = document.querySelector('#start-screen .menu-grid');
    if (!menu || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tiles = menu.querySelectorAll('.menu-tile');
    tiles.forEach(tile => {
        tile.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') return;
            const r = tile.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5;
            const y = (e.clientY - r.top) / r.height - .5;
            tile.style.setProperty('--mx', (x * 2.2).toFixed(2) + 'deg');
            tile.style.setProperty('--my', (y * -2.2).toFixed(2) + 'deg');
            tile.style.transform = 'perspective(500px) rotateX(var(--my)) rotateY(var(--mx)) translateY(-2px)';
        });
        tile.addEventListener('pointerleave', () => {
            tile.style.transform = '';
        });
    });
})();
