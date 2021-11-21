import config from "../config";

export const request = (path, data) => {
  console.log("http request to", config.apiURL + path, data);
  return fetch(config.apiURL + path, data)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw res;
    })
    .catch(async (err) => {
      throw await err.text();
    });
};
