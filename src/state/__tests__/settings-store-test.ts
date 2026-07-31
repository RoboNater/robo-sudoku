import {
  DEFAULT_SETTINGS,
  parseSettings,
  serializeSettings,
  withPerUi,
  type SettingsState,
} from '../settings-store';

describe('parseSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('')).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults for malformed JSON or non-objects', () => {
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('"a string"')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and defaults the rest', () => {
    expect(parseSettings('{"showErrors":false}')).toEqual({
      ...DEFAULT_SETTINGS,
      showErrors: false,
    });
    expect(parseSettings('{"activeUiId":42,"showErrors":"yes"}')).toEqual(DEFAULT_SETTINGS);
  });

  it('drops junk inside perUi but keeps valid entries', () => {
    const parsed = parseSettings(
      JSON.stringify({
        activeUiId: 'zen',
        showErrors: true,
        perUi: {
          classic: { skinId: 'dark-neon', layoutId: 'pad-side' },
          zen: { skinId: 7 },
          broken: 'nope',
        },
      }),
    );
    expect(parsed).toEqual({
      activeUiId: 'zen',
      showErrors: true,
      perUi: { classic: { skinId: 'dark-neon', layoutId: 'pad-side' }, zen: {} },
    });
  });

  it('round-trips through serializeSettings', () => {
    const settings: SettingsState = {
      activeUiId: 'classic',
      showErrors: false,
      perUi: { classic: { skinId: 'high-contrast' } },
    };
    expect(parseSettings(serializeSettings(settings))).toEqual(settings);
  });
});

describe('withPerUi', () => {
  it('merges into one UI without touching the others', () => {
    const before: SettingsState = {
      ...DEFAULT_SETTINGS,
      perUi: { classic: { skinId: 'newspaper' }, zen: { skinId: 'calm' } },
    };
    const after = withPerUi(before, 'classic', { layoutId: 'pad-side' });
    expect(after.perUi).toEqual({
      classic: { skinId: 'newspaper', layoutId: 'pad-side' },
      zen: { skinId: 'calm' },
    });
    expect(before.perUi.classic).toEqual({ skinId: 'newspaper' });
  });

  it('creates the entry for a UI with no stored choices', () => {
    expect(withPerUi(DEFAULT_SETTINGS, 'classic', { skinId: 'dark-neon' }).perUi).toEqual({
      classic: { skinId: 'dark-neon' },
    });
  });
});
