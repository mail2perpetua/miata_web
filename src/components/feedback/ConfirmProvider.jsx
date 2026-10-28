import { createContext, useCallback, useContext, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const ConfirmContext = createContext(null);

/** `const ok = await confirm({ title, message, confirmLabel, danger })` */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({ ...options, resolve });
      }),
    [],
  );

  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(dialog)}
        title={dialog?.title ?? 'Are you sure?'}
        onClose={() => close(false)}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={dialog?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {dialog?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        <p style={{ lineHeight: 1.6 }}>{dialog?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
