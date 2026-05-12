import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header, SettingsPanel, SliderControl } from '@/components';
import { DEFAULT_SETTINGS, type VentMode, type VentSettings } from '@/simulation/scenarios';

const meta = {
  title: 'Simulator/Components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function HeaderModesStory() {
  const [mode, setMode] = useState<VentMode>('AC');
  const [colorblindPalette, setColorblindPalette] = useState(false);
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');

  return (
    <Header
      isColorblindPalette={colorblindPalette}
      locale={locale}
      mode={mode}
      onLocaleToggle={() => setLocale((value) => (value === 'ko' ? 'en' : 'ko'))}
      onModeChange={setMode}
      onPaletteToggle={() => setColorblindPalette((value) => !value)}
    />
  );
}

function VentilatorSettingsStory() {
  const [settings, setSettings] = useState<VentSettings>(DEFAULT_SETTINGS);
  const updateSetting = <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return <SettingsPanel settings={settings} onChange={updateSetting} />;
}

function StandaloneSliderStory() {
  const [peep, setPeep] = useState(DEFAULT_SETTINGS.peep);
  return (
    <div style={{ maxWidth: 360, padding: 24 }}>
      <SliderControl label="PEEP (cmH2O)" min={0} max={20} step={1} value={peep} onChange={setPeep} />
    </div>
  );
}

/** Storybook example for switching ventilator modes and colorblind palette state. */
export const HeaderModes: Story = {
  render: () => <HeaderModesStory />,
};

/** Storybook example for editing the full ventilator settings panel. */
export const VentilatorSettings: Story = {
  render: () => <VentilatorSettingsStory />,
};

/** Storybook example for the reusable slider control in isolation. */
export const StandaloneSlider: Story = {
  render: () => <StandaloneSliderStory />,
};
