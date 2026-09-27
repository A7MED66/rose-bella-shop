import { useStore } from '../context/StoreContext.jsx';

export default function Toast() {
  const { toastMsg } = useStore();
  return (
    <div id="toast" className={toastMsg ? 'show' : ''}>
      {toastMsg}
    </div>
  );
}
