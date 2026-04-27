const crawl = document.querySelector(".star-wars-crawl");

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = scrollTop / maxScroll;

  const y = 100 - progress * 180;
  const scale = 0.45 + progress * 1.2;
  const opacity = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  crawl.style.top = `${y}%`;
  crawl.style.transform = `
    translateX(-50%)
    rotateX(25deg)
    scale(${scale})
  `;
  crawl.style.opacity = opacity;
});