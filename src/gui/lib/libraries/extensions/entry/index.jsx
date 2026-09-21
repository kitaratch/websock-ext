/**
 * This is an extension for Xcratch.
 */

import iconURL from './entry-icon.png';
import insetIconURL from './inset-icon.svg';
import translations from './translations.json';

/**
 * Formatter to translate the messages in this extension.
 * This will be replaced which is used in the React component.
 * @param {object} messageData - data for format-message
 * @returns {string} - translated message for the current locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const entry = {
    get name () {
        return formatMessage({
            id: 'websockExt.entry.name',
            default: "ネットワーク拡張(v0.2.3)",
            description: 'name of the extension'
        });
    },
    extensionId: 'websockExt',
    extensionURL: 'https://kitaratch.github.io/websock-ext/dist/websockExt.mjs',
    collaborator: '',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description () {
        return formatMessage({
            id: 'websockExt.entry.description',
            defaultMessage: "WebSocket でネットワーク通信をします",
            description: 'Description for this extension',
        });
    },
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    helpLink: 'https://pcratch.j-code.org/',
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations
};

export {entry}; // loadable-extension needs this line.
export default entry;
