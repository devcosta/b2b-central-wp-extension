function setWindowStore() {
  /**
   * Helper function that compares between two WWeb versions. Its purpose is to help the developer to choose the correct code implementation depending on the comparison value and the WWeb version.
   * @param {string} lOperand The left operand for the WWeb version string to compare with
   * @param {string} operator The comparison operator
   * @param {string} rOperand The right operand for the WWeb version string to compare with
   * @returns {boolean} Boolean value that indicates the result of the comparison
   */
  window.compareWwebVersions = (lOperand, operator, rOperand) => {
    if (!['>', '>=', '<', '<=', '='].includes(operator)) {
      throw new Error('Invalid comparison operator is provided');

    }
    if (typeof lOperand !== 'string' || typeof rOperand !== 'string') {
      throw new Error('A non-string WWeb version type is provided');
    }

    lOperand = lOperand.replace(/-beta$/, '');
    rOperand = rOperand.replace(/-beta$/, '');

    while (lOperand.length !== rOperand.length) {
      lOperand.length > rOperand.length
        ? rOperand = rOperand.concat('0')
        : lOperand = lOperand.concat('0');
    }

    lOperand = Number(lOperand.replace(/\./g, ''));
    rOperand = Number(rOperand.replace(/\./g, ''));

    return (
      operator === '>' ? lOperand > rOperand :
        operator === '>=' ? lOperand >= rOperand :
          operator === '<' ? lOperand < rOperand :
            operator === '<=' ? lOperand <= rOperand :
              operator === '=' ? lOperand === rOperand :
                false
    );
  };

  window.Store = Object.assign({}, window.require('WAWebCollections'));
  window.Store.AppState = window.require('WAWebSocketModel').Socket;
  window.Store.Conn = window.require('WAWebConnModel').Conn;
  window.Store.Cmd = window.require('WAWebCmd').Cmd;
  window.Store.DownloadManager = window.require('WAWebDownloadManager').downloadManager;
  window.Store.MediaPrep = window.require('WAWebPrepRawMedia');
  window.Store.MediaObject = window.require('WAWebMediaStorage');
  window.Store.MediaTypes = window.require('WAWebMmsMediaTypes');
  window.Store.MediaUpload = window.require('WAWebMediaMmsV4Upload');
  window.Store.MsgKey = window.require('WAWebMsgKey');
  window.Store.OpaqueData = window.require('WAWebMediaOpaqueData');
  window.Store.SendMessage = window.require('WAWebSendMsgChatAction');
  window.Store.User = window.require('WAWebUserPrefsMeUser');
  window.Store.UserConstructor = window.require('WAWebWid');
  window.Store.Validators = window.require('WALinkify');
  window.Store.WidFactory = window.require('WAWebWidFactory');
  window.Store.ChatGetters = window.require('WAWebChatGetters');
  window.Store.UploadUtils = window.require('WAWebUploadManager');
  window.Store.FindOrCreateChat = window.require('WAWebFindChatAction');

  if (!window.Store.Chat._find || !window.Store.Chat.findImpl) {
    window.Store.Chat._find = e => {
      const target = window.Store.Chat.get(e);
      return target ? Promise.resolve(target) : Promise.resolve({
        id: e
      });
    };
    window.Store.Chat.findImpl = window.Store.Chat._find;
  }
}

// src/util/Injected/Utils.js
function loadUtils() {
  window.WWebJS = {};

  const responseEvent = 'WhatsappjsResponse';
  window.WWebJS.sendWhatsappMessage = async (receiver, text, options, sendSeen, uid) => {
    try {
      const chatWid = window.Store.WidFactory.createWid(receiver + '@c.us');
      const chat = await window.Store.Chat.find(chatWid);
      const msg = await window.WWebJS.sendMessage(chat, text, options, sendSeen);
      console.log("window.WWebJS.sendMessage response:", msg)

      document.dispatchEvent(new CustomEvent(responseEvent, {
        detail: {
          success: true,
          response: "Message sent successfully",
          uid: uid,
        }
      }));

    } catch (error) {
      console.error("window.WWebJS.sendMessage error:", error)

      document.dispatchEvent(new CustomEvent(responseEvent, {
        detail: {
          success: false,
          response: error.message || "Error while sending message",
          uid: uid,
        }
      }));
    }
  }


  window.WWebJS.sendMessage = async (chat, content, options = {}) => {
    const isChannel = window.Store.ChatGetters.getIsNewsletter(chat);

    let mediaOptions = {};
    if (options.media) {
      mediaOptions = await window.WWebJS.processMediaData(options.media, {
        forceDocument: options.sendMediaAsDocument,
        forceMediaHd: options.sendMediaAsHd,
        sendToChannel: isChannel
      });
      mediaOptions.caption = options.caption;
      content = mediaOptions.preview;
      delete options.media;
    }

    const meUser = window.Store.User.getMaybeMePnUser();
    const newId = await window.Store.MsgKey.newId();
    let from = meUser;

    // Basic support for groups if needed in future (simplified for now)
    if (typeof chat.id?.isGroup === 'function' && chat.id.isGroup()) {
      const lidUser = window.Store.User.getMaybeMeLidUser();
      from = chat.groupMetadata && chat.groupMetadata.isLidAddressingMode ? lidUser : meUser;
    }

    const newMsgKey = new window.Store.MsgKey({
      from: from,
      to: chat.id,
      id: newId,
      participant: undefined,
      selfDir: 'out',
    });

    const message = {
      ...options,
      id: newMsgKey,
      ack: 0,
      body: content,
      from: meUser,
      to: chat.id,
      local: true,
      self: 'out',
      t: parseInt(new Date().getTime() / 1000),
      isNewMsg: true,
      type: 'chat',
      ...mediaOptions,
      ...(mediaOptions.toJSON ? mediaOptions.toJSON() : {})
    };

    const [msgPromise, sendMsgResultPromise] = window.Store.SendMessage.addAndSendMsgToChat(chat, message);
    await msgPromise;

    if (options.waitUntilMsgSent) await sendMsgResultPromise;

    return window.Store.Msg.get(newMsgKey._serialized);
  };

  window.WWebJS.processMediaData = async (mediaInfo, { forceDocument, forceMediaHd, sendToChannel }) => {
    const file = window.WWebJS.mediaInfoToFile(mediaInfo);
    const opaqueData = await window.Store.OpaqueData.createFromData(file, file.type);
    const mediaParams = {
      asDocument: forceDocument
    };

    if (forceMediaHd && file.type.indexOf('image/') === 0) {
      mediaParams.maxDimension = 2560;
    }

    const mediaPrep = window.Store.MediaPrep.prepRawMedia(opaqueData, mediaParams);
    const mediaData = await mediaPrep.waitForPrep();
    const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);
    const mediaType = window.Store.MediaTypes.msgToMediaType({
      type: mediaData.type,
      isGif: mediaData.isGif,
      isNewsletter: sendToChannel,
    });

    if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
      mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(
        mediaData.mediaBlob,
        mediaData.mediaBlob.type
      );
    }

    mediaData.renderableUrl = mediaData.mediaBlob.url();
    mediaObject.consolidate(mediaData.toJSON());
    mediaData.mediaBlob.autorelease();

    const dataToUpload = {
      mimetype: mediaData.mimetype,
      mediaObject,
      mediaType,
      ...(sendToChannel ? { calculateToken: window.Store.SendChannelMessage.getRandomFilehash } : {})
    };

    const uploadedMedia = !sendToChannel
      ? await window.Store.MediaUpload.uploadMedia(dataToUpload)
      : await window.Store.MediaUpload.uploadUnencryptedMedia(dataToUpload);

    const mediaEntry = uploadedMedia.mediaEntry;
    if (!mediaEntry) {
      throw new Error('upload failed: media entry was not created');
    }

    mediaData.set({
      clientUrl: mediaEntry.mmsUrl,
      deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
      directPath: mediaEntry.directPath,
      mediaKey: mediaEntry.mediaKey,
      mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
      filehash: mediaObject.filehash,
      encFilehash: mediaEntry.encFilehash,
      uploadhash: mediaEntry.uploadHash,
      size: mediaObject.size,
      streamingSidecar: mediaEntry.sidecar,
      firstFrameSidecar: mediaEntry.firstFrameSidecar,
      mediaHandle: sendToChannel ? mediaEntry.handle : null,
    });

    return mediaData;
  };

  window.WWebJS.mediaInfoToFile = ({ data, mimetype, filename }) => {
    const binaryData = window.atob(data);

    const buffer = new ArrayBuffer(binaryData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryData.length; i++) {
      view[i] = binaryData.charCodeAt(i);
    }

    const blob = new Blob([buffer], { type: mimetype });
    return new File([blob], filename, {
      type: mimetype,
      lastModified: Date.now()
    });
  };
}


let interval = null;

interval = setInterval(function () {
  if (window?.Store?.AppState === undefined) {
    console.log("⏳ Aguardando window.Store carregar...");
    setWindowStore();
  } else {
    console.log("✅ window.Store carregado e pronto!");
    loadUtils();
    clearInterval(interval);
  }
}, 1000);

/** received event from content.js to send final message */
document.addEventListener("whatsappContentToWhatsappJs", function (e) {
  console.log("whatsappContentToWhatsappJs");
  window.WWebJS.sendWhatsappMessage(
    e.detail.receiver,
    e.detail.text,
    e.detail.internalOptions,
    false,
    e.detail.uid
  );
});