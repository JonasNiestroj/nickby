import { ref, useSSRContext } from 'vue';

const useData = () => {
  if (import.meta.env.SSR) {
    return ref(useSSRContext());
  }

  if (window.__NICKBY_DATA__) {
    const dataRef = ref(window.__NICKBY_DATA__);
    return dataRef;
  }

  return ref(null);
};

export default useData;
