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
    const { number, message: text } = message;

    const generateUniqueId = () => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substr(2, 5);
      return timestamp + randomStr;
    };

    const uuid = generateUniqueId();

    console.log(`📤 Enviando para ${number}: ${text}`);

    const options = {};

    document.dispatchEvent(
      new CustomEvent("whatsappContentToWhatsappJs", {
        detail: { receiver: number, text: text, internalOptions: options, uid: uuid }
      })
    );

    sendResponse({ success: true, message: "Mensagem enviada com sucesso." });
    
    return true;
  }
});
