// components/admin/MarkdownGuidePopup.tsx
import React from "react";

import controlStyles from "@/styles/controls.module.css";
import buttonStyles from "@/styles/admin/buttons.module.css";

interface MarkdownGuidePopupProps {
  onClose: () => void;
}

const MarkdownGuidePopup: React.FC<MarkdownGuidePopupProps> = ({ onClose }) => {
  return (
    <div className={controlStyles.settingsOverlay} onClick={onClose}>
      <div
        className={controlStyles.settingsPopup}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={controlStyles.settingsContent}>
          <div className={controlStyles.markdownGrid}>
            <div className={controlStyles.markdownSection}>
              <div>Elements</div>
              <code>[TABLE-#]</code>
              <code>[SIDE-#]</code>
            </div>

            <div className={controlStyles.markdownSection}>
              <div>Text Formatting</div>
              <code>**bold**</code>
              <code>*italic*</code>
              <code>_italic_</code>
              <code>***bold italic***</code>
              <code>__underline__</code>
              <code>~~strikethrough~~</code>
            </div>

            <div className={controlStyles.markdownSection}>
              <div>Headers</div>
              <code># Header</code>
              <code>-# Subheader</code>
            </div>

            <div className={controlStyles.markdownSection}>
              <div>Links and Media</div>
              <code>[text](url)</code>
              <code>&lt;ign&gt;</code>
              <code>[youtube:videoId]</code>
              <code>[img:imageUrl][size=50%]</code>
            </div>
          </div>
        </div>
        <button className={buttonStyles.settingsSave} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default MarkdownGuidePopup;
