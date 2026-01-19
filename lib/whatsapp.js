let interval = null;

const responseEvent = 'WhatsappjsResponse';

const getContactLidAndPhone = async (userId) => {
  const { lid, phone } = await window.WWebJS.enforceLidAndPnRetrieval(userId);
  return {
    lid: lid?._serialized,
    pn: phone?._serialized
  };
}

const sendB2bMessage = async (receiver, text, media, uuid) => {

  try {

    const normalizedReceiver = receiver.replace(/\D/g, '');
    const contact = await getContactLidAndPhone(`${normalizedReceiver}@c.us`);

    const chat = await window.WWebJS.getChat(contact.pn, { getAsModel: false });

    const options = media ? { media, caption: text } : {};
    const msg = await window.WWebJS.sendMessage(chat, text, options);

    document.dispatchEvent(new CustomEvent(responseEvent, {
      detail: {
        success: true,
        response: msg,
        uuid
      }
    }));

  } catch (error) {
    console.error("window.WWebJS.sendMessage error:", error)

    document.dispatchEvent(new CustomEvent(responseEvent, {
      detail: {
        success: false,
        response: error.message || "Error while sending message",
        uuid
      }
    }));
  }
}

/** received event from content.js to send final message */
document.addEventListener("whatsappContentToWhatsappJs", function (e) {
  const { number, message, media, uuid } = e.detail;
  sendB2bMessage(number, message, media, uuid);
});