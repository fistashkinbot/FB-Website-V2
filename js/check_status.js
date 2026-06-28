async function safeNavigate(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (response.status === 404) {
      window.location.href = "./404.html";
      return;
    }

    if (response.status >= 500) {
      window.location.href = "./500.html";
      return;
    }

    window.location.href = url;
  } catch (error) {
    window.location.href = "./500.html";
  }
}
