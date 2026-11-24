(() => {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "./manifest.webmanifest";
  document.head.appendChild(manifest);

  const theme = document.createElement("meta");
  theme.name = "theme-color";
  theme.content = "#3c69b0";
  document.head.appendChild(theme);

  const appleIcon = document.createElement("link");
  appleIcon.rel = "apple-touch-icon";
  appleIcon.href = "./icon-192.png";
  document.head.appendChild(appleIcon);

  const status = document.createElement("div");
  status.id = "epa-offline-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.innerHTML = '<span class="epa-status-dot"></span><span class="epa-status-text">正在准备离线缓存</span>';
  document.body.appendChild(status);

  const install = document.createElement("button");
  install.id = "epa-install-button";
  install.type = "button";
  install.textContent = "安装到设备";
  install.hidden = true;
  document.body.appendChild(install);

  const style = document.createElement("style");
  style.textContent = `
    #epa-offline-status {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: min(360px, calc(100vw - 36px));
      padding: 10px 14px;
      border: 1px solid #d7cdb7;
      border-radius: 999px;
      background: rgba(255, 250, 240, .96);
      color: #4f596b;
      box-shadow: 0 8px 24px rgba(46, 69, 103, .12);
      font: 13px/1.45 "Microsoft YaHei", "PingFang SC", sans-serif;
      backdrop-filter: blur(12px);
      transition: opacity .25s ease, transform .25s ease;
    }
    #epa-offline-status.ready {
      border-color: #a8bea8;
      color: #315c3b;
      background: rgba(241, 248, 238, .97);
    }
    #epa-offline-status.offline {
      border-color: #d2a453;
      color: #7b5521;
      background: rgba(255, 246, 224, .97);
    }
    .epa-status-dot {
      width: 8px;
      height: 8px;
      flex: 0 0 auto;
      border-radius: 50%;
      background: #a5aab4;
    }
    #epa-offline-status.ready .epa-status-dot { background: #4d8d59; }
    #epa-offline-status.offline .epa-status-dot { background: #cf8f2d; }
    #epa-install-button {
      position: fixed;
      right: 18px;
      bottom: 66px;
      z-index: 9999;
      border: 0;
      border-radius: 999px;
      padding: 11px 18px;
      background: #3c69b0;
      color: white;
      box-shadow: 0 10px 26px rgba(60, 105, 176, .28);
      font: 700 14px/1 "Microsoft YaHei", "PingFang SC", sans-serif;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const setStatus = (text, mode = "") => {
    const textNode = status.querySelector(".epa-status-text");
    if (textNode) textNode.textContent = text;
    status.classList.toggle("ready", mode === "ready");
    status.classList.toggle("offline", mode === "offline");
  };

  if (!("serviceWorker" in navigator)) {
    setStatus("当前浏览器不支持离线缓存", "offline");
    return;
  }

  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    install.hidden = false;
  });
  install.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    install.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    install.hidden = true;
    setStatus("已安装，可离线打开", "ready");
  });

  const updateNetworkState = () => {
    if (!navigator.onLine) {
      setStatus("当前离线，已尝试读取本地缓存", "offline");
    } else {
      setStatus("离线缓存已就绪", "ready");
    }
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    setStatus("离线资源已更新", "ready");
  });
  window.addEventListener("online", updateNetworkState);
  window.addEventListener("offline", updateNetworkState);

  navigator.serviceWorker
    .register("./sw.js", { scope: "./" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      setStatus("离线缓存已就绪", "ready");
      updateNetworkState();
    })
    .catch(() => {
      setStatus("离线缓存准备失败", "offline");
    });

  setTimeout(() => {
    if (status.classList.contains("ready")) {
      status.style.opacity = "0.72";
    }
  }, 4500);
})();
