import toast, { Toaster, ToastBar } from "react-hot-toast";

const AppToaster = () => (
  <Toaster
    position="top-center"
    containerStyle={{ zIndex: 9999 }}
    toastOptions={{
      style: {
        maxWidth: "none",
        whiteSpace: "nowrap",
      },
    }}
  >
    {(t) => (
      <ToastBar toast={t}>
        {({ icon, message }) => (
          <>
            {icon}
            {message}
            <button
              type="button"
              className="toast-close-button"
              aria-label="Dismiss notification"
              onClick={() => toast.dismiss(t.id)}
            >
              <i className="ri-close-line" aria-hidden="true"></i>
            </button>
          </>
        )}
      </ToastBar>
    )}
  </Toaster>
);

export default AppToaster;
