import { useRegisterSW } from "virtual:pwa-register/react";
import "./UpdateToast.css";

export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-toast" role="status">
      <p className="update-toast__message">Update available</p>
      <div className="update-toast__actions">
        <button
          type="button"
          className="update-toast__button"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </button>
        <button
          type="button"
          className="update-toast__dismiss"
          onClick={() => setNeedRefresh(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
