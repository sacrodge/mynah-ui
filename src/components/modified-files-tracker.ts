/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DomBuilder, ExtendedHTMLElement } from '../helper/dom';
import { StyleLoader } from '../helper/style-loader';
import { CollapsibleContent } from './collapsible-content';
import { ModifiedFilesChatItem } from '../static';
import testIds from '../helper/test-ids';
import { MynahUITabsStore } from '../helper/tabs-store';
import { ChatItemTreeFile } from './chat-item/chat-item-tree-file';

export interface ModifiedFilesTrackerProps {
  tabId: string;
  visible?: boolean;
}

export class ModifiedFilesTracker {
  render: ExtendedHTMLElement;
  private readonly props: ModifiedFilesTrackerProps;
  private readonly collapsibleContent: CollapsibleContent;
  public titleText: string = 'No files modified!';

  constructor (props: ModifiedFilesTrackerProps) {
    StyleLoader.getInstance().load('components/_modified-files-tracker.scss');
    this.props = { visible: false, ...props };

    this.collapsibleContent = new CollapsibleContent({
      title: this.titleText,
      initialCollapsedState: true,
      children: [],
      classNames: [ 'mynah-modified-files-tracker' ],
      testId: testIds.modifiedFilesTracker.wrapper
    });

    this.render = DomBuilder.getInstance().build({
      type: 'div',
      classNames: [
        'mynah-modified-files-tracker-wrapper',
        ...(this.props.visible === true ? [] : [ 'hidden' ])
      ],
      testId: testIds.modifiedFilesTracker.container,
      children: [ this.collapsibleContent.render ]
    });

    const tabDataStore = MynahUITabsStore.getInstance().getTabDataStore(this.props.tabId);

    tabDataStore.subscribe('modifiedFilesList', (modifiedFiles: ModifiedFilesChatItem | null) => {
      this.renderModifiedFiles(modifiedFiles);
    });

    const modifiedFiles = tabDataStore.getValue('modifiedFilesList');
    this.renderModifiedFiles(modifiedFiles);
  }

  private renderModifiedFiles (modifiedFiles: ModifiedFilesChatItem | null): void {
    const contentWrapper = this.collapsibleContent.render.querySelector('.mynah-collapsible-content-label-content-wrapper');
    if (contentWrapper == null) return;

    // Update title if provided
    if (modifiedFiles?.title != null && modifiedFiles.title !== '') {
      this.collapsibleContent.updateTitle(modifiedFiles.title);
    }

    contentWrapper.innerHTML = '';

    if ((modifiedFiles?.fileList?.filePaths?.length ?? 0) > 0 && modifiedFiles?.fileList != null) {
      this.renderFilePills(contentWrapper, modifiedFiles);
    } else {
      this.renderEmptyState(contentWrapper);
    }
  }

  private renderEmptyState (contentWrapper: Element): void {
    contentWrapper.appendChild(DomBuilder.getInstance().build({
      type: 'div',
      classNames: [ 'mynah-modified-files-empty-state' ],
      children: [ 'No modified files' ]
    }));
  }

  private renderFilePills (contentWrapper: Element, modifiedFiles: ModifiedFilesChatItem): void {
    const messageId = modifiedFiles.messageId ?? `modified-files-tracker-${this.props.tabId}`;
    const fileList = modifiedFiles.fileList;
    if (fileList == null) return;

    const filesContainer = DomBuilder.getInstance().build({
      type: 'div',
      classNames: [ 'mynah-modified-files-list' ],
      children: (fileList.filePaths ?? []).map(filePath =>
        new ChatItemTreeFile({
          filePath,
          fileName: filePath.split('/').pop() ?? filePath,
          originalFilePath: filePath,
          tabId: this.props.tabId,
          messageId,
          deleted: (fileList.deletedFiles ?? []).includes(filePath),
          details: fileList.details?.[filePath],
          actions: fileList.actions?.[filePath]
        }).render
      )
    });

    contentWrapper.appendChild(filesContainer);
  }

  public setVisible (visible: boolean): void {
    if (visible) {
      this.render.removeClass('hidden');
    } else {
      this.render.addClass('hidden');
    }
  }
}
