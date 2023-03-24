chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // @ts-ignore
  fetch(`${import.meta.env.BASE_URL}/.netlify/functions/add-content-background`, {
    method: 'POST',
    body: JSON.stringify(request.data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => {
      if (!res.ok) {
        console.error('Error adding content');
      }

      sendResponse(true);
    })
    .catch(error => {
      console.error(error);
    });

  return true;
});

chrome.runtime.onMessageExternal.addListener((request, _sender, _sendResponse) => {
  chrome.storage.local.set({ session: request.session });
});
