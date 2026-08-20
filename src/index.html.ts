import { preloadGodot } from '@ringozz/godot/boot';

const splash = document.getElementById('splash');
const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
if (splash && link) {
  splash.style.backgroundImage = `url('${link.href}')`;
}

await preloadGodot();
await import('./index.ts');

if (splash) {
  splash.ontransitionend = () => splash.parentNode?.removeChild(splash);
  splash.style.transition = 'opacity 0.5s ease-in';
  splash.style.opacity = '0';
}
