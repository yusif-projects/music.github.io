const params = new URLSearchParams(location.search);
    const url = params.get('url');
    console.log("Target:", url);

    if (!url) {
      document.body.innerHTML = "<h1 id='redirect-label'>No URL Provided</h1>";
    } else {
      const a = document.createElement("a");
      a.href = url;

      // Try opening the deep link
      const fallback = () => {
        // If deep link fails, redirect to HTTPS version
        try {
          const safeUrl = url
            .replace(/^([a-zA-Z]+):\/\//, "") // remove custom scheme
            .replace(/^\/+/, ""); // remove leading slashes if any
          window.location.href = `https://${safeUrl}`;
        } catch (e) {
          console.error("Fallback failed:", e);
        }
      };

      // Attempt to open the deep link
      const start = Date.now();
      window.location.href = url;

      // If after 1 second nothing happens (the user is still here), assume failure
      setTimeout(() => {
        if (Date.now() - start < 1500) fallback();
      }, 1000);
    }