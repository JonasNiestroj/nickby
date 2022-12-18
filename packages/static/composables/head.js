import { useSSRContext } from 'vue';

const useHead = (props) => {
  if (!import.meta.env.SSR) {
    return;
  }
  const context = useSSRContext();
  context.head = props;
};

export default useHead;
