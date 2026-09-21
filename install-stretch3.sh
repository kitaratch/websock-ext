#!/bin/sh

## Install script for https://stretch3.github.io/
## suppoesed dir configuration:
##  scratch-gui
##      - microbitMore

LF=$(printf '\\\012_')
LF=${LF%_}
EXTENSION_REP=websock-ext
EXTENSION_ID=websockExt

set -e

### register it as a builtin extenstion
mkdir -p node_modules/scratch-vm/src/extensions/${EXTENSION_ID}
cp ${EXTENSION_REP}/dist/${EXTENSION_ID}.mjs node_modules/scratch-vm/src/extensions/${EXTENSION_ID}/
# keep the pristine original on first run only, using a suffix unique to this extension so other extensions' installers don't collide
EXTENSION_MANAGER_ORIG=node_modules/scratch-vm/src/extension-support/extension-manager.js_orig_${EXTENSION_ID}
if [ ! -f ${EXTENSION_MANAGER_ORIG} ]; then
    cp node_modules/scratch-vm/src/extension-support/extension-manager.js ${EXTENSION_MANAGER_ORIG}
fi
sed -e "s|class ExtensionManager {|builtinExtensions['${EXTENSION_ID}'] = () => {${LF}    const formatMessage = require('format-message');${LF}    const ext = require('../extensions/${EXTENSION_ID}/${EXTENSION_ID}.mjs');${LF}    const blockClass = ext.blockClass;${LF}    blockClass.formatMessage = formatMessage;${LF}    return blockClass;${LF}};${LF}${LF}class ExtensionManager {|g" ${EXTENSION_MANAGER_ORIG} > node_modules/scratch-vm/src/extension-support/extension-manager.js

### copy entry files
mkdir -p src/lib/libraries/extensions/${EXTENSION_ID}
cp ${EXTENSION_REP}/src/gui/lib/libraries/extensions/entry/index-stretch3.jsx src/lib/libraries/extensions/${EXTENSION_ID}/index.jsx
cp ${EXTENSION_REP}/src/gui/lib/libraries/extensions/entry/entry-icon.png src/lib/libraries/extensions/${EXTENSION_ID}/
cp ${EXTENSION_REP}/src/gui/lib/libraries/extensions/entry/inset-icon.svg src/lib/libraries/extensions/${EXTENSION_ID}/

### insert it to the library
# keep the pristine original on first run only, using a suffix unique to this extension so other extensions' installers don't collide
LIBRARY_INDEX_ORIG=src/lib/libraries/extensions/index.jsx_orig_${EXTENSION_ID}
if [ ! -f ${LIBRARY_INDEX_ORIG} ]; then
    cp src/lib/libraries/extensions/index.jsx ${LIBRARY_INDEX_ORIG}
fi
sed -e "s|^export default \[$|import ${EXTENSION_ID}Entry from './${EXTENSION_ID}/index.jsx';${LF}${LF}export default [${LF}    ${EXTENSION_ID}Entry,|g" ${LIBRARY_INDEX_ORIG} > src/lib/libraries/extensions/index.jsx
