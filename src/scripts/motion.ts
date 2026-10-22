// Camada de movimento da landing page (diretriz 2.5 e decisão D6).
// Base: IntersectionObserver dispara, e transições CSS correm no tempo. Nada lê layout durante o scroll.
// Sem html.motion (sem JS ou com Reduzir movimento), só os vídeos ganham controle: o resto já está no estado final.

declare global {
  interface Window {
    __motion?: boolean;
  }
}

const motion = document.documentElement.classList.contains("motion");
window.__motion = true;

const once = (els: Iterable<Element>, run: (el: HTMLElement) => void, options?: IntersectionObserverInit) => {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      run(e.target as HTMLElement);
    }
  }, options);
  for (const el of els) io.observe(el);
};

// Contagem do zero até o valor, uma vez, em cerca de 800 ms. O valor final já está no HTML.
const countUp = (el: HTMLElement) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null) && !/\d/.test(node.data));
  const match = node?.data.match(/\d{1,3}(?:\.\d{3})*(?:,\d+)?/);
  if (!node || !match) return;
  const [before, after] = [node.data.slice(0, match.index), node.data.slice(match.index! + match[0].length)];
  const decimals = match[0].split(",")[1]?.length ?? 0;
  const target = Number(match[0].replace(/\./g, "").replace(",", "."));
  const format = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const text = node;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 800);
    const eased = 1 - (1 - t) ** 3;
    text.data = before + format.format(target * eased) + after;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if (motion) {
  // Entradas: 8 px e opacidade em 450 ms; quem entra junto ganha 60 ms de intervalo,
  // a menos que o HTML já defina o atraso (--d), como nas linhas da conta.
  const io = new IntersectionObserver(
    (entries) => {
      let k = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", `${Math.min(k, 4) * 60}ms`);
        k++;
        el.classList.add("is-in");
        for (const n of el.querySelectorAll<HTMLElement>("[data-count]")) countUp(n);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const el of document.querySelectorAll("[data-reveal]")) io.observe(el);

  // Cenas fixas: o passo que cruza a faixa do meio da tela troca a tela do iPhone.
  // Só quando a cena fica fixa (mesma condição do CSS); senão, fica o estado final.
  if (matchMedia("(min-width: 735px), (min-height: 700px)").matches) {
    for (const scene of document.querySelectorAll<HTMLElement>("[data-scene]")) {
      const phone = scene.querySelector<HTMLElement>("[data-layers]");
      if (!phone) continue;
      const layers = [...phone.querySelectorAll<HTMLElement>(".layer")];
      const show = (i: number) => layers.forEach((l, j) => l.classList.toggle("is-active", i === j));
      show(0);
      phone.dataset.ready = "";
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) show(Number((e.target as HTMLElement).dataset.step));
        },
        { rootMargin: "-55% 0px -40% 0px" },
      );
      for (const step of scene.querySelectorAll("[data-step]")) io.observe(step);
    }
  }

  // Hero: um timer só troca a tela e acende a palavra da headline no mesmo instante.
  // Pausa fora da tela, com a aba escondida ou pelo botão (WCAG 2.2.2).
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const heroPhone = hero?.querySelector<HTMLElement>("[data-layers]");
  if (hero && heroPhone) {
    const layers = [...heroPhone.querySelectorAll<HTMLElement>(".layer")];
    const words = [...hero.querySelectorAll<HTMLElement>("[data-word]")];
    const map = layers.map((l) => Number(l.dataset.word));
    const toggle = hero.querySelector<HTMLButtonElement>("[data-hero-toggle]")!;
    let i = 0;
    let timer = 0;
    let visible = true;
    let userPaused = false;
    const show = () => {
      layers.forEach((l, j) => l.classList.toggle("is-active", j === i));
      words.forEach((w, j) => w.classList.toggle("is-lit", j === map[i]));
    };
    const sync = () => {
      clearInterval(timer);
      if (visible && !userPaused && !document.hidden) {
        timer = window.setInterval(() => {
          i = (i + 1) % layers.length;
          show();
        }, 2800);
      }
    };
    show();
    heroPhone.dataset.ready = "";
    hero.dataset.ready = "";
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      toggle.textContent = userPaused ? "Continuar animação" : "Pausar animação";
      sync();
    });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    }).observe(heroPhone);
    document.addEventListener("visibilitychange", sync);
  }

  // Barra fixa: o "Em breve" (ou "Baixar") aparece quando o CTA do hero sai da tela.
  const nav = document.querySelector<HTMLElement>(".nav");
  const heroCta = document.querySelector("#hero .cta");
  if (nav && heroCta) {
    nav.dataset.ready = "";
    new IntersectionObserver(([e]) => nav.classList.toggle("cta-shown", !e.isIntersecting)).observe(heroCta);
  }
}

// Vídeos: a fonte entra a cerca de 150vh; tocam quando visíveis e pausam fora.
// Se o play() falhar (Pouca Energia, navegador do Instagram) ou sem movimento, fica o poster e o botão.
for (const video of document.querySelectorAll<HTMLVideoElement>("video[data-src]")) {
  const button = video.closest("figure")?.querySelector<HTMLButtonElement>("[data-media-toggle]");
  let userPaused = !motion;
  const load = () => {
    if (!video.src) video.src = video.dataset.src!;
  };
  const label = () => {
    if (button) button.textContent = video.paused ? "Tocar" : "Pausar";
  };
  const play = () => {
    load();
    video.play().then(label, () => {
      userPaused = true;
      label();
    });
  };
  video.addEventListener("play", label);
  video.addEventListener("pause", label);
  if (button) {
    button.hidden = false;
    button.addEventListener("click", () => {
      userPaused = !video.paused;
      if (userPaused) video.pause();
      else play();
    });
  }
  // Sem movimento, nada baixa até a pessoa tocar.
  if (motion) once([video], load, { rootMargin: "150% 0px" });
  new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) video.pause();
      else if (!userPaused) play();
    },
    { threshold: 0.25 },
  ).observe(video);
}

export {};
