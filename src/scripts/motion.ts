// Camada de movimento da landing page (diretriz 2.5 e decisão D6).
// Base: IntersectionObserver dispara, e transições CSS correm no tempo. Nada lê layout durante o scroll.
// Sem html.motion (sem JS ou com Reduzir movimento), só os passos e os vídeos respondem ao toque:
// nada se mexe sozinho e o resto já está no estado final.

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
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const el of document.querySelectorAll("[data-reveal]")) io.observe(el);

  // Hero: roteiro que simula o uso do app (data-enter, data-tap, data-hold e data-word em cada tela).
  // Antes de sair de uma tela, um toque aparece no ponto marcado; a próxima entra subindo (folha),
  // com fade ou de uma vez (valor digitado). No veredito, só a palavra dele fica acesa na headline.
  // Pausa fora da tela, com a aba escondida ou pelo botão (WCAG 2.2.2).
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const heroPhone = hero?.querySelector<HTMLElement>("[data-layers]");
  if (hero && heroPhone) {
    const layers = [...heroPhone.querySelectorAll<HTMLElement>(".layer")];
    const words = [...hero.querySelectorAll<HTMLElement>("[data-word]")].filter((w) => !w.classList.contains("layer"));
    const tap = heroPhone.querySelector<HTMLElement>(".tap");
    const toggle = hero.querySelector<HTMLButtonElement>("[data-hero-toggle]")!;
    const sheet = "cubic-bezier(0.32, 0.72, 0, 1)";
    const move = "cubic-bezier(0.77, 0, 0.175, 1)";
    let i = 0;
    let z = 1;
    let timer = 0;
    let visible = true;
    let userPaused = false;

    const light = (l: HTMLElement) => {
      const word = l.dataset.word === undefined ? -1 : Number(l.dataset.word);
      hero.classList.toggle("calm", word < 0);
      words.forEach((w, j) => w.classList.toggle("is-lit", j === word));
    };
    const show = async (n: number, animate = true) => {
      const l = layers[n];
      l.style.zIndex = String(++z);
      l.classList.add("is-active");
      light(l);
      const kind = animate ? l.dataset.enter : "cut";
      if (kind === "rise")
        await l.animate([{ opacity: 0, transform: "translateY(6%)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: sheet }).finished;
      else if (kind === "fade") await l.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: move }).finished;
      layers.forEach((o) => o !== l && o.classList.remove("is-active"));
    };
    const press = async (l: HTMLElement) => {
      if (!tap || !l.dataset.tap) return;
      const [x, y] = l.dataset.tap.split(",");
      tap.style.left = `${x}%`;
      tap.style.top = `${y}%`;
      await tap.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)" },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.35 },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1.15)" },
        ],
        { duration: 520, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      ).finished;
    };
    const running = () => visible && !userPaused && !document.hidden;
    const step = async () => {
      await press(layers[i]);
      if (!running()) return;
      i = (i + 1) % layers.length;
      await show(i);
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (running()) timer = window.setTimeout(step, Number(layers[i].dataset.hold) || 1500);
    };

    show(0, false);
    heroPhone.dataset.ready = "";
    hero.dataset.ready = "";
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      toggle.textContent = userPaused ? "Continuar animação" : "Pausar animação";
      schedule();
    });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      schedule();
    }).observe(heroPhone);
    document.addEventListener("visibilitychange", schedule);
  }

  // Barra fixa: o "Em breve" (ou "Baixar") aparece quando o CTA do hero sai da tela.
  const nav = document.querySelector<HTMLElement>(".nav");
  const heroCta = document.querySelector("#hero .cta");
  if (nav && heroCta) {
    nav.dataset.ready = "";
    new IntersectionObserver(([e]) => nav.classList.toggle("cta-shown", !e.isIntersecting)).observe(heroCta);
  }
}

// Passos: tocar numa linha troca a tela do iPhone (com ou sem movimento). Com movimento e visível,
// avança sozinho a cada 4,5 s; para de vez quando a pessoa escolhe uma linha, e pausa fora da tela.
for (const block of document.querySelectorAll<HTMLElement>("[data-steps]")) {
  const phone = block.querySelector<HTMLElement>("[data-layers]");
  if (!phone) continue;
  const layers = [...phone.querySelectorAll<HTMLElement>(".layer")];
  const rows = [...block.querySelectorAll<HTMLButtonElement>("[data-step]")];
  let i = 0;
  let timer = 0;
  let visible = false;
  let chosen = false;
  const show = (n: number) => {
    i = n;
    layers.forEach((l, j) => l.classList.toggle("is-active", j === n));
    rows.forEach((r, j) => r.setAttribute("aria-pressed", String(j === n)));
  };
  const sync = () => {
    clearInterval(timer);
    if (motion && visible && !chosen && !document.hidden) timer = window.setInterval(() => show((i + 1) % layers.length), 4500);
  };
  rows.forEach((r, j) =>
    r.addEventListener("click", () => {
      chosen = true;
      show(j);
      sync();
    }),
  );
  show(0);
  phone.dataset.ready = "";
  block.dataset.ready = "";
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      sync();
    },
    { threshold: 0.4 },
  ).observe(block);
  document.addEventListener("visibilitychange", sync);
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
