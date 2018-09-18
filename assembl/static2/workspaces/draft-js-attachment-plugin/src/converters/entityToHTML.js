// @flow
import { type EntityInstance } from 'draft-js';

import getDocumentIconPath from '../utils/getDocumentIconPath';
import getFileExtension from '../utils/getFileExtension';

export default function entityToHTML(entity: EntityInstance): string {
  const { id } = entity.data;
  const externalUrl = entity.data.externalUrl ? entity.data.externalUrl : '';
  const mimeType = entity.data.mimeType ? entity.data.mimeType : '';
  const title = entity.data.title ? entity.data.title : '';
  if (mimeType.startsWith('image')) {
    return (
      `<img class="attachment-image" src="${externalUrl}" alt="" title="${title}" ` +
      `data-id="${id}" data-mimetype="${mimeType}" />`
    );
  }

  const extension = getFileExtension(title);
  const iconPath = getDocumentIconPath(extension);
  return (
    `<a href="${externalUrl}" title="${title}">` +
    `<img class="attachment-icon" alt="${extension}" src="${iconPath}" data-id="${id}" data-mimetype="${mimeType}"` +
    ` data-title="${title}" data-externalurl="${externalUrl}" />` +
    '</a>'
  );
}