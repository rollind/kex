document.addEventListener("DOMContentLoaded", () => {
  const wishButton = document.querySelector(".wish-button");
  const wishSection = document.querySelector("#birthday-wish");
  const qrForm = document.querySelector(".qr-form");
  const pageLink = document.querySelector("#page-link");
  const qrStatus = document.querySelector("#qr-status");
  const qrTarget = document.querySelector(".qr-code");
  const downloadButton = document.querySelector(".download-qr");
  const canvas = document.querySelector(".confetti");
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let qrReady = false;
  let confetti = [];
  let animationFrame = 0;

  function hasPublicUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function makeQr(value) {
    if (!window.QRCode) {
      qrStatus.textContent = "The QR-code tool could not load. Check your connection and try again.";
      return;
    }
    qrTarget.replaceChildren();
    new window.QRCode(qrTarget, {
      text: value,
      width: 192,
      height: 192,
      colorDark: "#211a32",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H
    });
    qrReady = true;
    downloadButton.disabled = false;
    qrStatus.textContent = "Your birthday QR code is ready to download and share.";
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function animateConfetti() {
    if (reducedMotion) return;
    resizeCanvas();
    const colors = ["#ff9eb8", "#f6d69b", "#fff8ed", "#bd91d3", "#fdc9a5"];
    confetti = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight,
      width: 4 + Math.random() * 5,
      height: 6 + Math.random() * 8,
      speed: 1.8 + Math.random() * 3.5,
      drift: (Math.random() - .5) * 1.8,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - .5) * .12,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    const start = performance.now();
    const draw = (now) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const piece of confetti) {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.rotation += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        context.restore();
      }
      if (now - start < 4600) {
        animationFrame = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(draw);
  }

  wishButton.addEventListener("click", () => {
    const opening = wishSection.hidden;
    wishSection.hidden = !opening;
    wishButton.setAttribute("aria-expanded", String(opening));
    wishButton.innerHTML = opening
      ? 'Your birthday wish is open <span aria-hidden="true">♥</span>'
      : 'Open your birthday wish <span aria-hidden="true">✦</span>';
    if (opening) {
      animateConfetti();
      wishSection.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    } else {
      wishButton.focus();
    }
  });

  qrForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = pageLink.value.trim();
    if (!hasPublicUrl(value)) {
      qrStatus.textContent = "Enter a valid public link starting with https:// to make a scannable QR code.";
      pageLink.focus();
      return;
    }
    makeQr(value);
  });

  downloadButton.addEventListener("click", () => {
    if (!qrReady) return;
    const qrCanvas = qrTarget.querySelector("canvas");
    const qrImage = qrTarget.querySelector("img");
    let imageUrl;
    if (qrCanvas) {
      imageUrl = qrCanvas.toDataURL("image/png");
    } else if (qrImage?.complete && qrImage.naturalWidth > 0) {
      const output = document.createElement("canvas");
      output.width = qrImage.naturalWidth;
      output.height = qrImage.naturalHeight;
      output.getContext("2d").drawImage(qrImage, 0, 0);
      imageUrl = output.toDataURL("image/png");
    }
    if (!imageUrl) {
      qrStatus.textContent = "The QR code is still loading. Please try again in a moment.";
      return;
    }
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "birthday-qr-code.png";
    link.click();
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  if (hasPublicUrl(window.location.href)) {
    pageLink.value = window.location.href;
    if (window.QRCode) makeQr(window.location.href);
    else {
      const qrScript = document.querySelector('script[src*="qrcodejs"]');
      qrScript?.addEventListener("load", () => makeQr(window.location.href), { once: true });
      qrScript?.addEventListener("error", () => {
        qrStatus.textContent = "The QR-code tool could not load. Check your connection and try again.";
      }, { once: true });
    }
  }
});
