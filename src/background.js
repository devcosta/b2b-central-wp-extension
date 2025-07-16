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
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            type: "SEND_MESSAGE",
            number: message.number,
            message: message.message
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

    return true;
  }
});
