function isWhatsAppLoaded() {
  const chatList = document.querySelector('[id="pane-side"]');
  const headerElement = document.querySelector("header");
  return !!chatList || !!headerElement;
}

function injectScript(file) {
  try {
    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL(file);
    script.onload = function () {
      console.log(`✅ file ${file} injetado com sucesso!`);
      script.remove();
    };
    document.head.appendChild(script);
  } catch (e) {
    console.error(`❌ Erro ao injetar file ${file}:`, e);
  }
}

const checkInterval = setInterval(() => {
  if (isWhatsAppLoaded()) {
    console.log("✅ WhatsApp Web carregado e pronto!");

    injectScript("lib/whatsapp.js");
    injectScript("Injected/index.js");

    clearInterval(checkInterval);
  } else {
    console.log("⏳ Aguardando WhatsApp Web carregar...");
  }
}, 2000);
