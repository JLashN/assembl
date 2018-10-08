// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import Adapter from 'enzyme-adapter-react-16';
// GraphQL imports
import CommentQuery from '../../../../../js/app/graphql/BrightMirrorFictionQuery.graphql';
// Components imports
import FictionComment from '../../../../../js/app/components/debate/brightMirror/fictionComment';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import ToggleCommentButton from '../../../../../js/app/components/debate/common/toggleCommentButton';
import ReplyToCommentButton from '../../../../../js/app/components/debate/common/replyToCommentButton';
// Type imports
import type { FictionCommentGraphQLProps } from '../../../../../js/app/components/debate/brightMirror/fictionComment';

// Import existing storybook data
import { defaultFictionComment } from '../../../../../js/app/stories/components/debate/brightMirror/fictionComment.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionComment$/
});

configure({ adapter: new Adapter() });

describe('<FictionComment /> - with mount', () => {
  let wrapper;
  let mocks;
  let fictionComment: FictionCommentGraphQLProps;

  describe('when loading is done without error', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should render one CircleAvatar with default value', () => {
      expect(wrapper.find(CircleAvatar)).toHaveLength(1);
    });

    it('should display the comment author fullname', () => {
      expect(wrapper.contains(defaultFictionComment.authorFullname)).toBe(true);
    });

    it('should display the comment published date', () => {
      expect(wrapper.find(`time [dateTime="${defaultFictionComment.publishedDate}"]`)).toHaveLength(1);
      expect(wrapper.contains(defaultFictionComment.displayedPublishedDate)).toBe(true);
    });

    it('should display the comment content', () => {
      expect(wrapper.contains(defaultFictionComment.commentContent)).toBe(true);
    });

    xit('TODO: should display the number of child comments', () => {
      expect(wrapper.contains(`${defaultFictionComment.numberOfChildComments} answers`)).toBe(true);
    });

    xit('TODO: should display a "toggle comment" button', () => {
      expect(wrapper.find(ToggleCommentButton)).toHaveLength(1);
    });

    xit('TODO: should display a "reply to comment" button', () => {
      expect(wrapper.find(ReplyToCommentButton)).toHaveLength(1);
    });
  });

  describe('when authorFullname is null', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        authorFullname: '',
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display "no author specified"', () => {
      expect(wrapper.contains('Auteur non défini')).toBe(true);
    });
  });
});