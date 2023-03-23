chrome.runtime.onMessage.addListener(async function (request, _sender, _sendResponse) {
  // @ts-ignore
  const res = await fetch(`${import.meta.env.VITE_URL}/.netlify/functions/add-content-background`, {
    method: 'POST',
    body: JSON.stringify(request.data),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Error adding content');
  }

  return true;
});

chrome.runtime.onMessageExternal.addListener((request, _sender, _sendResponse) => {
  chrome.storage.local.set({ session: request.session });
});
