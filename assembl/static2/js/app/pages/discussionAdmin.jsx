// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { type ApolloClient, compose, graphql, withApollo } from 'react-apollo';
import { I18n } from 'react-redux-i18n';

import ManageSectionsForm from '../components/administration/discussion/manageSectionsForm';
import LegalContentsForm from '../components/administration/legalContents/index';
import TimelineForm from '../components/administration/discussion/timelineConfiguration';
import PreferencesSection from '../components/administration/discussion/preferences/index';
import ManageProfileOptionsForm from '../components/administration/discussion/manageProfileOptionsForm';
import PersonalizeInterface from '../components/administration/discussion/personalizeInterface';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import createSectionMutation from '../graphql/mutations/createSection.graphql';
import updateSectionMutation from '../graphql/mutations/updateSection.graphql';
import deleteSectionMutation from '../graphql/mutations/deleteSection.graphql';
import ProfileFieldsQuery from '../graphql/ProfileFields.graphql';
import createTextFieldMutation from '../graphql/mutations/createTextField.graphql';
import updateTextFieldMutation from '../graphql/mutations/updateTextField.graphql';
import deleteTextFieldMutation from '../graphql/mutations/deleteTextField.graphql';
import { type State as ReduxState } from '../reducers/rootReducer';

import {
  SECTION_PERSONALIZE_INTERFACE,
  SECTION_DISCUSSION_PREFERENCES,
  SECTION_TIMELINE,
  SECTION_PROFILE_OPTIONS,
  SECTION_MENU_SECTION,
  SECTION_LEGAL_CONTENTS
} from './../constants';

type Section = Object;

const createVariablesForSectionMutation = section => ({
  type: section.type,
  url: section.url,
  order: section.order,
  titleEntries: section.titleEntries
});

const createVariablesForTextFieldMutation = textField => ({
  id: textField.id,
  order: textField.order,
  required: textField.required,
  hidden: textField.hidden,
  titleEntries: textField.titleEntries,
  options: textField.options
});

const createVariablesForDeleteSectionMutation = section => ({ sectionId: section.id });

const createVariablesForDeleteTextFieldMutation = textField => ({ id: textField.id });

type Props = {
  changeLocale: Function,
  client: ApolloClient,
  createSection: Function,
  deleteSection: Function,
  editLocale: string,
  i18n: {
    locale: string,
    translations: { [string]: string }
  },
  refetchSections: Function,
  route: Route,
  router: Router,
  section: string,
  sections: Array<Section>,
  sectionsHaveChanged: boolean,
  updateSection: Function,
  debateId: string,
  createTextField: Function,
  updateTextField: Function,
  deleteTextField: Function,
  profileOptionsHasChanged: boolean,
  refetchTextFields: Function,
  textFields: Array<Object>
};

type State = {
  refetching: boolean
};

class DiscussionAdmin extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      refetching: false
    };
  }

  componentDidMount() {
    this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
  }

  componentWillUnmount() {
    this.props.router.setRouteLeaveHook(this.props.route, null);
  }

  routerWillLeave = () => {
    if (this.dataHaveChanged() && !this.state.refetching) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  dataHaveChanged = () => this.props.sectionsHaveChanged || this.props.profileOptionsHasChanged;

  saveAction = () => {
    const {
      createSection,
      deleteSection,
      i18n,
      refetchSections,
      sections,
      sectionsHaveChanged,
      updateSection,
      createTextField,
      updateTextField,
      deleteTextField,
      profileOptionsHasChanged,
      textFields,
      refetchTextFields
    } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`, false, -1);

    if (sectionsHaveChanged) {
      const mutationsPromises = getMutationsPromises({
        items: sections,
        variablesCreator: createVariablesForSectionMutation,
        deleteVariablesCreator: createVariablesForDeleteSectionMutation,
        createMutation: createSection,
        updateMutation: updateSection,
        deleteMutation: deleteSection,
        lang: i18n.locale
      });
      runSerial(mutationsPromises)
        .then(() => {
          this.setState({ refetching: true }, () => {
            refetchSections().then(() => {
              displayAlert('success', I18n.t('administration.sections.successSave'));
              this.setState({ refetching: false });
            });
          });
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (profileOptionsHasChanged) {
      const mutationsPromises = getMutationsPromises({
        items: textFields,
        variablesCreator: createVariablesForTextFieldMutation,
        deleteVariablesCreator: createVariablesForDeleteTextFieldMutation,
        createMutation: createTextField,
        updateMutation: updateTextField,
        deleteMutation: deleteTextField,
        lang: i18n.locale,
        refetchQueries: [
          {
            query: ProfileFieldsQuery,
            variables: {
              lang: i18n.locale
            }
          }
        ]
      });

      runSerial(mutationsPromises).then(() => {
        this.setState({ refetching: true }, () => {
          refetchTextFields().then(() => {
            displayAlert('success', I18n.t('administration.profileOptions.successSave'));
            this.setState({ refetching: false });
          });
        });
      });
    }
  };

  render() {
    const { section } = this.props;
    const saveDisabled = !this.dataHaveChanged();
    // @TODO use final-form logic
    const showSaveButton =
      section !== SECTION_PERSONALIZE_INTERFACE &&
      section !== SECTION_DISCUSSION_PREFERENCES &&
      section !== SECTION_TIMELINE &&
      section !== SECTION_LEGAL_CONTENTS;
    return (
      <div className="discussion-admin">
        {showSaveButton && <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />}
        {section === SECTION_PERSONALIZE_INTERFACE && <PersonalizeInterface {...this.props} />}
        {section === SECTION_DISCUSSION_PREFERENCES && <PreferencesSection {...this.props} />}
        {section === SECTION_TIMELINE && <TimelineForm {...this.props} />}
        {section === SECTION_PROFILE_OPTIONS && <ManageProfileOptionsForm />}
        {section === SECTION_MENU_SECTION && <ManageSectionsForm {...this.props} />}
        {section === SECTION_LEGAL_CONTENTS && <LegalContentsForm {...this.props} />}
      </div>
    );
  }
}

const mapStateToProps: ReduxState => Object = ({ admin: { editLocale, sections, profileOptions }, i18n }) => {
  const { sectionsById, sectionsHaveChanged, sectionsInOrder } = sections;
  const { profileOptionsHasChanged, textFieldsById } = profileOptions;
  const textFields = textFieldsById
    .map(textField => textField)
    .valueSeq()
    .toJS();
  textFields.forEach((field) => {
    const newField = field;
    if (field.options) {
      // convert options to array, and remove _hasChanged on option that is set by moveItemUp/Down.
      newField.options = Object.values(field.options).map(option => ({
        // $FlowFixMe error because option is typed mixed
        id: option.id,
        // $FlowFixMe error because option is typed mixed
        labelEntries: option.labelEntries,
        // $FlowFixMe error because option is typed mixed
        order: option.order
      }));
    }
  });

  return {
    editLocale: editLocale,
    i18n: i18n,
    sectionsHaveChanged: sectionsHaveChanged,
    sections: sectionsById
      .map((section) => {
        const id = section.get('id');
        const currentOrder = section.get('order');
        const newOrder = sectionsInOrder.indexOf(id);
        let newSection = section.set('order', newOrder);
        if (currentOrder !== newOrder) {
          newSection = newSection.set('_hasChanged', true);
        }
        return newSection;
      }) // fix order of sections
      .valueSeq() // convert to array of Map
      .toJS(), // convert to array of objects
    profileOptionsHasChanged: profileOptionsHasChanged,
    textFields: textFields
  };
};

export default compose(
  graphql(createSectionMutation, {
    name: 'createSection'
  }),
  graphql(deleteSectionMutation, {
    name: 'deleteSection'
  }),
  graphql(updateSectionMutation, {
    name: 'updateSection'
  }),
  graphql(createTextFieldMutation, {
    name: 'createTextField'
  }),
  graphql(deleteTextFieldMutation, {
    name: 'deleteTextField'
  }),
  graphql(updateTextFieldMutation, {
    name: 'updateTextField'
  }),
  connect(mapStateToProps),
  withApollo
)(DiscussionAdmin);