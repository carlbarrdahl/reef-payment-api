export const store = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem("merchant-shop"));
    } catch (error) {}
    return {};
  },
  set: (val) => {
    try {
      localStorage.setItem("merchant-shop", JSON.stringify(val));
    } catch (error) {}
  },
};
