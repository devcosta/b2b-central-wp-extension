window.addEventListener("wpp-b2b-connection", () => {
  chrome.runtime.sendMessage({ type: "HELLO_WORLD" }, (response) => {
    window.dispatchEvent(
      new CustomEvent("wpp-b2b-connection-response", { detail: response })
    );
  });
});

window.addEventListener("send-to-whatsapp", (e) => {
  const { number, message, mediaUrl } = e.detail;
  console.log("🚀 [SaaS] Evento send-to-whatsapp recebido", { number, message, mediaUrl });

  chrome.runtime.sendMessage(
    {
      type: "SEND_MESSAGE",
      number,
      message,
      mediaUrl,
    },
    (response) => {
      window.dispatchEvent(
        new CustomEvent("send-to-whatsapp-response", { detail: response })
      );
    }
  );
});
