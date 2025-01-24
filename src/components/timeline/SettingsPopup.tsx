import React from 'react';
import controlStyles from '../../styles/controls.module.css';

interface SettingsPopupProps {
  onClose: () => void;
  isDraggingEnabled: boolean;
  onDraggingToggle: (enabled: boolean) => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({ 
  onClose, 
  isDraggingEnabled, 
  onDraggingToggle,
}) => {
  return (
    <div className={controlStyles.settingsOverlay} onClick={onClose}>
      <div className={controlStyles.settingsPopup} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative' }}>
          <button className={controlStyles.closeButton} onClick={onClose} style={{ position: 'absolute', top: '0', right: '0' }}>×</button>
          <h3 className={controlStyles.settingsTitle}>Timeline Settings</h3>
        </div>
        <hr className={controlStyles.divider} />
        <div className={controlStyles.settingsContent}>
          <div className={controlStyles.settingGroup}>
            <label className={controlStyles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={isDraggingEnabled}
                onChange={(e) => onDraggingToggle(e.target.checked)}
              />
              <div>
                Enable event dragging<br></br>
                (Disables event modals)
              </div>
            </label>
          </div>
        </div>
        <hr className={controlStyles.divider} />
        <button className={controlStyles.settingsSave} onClick={onClose}>
          Save
        </button>
      </div>
    </div>
  );
};

export default SettingsPopup;