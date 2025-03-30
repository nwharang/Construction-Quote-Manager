import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface FormSettings {
  labelSize: 'sm' | 'md' | 'lg';
  spacing: 'compact' | 'normal' | 'relaxed';
  errorPlacement: 'below' | 'inline';
}

interface ButtonSettings {
  primaryColor: 'primary' | 'secondary' | 'success';
  dangerColor: 'danger'; // Only 'danger' since 'error' isn't supported by HeroUI
  size: 'sm' | 'md' | 'lg';
}

interface ModalSettings {
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  placement: 'center' | 'top' | 'bottom';
}

interface TableSettings {
  stripedRows: boolean;
  hoverable: boolean;
  compact: boolean;
}

interface UIState {
  // Settings
  formSettings: FormSettings;
  buttonSettings: ButtonSettings;
  modalSettings: ModalSettings;
  tableSettings: TableSettings;
  isDarkMode: boolean;
  
  // Actions
  updateFormSettings: (settings: Partial<FormSettings>) => void;
  updateButtonSettings: (settings: Partial<ButtonSettings>) => void;
  updateModalSettings: (settings: Partial<ModalSettings>) => void;
  updateTableSettings: (settings: Partial<TableSettings>) => void;
  setDarkMode: (isDark: boolean) => void;
}

// Default settings
const defaultFormSettings: FormSettings = {
  labelSize: 'sm',
  spacing: 'normal',
  errorPlacement: 'below',
};

const defaultButtonSettings: ButtonSettings = {
  primaryColor: 'primary',
  dangerColor: 'danger',
  size: 'md',
};

const defaultModalSettings: ModalSettings = {
  maxWidth: 'md',
  placement: 'center',
};

const defaultTableSettings: TableSettings = {
  stripedRows: true,
  hoverable: true,
  compact: false,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        formSettings: defaultFormSettings,
        buttonSettings: defaultButtonSettings,
        modalSettings: defaultModalSettings,
        tableSettings: defaultTableSettings,
        isDarkMode: false,
        
        updateFormSettings: (settings) => 
          set((state) => ({ 
            formSettings: { ...state.formSettings, ...settings } 
          })),
        
        updateButtonSettings: (settings) => 
          set((state) => ({ 
            buttonSettings: { ...state.buttonSettings, ...settings } 
          })),
        
        updateModalSettings: (settings) => 
          set((state) => ({ 
            modalSettings: { ...state.modalSettings, ...settings } 
          })),
        
        updateTableSettings: (settings) => 
          set((state) => ({ 
            tableSettings: { ...state.tableSettings, ...settings } 
          })),
        
        setDarkMode: (isDark) => 
          set({ isDarkMode: isDark }),
      }),
      {
        name: 'ui-settings',
        partialize: (state) => ({
          formSettings: state.formSettings,
          buttonSettings: state.buttonSettings,
          modalSettings: state.modalSettings,
          tableSettings: state.tableSettings,
          isDarkMode: state.isDarkMode,
        }),
      }
    )
  )
); 