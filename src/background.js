// Função auxiliar para converter blob em Base64
const getBase64FromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve({
        data: base64data.split(',')[1],
        mimetype: blob.type,
        filename: url.split('/').pop() || 'media'
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "HELLO_WORLD") {
    console.log("🌍 Hello World recebido! Encaminhando para WhatsApp Web...");

    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "HELLO_WORLD_FROM_SAAS" },
          (response) => {
            sendResponse(
              response || {
                success: true,
                message: "Hello World encaminhado para WhatsApp!",
              }
            );
          }
        );
      } else {
        sendResponse({
          success: false,
          message: "WhatsApp Web não está aberto",
        });
      }
    });

    return true;
  }

  if (message.type === "SEND_MESSAGE") {
    // Wrapper async para aceitar await
    (async () => {
      try {
        let media = message.media;

        // Se vier mediaUrl mas não media (novo fluxo), converte agora no background
        if (message.mediaUrl && !media) {
          console.log("🔄 [Background] Convertendo mediaUrl:", message.mediaUrl);
          media = await getBase64FromUrl(message.mediaUrl);
          console.log("✅ [Background] Conversão concluída.");
        }

        chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                type: "SEND_MESSAGE",
                number: message.number,
                message: message.message,
                media: media // Envia o objeto de media já convertido
              },
              (response) => {
                sendResponse(response || { success: false, message: "Sem resposta" });
              }
            );
          } else {
            sendResponse({
              success: false,
              message: "WhatsApp Web não está aberto",
            });
          }
        });
      } catch (error) {
        console.error("❌ [Background] Erro no processamento:", error);
        sendResponse({ success: false, message: "Erro interno no background: " + error.message });
      }
    })();

    return true; // Indica que a resposta será enviada de forma assíncrona
  }
});
