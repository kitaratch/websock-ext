import React from 'react';
import {FormattedMessage} from 'react-intl';

/**
 * MicroBit More extension
 */

import iconURL from './entry-icon.png';
import insetIconURL from './inset-icon.svg';
import translations from './translations.json';

const entry = {
    name: (
        <FormattedMessage
            defaultMessage="ネットワーク拡張(v0.2.3)"
            description="name of the extension"
            id="websockExt.entry.name"
        />
    ),
    extensionId: 'websockExt',
    extensionURL: null, // built-in (stretch3) install: built-in extensionなので extensionURL を指定してはならない.
    collaborator: 'Programming Education Lab',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    description: (
        <FormattedMessage
            defaultMessage="ネットワーク通信をします"
            description="escription for this extension"
            id="websockExt.entry.description"
        />
    ),
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: true,
    helpLink: 'https://kitaratch.github.io/',
    translationMap: translations
};

export {entry}; // loadable-extension needs this line.
export default entry;
