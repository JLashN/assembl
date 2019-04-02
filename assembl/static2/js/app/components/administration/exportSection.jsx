// @flow
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import moment from 'moment';
import { Link } from 'react-router';
import { FormGroup, Radio, Checkbox, FormControl } from 'react-bootstrap';

import SectionTitle from './sectionTitle';
import CustomDateRangePicker from './dateRangePicker/customDateRangePicker';
import { datePickerPresets } from '../../constants';
import { getFullDebatePreset } from '../form/utils';

type Props = {
  languages: Array<Object>,
  exportLink: string,
  exportLocale: string,
  locale: string,
  annotation: string,
  sectionTitle: string,
  phases: Array<Preset>,
  handleDatesChange: Function,
  handleAnonymousChange: Function,
  handleExportLocaleChange: Function,
  shouldBeAnonymous: boolean,
  shouldTranslate: boolean,
  start: ?moment,
  end: ?moment
};

export const ExportSection = ({
  annotation,
  sectionTitle,
  exportLink,
  exportLocale,
  handleDatesChange,
  handleExportLocaleChange,
  handleShouldTranslate,
  handleAnonymousChange,
  shouldBeAnonymous,
  shouldTranslate,
  start,
  end,
  phases,
  languages,
  locale
}: Props) => {
  const renderAnonymousOption = () =>
    (handleAnonymousChange ? (
      <React.Fragment>
        <Translate value="administration.export.anonymity" />
        <Checkbox onChange={handleAnonymousChange} value={shouldBeAnonymous}>
          <Translate value="administration.export.anonymous" />
        </Checkbox>
      </React.Fragment>
    ) : null);

  const renderLanguageOptions = () => {
    const activeLanguage = languages ? languages.filter(language => language.locale === exportLocale)[0] : null;
    return languages ? (
      <React.Fragment>
        <Translate value="administration.export.translation" />
        <Radio checked={!shouldTranslate} onChange={() => handleShouldTranslate(false)}>
          <Translate value="administration.export.noExportLanguage" />
        </Radio>
        <Radio checked={shouldTranslate} onChange={() => handleShouldTranslate(true)}>
          <Translate value="administration.export.translateTheMessagesIn" />
          {shouldTranslate && (
            <FormControl
              className="export-language-dropdown"
              componentClass="select"
              onChange={(e) => {
                handleExportLocaleChange(e.target.value);
              }}
              value={activeLanguage ? activeLanguage.locale : ''}
            >
              {languages &&
                languages.map(lang => (
                  <option key={`locale-${lang.locale}`} value={lang.locale}>
                    {lang.name}
                  </option>
                ))}
            </FormControl>
          )}
        </Radio>
      </React.Fragment>
    ) : null;
  };

  const renderDatePicker = () => {
    if (!phases) {
      return null;
    }
    const phasesPresets = phases
      ? phases.map((phase, index) => ({
        id: index + 1,
        labelTranslationKey: 'administration.export.presets.phase',
        range: {
          startDate: moment(phase.start),
          endDate: moment(phase.end)
        },
        type: 'phase'
      }))
      : [];
    const fullDebatePreset = phasesPresets && phasesPresets.length > 0 && getFullDebatePreset(phasesPresets);
    const presets = fullDebatePreset ? [...datePickerPresets, ...phasesPresets, fullDebatePreset] : [...datePickerPresets];
    return presets ? (
      <div className="export-date">
        <Translate value="administration.export.exportDate" />
        <CustomDateRangePicker presets={presets} locale={locale} handleDatesChange={handleDatesChange} start={start} end={end} />
      </div>
    ) : null;
  };

  return (
    <div className="admin-box admin-export-section">
      <SectionTitle
        title={I18n.t(`administration.export.${sectionTitle}`)}
        annotation={I18n.t(`administration.export.${annotation}`)}
      />
      <div className="admin-content">
        <FormGroup>
          <div className="export-options">
            <div>
              {renderAnonymousOption()}
              {renderLanguageOptions()}
            </div>
            {renderDatePicker()}
          </div>
        </FormGroup>
        <div className="center-flex">
          <Link className="button-link button-dark margin-l" href={exportLink}>
            <Translate value="administration.export.link" />
          </Link>
        </div>
      </div>
    </div>
  );
};

ExportSection.defaultProps = {
  annotation: 'defaultAnnotation',
  sectionTitle: 'defaultSectionTitle'
};

export default ExportSection;