let refreshHandled = false;

export const setrefreshFunc =()=>{
    refreshHandled=false;
}
export const getrefreshFunc =()=>{
    return refreshHandled;
}
const api = axios.create({
  baseURL: "http://localhost:8000"
});

api.interceptors.request.use(
  (config) => {
    if (!navigator.onLine) {
      if (!refreshHandled) {
        refreshHandled = true;
        console.error("❌ No Internet — request blocked");
        alert("You are offline. Please connect to the internet.");
      }
      return Promise.reject(new Error("You are offline. Please connect to the internet."));
    }else refreshHandled =false

    return config;
  },
  (error) => Promise.reject(error)
);



export default api;
