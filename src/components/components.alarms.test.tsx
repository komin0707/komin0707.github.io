import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlarmPanel } from '@/components';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { DEFAULT_ALARM_THRESHOLDS, calculateSimulation } from '@/simulation/ventilatorModel';

const critical = calculateSimulation(
  { ...DEFAULT_SETTINGS, fio2: 21, peep: 20, tidalVolume: 1000, flow: 100 },
  SCENARIOS.ards,
);

describe('alarm panel component', () => {
  registerAlarmStateTests();
  registerAlarmControlsTests();
  registerAlarmAudioTests();
  registerAlarmNotificationTests();
});

function registerAlarmStateTests(): void {
  it('renders empty, warning, and critical alarm states', () => {
    const { rerender } = render(<AlarmPanel alarms={[]} />);
    expect(screen.getByText('활성 알람 없음')).toBeInTheDocument();

    rerender(<AlarmPanel alarms={critical.alarms} elapsedSeconds={90} />);
    expect(screen.getByText('High Peak Pressure')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { name: '중대 알람 확인 필요' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.queryByRole('alertdialog', { name: '중대 알람 확인 필요' })).not.toBeInTheDocument();
    expect(document.querySelectorAll('.alarm-panel li.critical').length).toBeGreaterThan(0);
    expect(screen.getByText(/History/)).toBeInTheDocument();
    expect(screen.getAllByText(/발생 01:30/).length).toBeGreaterThan(0);
  });
}

function registerAlarmControlsTests(): void {
  it('supports mute, pause, resume, snooze, mobile notification, and threshold controls', () => {
    const onThresholdChange = vi.fn();
    render(
      <AlarmPanel
        alarms={critical.alarms}
        elapsedSeconds={12}
        onThresholdChange={onThresholdChange}
        thresholds={DEFAULT_ALARM_THRESHOLDS}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Mute/ }));
    expect(screen.getByRole('button', { name: /음소거 해제/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /60초/ }));
    expect(screen.getByRole('button', { name: /음소거 해제/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /120초/ }));
    fireEvent.click(screen.getByRole('button', { name: /일시 정지/ }));
    expect(screen.getByText('알람 일시 정지됨')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /재개/ }));
    fireEvent.click(screen.getByRole('button', { name: /스누즈/ }));
    expect(document.querySelectorAll('.alarm-panel li.snoozed').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /모바일 알림/ }));
    expect(screen.getByRole('button', { name: /모바일 허용|모바일 대기/ })).toBeInTheDocument();
    expect(screen.getByText(/Latency/)).toBeInTheDocument();
    expect(screen.getByText(/Stats/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Smart alarm on/ }));
    expect(screen.getByRole('button', { name: /Smart alarm off/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Alarm learning off/ }));
    expect(screen.getByRole('button', { name: /Alarm learning on/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Low SpO2 threshold'), { target: { value: '88' } });
    expect(onThresholdChange).toHaveBeenCalledWith('lowSpo2Warning', 88);
    fireEvent.change(screen.getByLabelText('Risk threshold code'), { target: { value: 'VENT' } });
    fireEvent.change(screen.getByLabelText('Alarm profile'), { target: { value: 'ards' } });
    fireEvent.change(screen.getByLabelText('High pressure threshold'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('Low pressure threshold'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('High minute ventilation threshold'), { target: { value: '18' } });
    expect(screen.getByLabelText('Low minute ventilation threshold')).toHaveValue(3);
    fireEvent.change(screen.getByLabelText('Low minute ventilation threshold'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('High PEEP threshold'), { target: { value: '22' } });
    fireEvent.change(screen.getByLabelText('Low PEEP threshold'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('High EtCO2 threshold'), { target: { value: '55' } });
    fireEvent.change(screen.getByLabelText('High CO2 threshold'), { target: { value: '66' } });
    expect(onThresholdChange).toHaveBeenCalledWith('highPressureWarning', 42);
    expect(onThresholdChange).toHaveBeenCalledWith('highPressureWarning', 38);
    expect(onThresholdChange).toHaveBeenCalledWith('lowPressure', 4);
    expect(onThresholdChange).toHaveBeenCalledWith('highMinuteVentilation', 18);
    expect(onThresholdChange).toHaveBeenCalledWith('lowMinuteVentilationCritical', 2);
    expect(onThresholdChange).toHaveBeenCalledWith('highPeep', 22);
    expect(onThresholdChange).toHaveBeenCalledWith('lowPeep', 2);
    expect(onThresholdChange).toHaveBeenCalledWith('highEtco2', 55);
    expect(onThresholdChange).toHaveBeenCalledWith('highCo2Warning', 66);
    fireEvent.click(screen.getByRole('button', { name: /임계값 잠금/ }));
    expect(screen.getByLabelText('Low SpO2 threshold')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /임계값 잠금 해제/ }));
    expect(screen.getByLabelText('Low SpO2 threshold')).not.toBeDisabled();
  });
}

function registerAlarmAudioTests(): void {
  registerAudioUnavailableTest();
  registerAudioToneTest();
  registerMutedAudioTest();
}

function registerAudioUnavailableTest(): void {
  it('enables audio without playing a tone when browser audio APIs are unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={30} />);
    fireEvent.click(screen.getByRole('button', { name: /음성 끔/ }));

    expect(screen.getByRole('button', { name: /음성 켬/ })).toBeInTheDocument();
  });
}

function registerAudioToneTest(): void {
  it('plays an alarm tone when audio is enabled for visible alarms', () => {
    const oscillator = createMockOscillator();
    const gain = createMockGain();

    class MockAudioContext {
      currentTime = 7;
      destination = {} as AudioDestinationNode;

      createGain(): GainNode {
        return gain as unknown as GainNode;
      }

      createOscillator(): OscillatorNode {
        return oscillator as unknown as OscillatorNode;
      }
    }
    vi.stubGlobal('AudioContext', MockAudioContext);

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={30} />);
    fireEvent.click(screen.getByRole('button', { name: /음성 끔/ }));

    expect(oscillator.frequency.value).toBe(880);
    expect(oscillator.type).toBe('square');
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.04, 7);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 7.18);
    expect(oscillator.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith({});
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    expect(oscillator.stop).toHaveBeenCalledWith(7.2);
  });
}

function registerMutedAudioTest(): void {
  it('does not play an alarm tone while muted', () => {
    const oscillator = createMockOscillator();
    const gain = createMockGain();

    class MockAudioContext {
      currentTime = 7;
      destination = {} as AudioDestinationNode;

      createGain(): GainNode {
        return gain as unknown as GainNode;
      }

      createOscillator(): OscillatorNode {
        return oscillator as unknown as OscillatorNode;
      }
    }
    vi.stubGlobal('AudioContext', MockAudioContext);

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={30} />);
    fireEvent.click(screen.getByRole('button', { name: /Mute/ }));
    fireEvent.click(screen.getByRole('button', { name: /음성 끔/ }));

    expect(oscillator.start).not.toHaveBeenCalled();
  });
}

function registerAlarmNotificationTests(): void {
  registerNotificationDeniedTest();
  registerNotificationNoServiceWorkerTest();
  registerNotificationServiceWorkerTest();
  registerNotificationDefaultCopyTest();
  registerNotificationUnavailableTest();
}

function registerNotificationDeniedTest(): void {
  it('marks mobile notifications off when permission is denied', async () => {
    const requestPermission = vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue('denied');
    vi.stubGlobal('Notification', {
      requestPermission,
    });

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={45} />);
    fireEvent.click(screen.getByRole('button', { name: /모바일 알림/ }));

    await waitFor(() => expect(requestPermission).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: /모바일 알림/ })).toBeInTheDocument();
  });
}

function registerNotificationNoServiceWorkerTest(): void {
  it('marks mobile notifications granted without a service worker', async () => {
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue('granted'),
    });
    Reflect.deleteProperty(navigator, 'serviceWorker');

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={45} />);
    fireEvent.click(screen.getByRole('button', { name: /모바일 알림/ }));

    await screen.findByRole('button', { name: /모바일 허용/ });
  });
}

function registerNotificationServiceWorkerTest(): void {
  it('queues mobile notifications through the service worker when permission is granted', async () => {
    const showNotification = vi
      .fn<(title: string, options?: NotificationOptions) => Promise<void>>()
      .mockResolvedValue(undefined);
    const ready = Promise.resolve({ showNotification } as unknown as ServiceWorkerRegistration);
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue('granted'),
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready },
    });

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={45} />);
    fireEvent.click(screen.getByRole('button', { name: /모바일 알림/ }));
    await screen.findByRole('button', { name: /모바일 허용/ });

    const [, notificationOptions] = showNotification.mock.calls[0] ?? [];
    expect(notificationOptions?.body).toContain('Peak pressure');
    expect(notificationOptions?.tag).toBe('ventsim-alarm');
  });
}

function registerNotificationDefaultCopyTest(): void {
  it('uses default notification copy when no active alarm message exists', async () => {
    const showNotification = vi
      .fn<(title: string, options?: NotificationOptions) => Promise<void>>()
      .mockResolvedValue(undefined);
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue('granted'),
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve({ showNotification } as unknown as ServiceWorkerRegistration) },
    });

    render(<AlarmPanel alarms={[]} elapsedSeconds={45} />);
    fireEvent.click(screen.getByRole('button', { name: /모바일 알림/ }));
    await screen.findByRole('button', { name: /모바일 허용/ });

    const [, notificationOptions] = showNotification.mock.calls[0] ?? [];
    expect(notificationOptions?.body).toBe('Ventilator alarm active');
  });
}

function registerNotificationUnavailableTest(): void {
  it('marks granted when service worker notifications are unavailable', async () => {
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue('granted'),
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve({} as ServiceWorkerRegistration) },
    });

    render(<AlarmPanel alarms={critical.alarms} elapsedSeconds={45} />);
    fireEvent.click(screen.getByRole('button', { name: /모바일 알림/ }));

    await screen.findByRole('button', { name: /모바일 허용/ });
  });
}

function createMockOscillator(): Pick<OscillatorNode, 'connect' | 'frequency' | 'start' | 'stop' | 'type'> {
  return {
    connect: vi.fn(),
    frequency: { value: 0 } as AudioParam,
    start: vi.fn(),
    stop: vi.fn(),
    type: 'sine',
  };
}

function createMockGain(): Pick<GainNode, 'connect' | 'gain'> {
  return {
    connect: vi.fn(),
    gain: {
      exponentialRampToValueAtTime: vi.fn(),
      setValueAtTime: vi.fn(),
    } as unknown as AudioParam,
  };
}
