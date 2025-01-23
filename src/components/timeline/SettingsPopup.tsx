import React from 'react';
import controlStyles from '../../styles/controls.module.css';

interface SettingsPopupProps {
  onClose: () => void;
  isDraggingEnabled: boolean;
  onDraggingToggle: (enabled: boolean) => void;
  timelineOrder: 'ascending' | 'descending';
  onTimelineOrderChange: (order: 'ascending' | 'descending') => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({ 
  onClose, 
  isDraggingEnabled, 
  onDraggingToggle,
  timelineOrder,
  onTimelineOrderChange 
}) => {
  return (
    <div className={controlStyles.settingsOverlay} onClick={onClose}>
      <div className={controlStyles.settingsPopup} onClick={e => e.stopPropagation()}>
        <h3 className={controlStyles.settingsTitle}>Timeline Settings</h3>
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
            <div className={controlStyles.settingGroup}>
              <label>
                Timeline Order<br></br>
                (Currently not working)
              </label>
              <select 
                className={controlStyles.settingSelect}
                value={timelineOrder}
                onChange={(e) => onTimelineOrderChange(e.target.value as 'ascending' | 'descending')}
              >
                <option value="ascending">Ascending (Oldest to Newest)</option>
                <option value="descending">Descending (Newest to Oldest)</option>
              </select>
            </div>
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