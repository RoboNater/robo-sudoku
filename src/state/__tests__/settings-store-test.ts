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

  it('keeps a valid notesVisible flag and defaults a malformed one', () => {
    expect(parseSettings('{"notesVisible":false}')).toEqual({
      ...DEFAULT_SETTINGS,
      notesVisible: false,
    });
    expect(parseSettings('{"notesVisible":"nope"}')).toEqual(DEFAULT_SETTINGS);
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
      ...DEFAULT_SETTINGS,
      activeUiId: 'zen',
      showErrors: true,
      perUi: { classic: { skinId: 'dark-neon', layoutId: 'pad-side' }, zen: {} },
    });
  });

  it('round-trips through serializeSettings', () => {
    const settings: SettingsState = {
      activeUiId: 'classic',
      showErrors: false,
      notesVisible: false,
      autoClearNotes: { row: false, col: true, box: false },
      spotlight: { on: true, digit: 7 },
      perUi: { classic: { skinId: 'high-contrast' } },
    };
    expect(parseSettings(serializeSettings(settings))).toEqual(settings);
  });
});

describe('spotlight', () => {
  const parsed = (spotlight: unknown) => parseSettings(JSON.stringify({ spotlight })).spotlight;

  it('defaults to off on digit 1', () => {
    expect(DEFAULT_SETTINGS.spotlight).toEqual({ on: false, digit: 1 });
    expect(parsed(undefined)).toEqual({ on: false, digit: 1 });
  });

  it('keeps a stored flag and digit', () => {
    expect(parsed({ on: true, digit: 9 })).toEqual({ on: true, digit: 9 });
  });

  it('defaults each field independently when it is missing or junk', () => {
    expect(parsed({ on: true })).toEqual({ on: true, digit: 1 });
    expect(parsed({ digit: 4 })).toEqual({ on: false, digit: 4 });
    expect(parsed({ on: 'yes', digit: 4 })).toEqual({ on: false, digit: 4 });
  });

  it('rejects digits outside 1-9', () => {
    for (const junk of [0, 10, -1, 2.5, '3', null]) {
      expect(parsed({ on: true, digit: junk })).toEqual({ on: true, digit: 1 });
    }
  });

  it('yields the full default object for a malformed value, never undefined', () => {
    for (const junk of ['nope', 42, null, [true, 3]]) {
      expect(parsed(junk)).toEqual({ on: false, digit: 1 });
    }
  });
});

describe('autoClearNotes', () => {
  const parsed = (autoClearNotes: unknown) =>
    parseSettings(JSON.stringify({ autoClearNotes })).autoClearNotes;

  it('defaults every unit to on', () => {
    expect(DEFAULT_SETTINGS.autoClearNotes).toEqual({ row: true, col: true, box: true });
    expect(parsed(undefined)).toEqual({ row: true, col: true, box: true });
  });

  it('keeps the flags it recognises and defaults the rest', () => {
    expect(parsed({ row: false })).toEqual({ row: false, col: true, box: true });
    expect(parsed({ row: false, col: 'no', box: false })).toEqual({
      row: false,
      col: true,
      box: false,
    });
  });

  it('yields the full default object for a malformed value, never undefined', () => {
    for (const junk of ['nope', 42, null, [false, false, false]]) {
      expect(parsed(junk)).toEqual({ row: true, col: true, box: true });
    }
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
