import React from 'react';
import {FormattedMessage} from 'react-intl';

/**
 * MicroBit More extension
 */

import pcratchIoTIconURL from './entry-icon.png';
import pcratchIoTInsetIconURL from './inset-icon.svg';
import pcratchIoTConnectionIconURL from './connection-icon.svg';
import pcratchIoTConnectionSmallIconURL from './connection-small-icon.svg';

const version = 'v0.2.1';
const translations =
{
    "en": {
        "websockExt.entry.name": "Network Extension(v0.2.1)",
        "websockExt.entry.description": "Network communication"
    },
    "ja": {
        "websockExt.entry.name": "ネットワーク拡張(v0.2.1)",
        "websockExt.entry.description": "ネットワーク通信をします"
    },
    "ja-Hira": {
        "websockExt.entry.name": "ネットワークかくちょう(v0.2.1)",
        "websockExt.entry.description": "ネットワークつうしんをします"
    }
};

const entry = {
    name: (
        <FormattedMessage
            defaultMessage="Websock 拡張"
            description="name of the extension"
            id="websockExt.entry.name"
        />
    ),
    extensionId: 'websockExt',
    extensionURL: null, // built-in (stretch3) install: built-in extensionなので extensionURL を指定してはならない.
    collaborator: 'Programming Education Lab',
    iconURL: pcratchIoTIconURL,
    insetIconURL: pcratchIoTInsetIconURL,
    description: (
        <FormattedMessage
            defaultMessage='WebSocket でネットワーク通信をします'
            description="escription for this extension"
            id="websockExt.entry.description"
        />
    ),
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    launchPeripheralConnectionFlow: false,
    useAutoScan: false,
    connectionIconURL: pcratchIoTConnectionIconURL,
    connectionSmallIconURL: pcratchIoTConnectionSmallIconURL,
    connectingMessage: (
        <FormattedMessage
            defaultMessage="Connecting"
            description="Message to help people connect to the Websock extension."
            id="websockExt.entry.Connecting"
        />
    ),
    helpLink: 'https://kitaratch.github.io/',
    translationMap: translations
};

export {entry}; // loadable-extension needs this line.
export default entry;
