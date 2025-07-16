window.addEventListener("test-hello-world", () => {
  chrome.runtime.sendMessage({ type: "HELLO_WORLD" }, (response) => {
    window.dispatchEvent(
      new CustomEvent("hello-world-response", { detail: response })
    );
  });
});

window.addEventListener("send-to-whatsapp", (e) => {
  const { number, message } = e.detail;
  chrome.runtime.sendMessage(
    {
      type: "SEND_MESSAGE",
      number,
      message,
    },
    (response) => {
      window.dispatchEvent(
        new CustomEvent("send-to-whatsapp-response", { detail: response })
      );
    }
  );
});
