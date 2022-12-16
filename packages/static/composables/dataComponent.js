import { getCurrentInstance, ref, useSSRContext } from 'vue';

const useDataComponent = (id, props) => {
  const instance = getCurrentInstance();
  return new Promise(async (resolve, reject) => {
    if (import.meta.env.SSR) {
      const context = useSSRContext();
      const serverFile = instance.type.__file.replace('.vue', '.server.js');
      const dataFunction = await import(serverFile);
      const data = await dataFunction.default(props);

      context[`__NICKBY_DATA_${id}__`] = data;

      resolve(data);
      return;
    }
    const windowName = `__NICKBY_DATA_${id}__`;
    if (window[windowName]) {
      const dataRef = ref(window[windowName]);
      resolve(dataRef);
      return;
    }

    resolve(ref(null));
  });
};

export default useDataComponent;
