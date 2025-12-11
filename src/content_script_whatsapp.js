chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 WhatsApp recebeu mensagem:", message);

  if (message.type === "HELLO_WORLD_FROM_SAAS") {
    console.log("👋 Recebi um Hello World do SaaS!");
    sendResponse({
      success: true,
      message: "WhatsApp Web recebeu o Hello World com sucesso!"
    });
    return true;
  }

  if (message.type === "SEND_MESSAGE") {
    const { number, message: text, media } = message;

    // ... generated ID ...

    const uuid = WPP_Bridge_Utils.generateUniqueId();

    console.log(`📤 Enviando para ${number}: ${text} ${media ? `(Mídia presente)` : ''}`);

    const options = {};
    if (media) {
      options.media = media;
    }

    document.dispatchEvent(
      new CustomEvent("whatsappContentToWhatsappJs", {
        detail: { receiver: number, text: text, internalOptions: options, uid: uuid }
      })
    );

    sendResponse({ success: true, message: "Mensagem enviada com sucesso." });

    return true;
  }
});
