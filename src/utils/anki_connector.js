function invoke(action, version, params = {}) {
  return new Promise((resolve, reject) => {
    fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, version, params }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("failed to issue request");
        }
        return response.json();
      })
      .then((response) => {
        if (Object.getOwnPropertyNames(response).length != 2) {
          throw new Error("response has an unexpected number of fields");
        }
        if (!response.hasOwnProperty("error")) {
          throw new Error("response is missing required error field");
        }
        if (!response.hasOwnProperty("result")) {
          throw new Error("response is missing required result field");
        }
        if (response.error) {
          throw new Error(response.error);
        }
        resolve(response.result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = invoke;