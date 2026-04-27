console.log("credits.js is loaded");
const crawl = document.querySelector(".star-wars-crawl");

function updateCreditsScroll() {
  if (!crawl) return;

  const scrollTop = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;

  const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

 const scale = 1 + progress * 0.8;   // start full size
const top = 80 - progress * 120;    // start higher up
  const opacity = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  crawl.style.top = `${top}%`;
  crawl.style.transform = `translateX(-50%) rotateX(25deg) scale(${scale})`;
  crawl.style.opacity = opacity;
}

window.addEventListener("scroll", updateCreditsScroll);
window.addEventListener("resize", updateCreditsScroll);

updateCreditsScroll();
