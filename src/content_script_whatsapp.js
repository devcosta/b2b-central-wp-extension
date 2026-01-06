chrome.runtime.onMessage.addListener((payload, sender, sendResponse) => {
  console.log("📨 WhatsApp recebeu mensagem:", payload);

  if (payload.type === "HELLO_WORLD_FROM_SAAS") {
    console.log("👋 Recebi um Hello World do SaaS!");
    sendResponse({
      success: true,
      message: "WhatsApp Web recebeu o Hello World com sucesso!"
    });
    return true;
  }

  if (payload.type === "SEND_MESSAGE") {
    const { number, message, media } = payload;

    const uuid = WPP_Bridge_Utils.generateUniqueId();

    console.log(`📤 Enviando para ${number}: ${message} ${media ? `(Mídia presente)` : ''}`);

    document.dispatchEvent(
      new CustomEvent("whatsappContentToWhatsappJs", {
        detail: { number, message, media, uuid }
      })
    );

    sendResponse({ success: true, message: "Mensagem enviada com sucesso." });

    return true;
  }
});
