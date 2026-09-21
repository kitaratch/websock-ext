import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import translations from './translations.json';
import blockIcon from './block-icon.png';

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.defaultMessage;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    if (typeof formatMessage.setup !== 'function') {
        // formatMessage was not replaced by runtime.formatMessage (e.g. built-in install
        // on stretch3), so there is no locale table to extend.
        return;
    }
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations) {
        Object.keys(translations).forEach(locale => {
            if (localeSetup.translations[locale]) {
                Object.assign(localeSetup.translations[locale], translations[locale]);
            }
        });
    }
};

const EXTENSION_ID = 'websockExt';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://kitaratch.github.io/websock-ext/dist/websockExt.mjs';

/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'Websock.name',
            default: 'Websock Extension',
            description: 'Websock'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for My Extension.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        } else if (ExtensionBlocks.formatMessage) {
            // Built-in extensions receive the formatter through the class by the installer.
            formatMessage = ExtensionBlocks.formatMessage;
        }

        try {
            // ソケット作成とソケットの監視
            this.socket = null;
            this.sendData = [];
            this.recvData = [];
            this.currentData = {};
            this.readflag = false;
            this.wsockOpen = () => {
                this.sendData = [];
                this.recvData = [];
                this.currentData = {};
                this.readflag = false;
                if (this.socket && this.socket.readyState == 1) { // open
                    return;
                }
                this.socket = new WebSocket("wss://j-code.org/ws/");
                //console.log("new wsock:", this.wsock);
                // open this.socket
                this.socket.addEventListener('open', e => {
                    try {
                        console.log('wsock-open:', this.socket );
                        this.wsockAllSend() // 接続待ちのパケットを送る
                    } catch (error) {
                        console.log(error);
                    }
                })
                // close 終わり
                this.socket.addEventListener('close', e => {
                    try {
                        //console.log("wsock-close!!:", this.socket )
                        alert(formatMessage({
                            id: "websock.closed",
                            default: "せつぞくが クローズしました！",
                        }));
                    } catch (error) {
                        console.log(error);
                    }
                })
                // message サーバからのデータ受信時に呼ばれる
                this.socket.addEventListener('message', e => {
                    try {
                        //console.log("recv message:", e.data)
                        var msg = JSON.parse(e.data)
                        if (msg && msg.MSGTYPE=="MESSAGE") {
                            this.recvData.push(msg);
                            //console.log("message:", this.recvData.length)
                        }
                        if (msg && msg.MSGTYPE=="KEEPALIVE") {
                            this.socket.send(JSON.stringify({
                                MSGTYPE: "KEEPALIVE",
                            }));
                            console.log("KEEPALIVE!!")
                        }
                    } catch (error) {
                        console.log(error);
                    }
                })
            }
            // 送信待ちデータを全部送信
            this.wsockAllSend = async()=>{
                while (this.sendData.length > 0 && this.socket && this.socket.readyState == 1) {
                    if (this.socket.bufferedAmount == 0) {
                        //console.log("wsockAllSend:", this.sendData.length, this.socket.bufferedAmount)
                        var msg = this.sendData.shift()
                        this.socket.send(msg);
                        return 0;
                    } else if (this.sendData.length > 100) {
                        console.log("buffer over 100!", this.sendData.length, this.socket.bufferedAmount);
                        this.socket.close();
                        alert(formatMessage({
                            id: "send_too_much",
                            default: "そうしんが おおすぎ なので、接続をクローズしました！",
                        }));
                        return 0;
                    } else {
                        console.log("sleep x ms:", this.sendData.length, this.socket.bufferedAmount)
                        await new Promise(s => setTimeout(s, this.sendData.length * 5))
                    }
                }
            }
            // 準備状態
            this.wsockReadyState = ()=>{
                return (this.socket) ? this.socket.readyState : 0;
            }
            // 送信
            this.wsockSend = (message) => {
                this.sendData.push(message);
                this.wsockAllSend()
            }

        } catch (error) {
            console.log(error);
        }

    }
    /**
     * 送受信ポート
     * bind
     */
    websockBind(args) {
        try {
            this.wsockOpen();
            this.port = Cast.toString(args.PORT);
            this.wsockSend(JSON.stringify({
                MSGTYPE: "BIND",
                room: this.port,
            }));
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * listen
     */
    websockListen (args) {
        try {
            this.wsockOpen();
            this.server = Cast.toString(args.SERVER);
            this.port = Cast.toString(args.PORT);
            //console.log("listen at ", this.server+this.port);
            // room に接続
            this.wsockSend(JSON.stringify({
                MSGTYPE: "LISTEN",
                room: this.server+this.port,
            }));
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * connect
     */
    websockConnect (args) {
        try {
            this.wsockOpen();
            this.server = Cast.toString(args.SERVER);
            this.port = Cast.toString(args.PORT);
            //console.log("connect to ", this.server+this.port);
            this.wsockSend(JSON.stringify({
                MSGTYPE: "CONNECT",
                room: this.server+this.port,
            }));
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * name 名前を設定する
     * @param {TEXT} args - name to be given.
     */
     websockname (args) {
        try {
            const text = Cast.toString(args.TEXT);
            this.wsockSend(JSON.stringify({
                MSGTYPE: "NAME",
                name: text,
            }));
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * 切断
     * close
     * @param {TEXT} args - name to be given.
     */
     websockclose (args) {
        this.socket && this.socket.close();
    }
    /*
    【送受信】メッセージの送受信
    {
        MSGTYPE: "MESSAGE",
        sendto: "宛先ID"
            "": 差出人を除く全員に送る（sendto が無い場合、null の場合も同じ）
            "*": 差出人を含む全員に送る
        from: "送信元ID"（サービスが自動付加する）
        （その他は自由に利用）
    }
    */
    /**
     * 送信
     * Send Message.
     * @param {TEXT} args - the message to be sent.
     */
     websockSend(args) {
        try {
            const text = Cast.toString(args.TEXT);
            //console.log("websockSend:", text);
            this.wsockSend(JSON.stringify({
                MSGTYPE: "MESSAGE",
                message: text,
            }));
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * 送信（アドレス指定）
     * Send Message.
     * @param {TEXT} args - the message to be sent.
     */
    websockSendTo(args) {
        try {
            const text = Cast.toString(args.TEXT);
            const sendto = Cast.toString(args.SENDTO);
            //console.log("websockSendto:", text);
            this.wsockSend(JSON.stringify({
                MSGTYPE: "MESSAGE",
                sendto: sendto,
                message: text,
            }));
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * 受信した時（イベント）
     * When data Recived.
     * @return {true} - data exist.
     */
     websockWhenRecv(args) {
        try {
            if (this.readflag || !this.recvData.length) {
                this.readflag = false;
                return false;
            }
            this.readflag = true;
            this.currentData = this.recvData.shift();
            //console.log("recv:", this.recvData.length, this.currentData);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    /**
     * 受信データ
     * Read current message.
     * @return {Message} - string
     */
    websockRecv() {
        try {
            return "" + this.currentData.message;
        } catch (error) {
            console.log(error);
            return "";
        }
    }
    /**
     * 差出人アドレス
     * Read current message.
     * @return {Message} - string
     */
    websockFrom() {
        try {
            return "" + this.currentData.from;
        } catch (error) {
            console.log(error);
            return "";
        }
    }
    /**
     * 準備状態
     * Read current message.
     * @return {Message} - string
     */
    websockReadyState() {
        try {
            return 0 + this.wsockReadyState(); 
        } catch (error) {
            console.log(error);
            return 0;
        }
    }
    /**
     * 受信データ数
     * Number of recived.
     * @return {Number}
     */
    websockNumrecv() {
        try {
            return 0 + this.recvData.length;
        } catch (error) {
            console.log(error);
            return 0;
        }
    }
    /**
     * 次の受信データ
     */
    websockNextrecv (args) {
        try {
            if (this.recvData.length) {
                this.currentData = this.recvData.shift();
            }
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Web API Call
     */
    async webapi_call (args) {
        try {
            var url = Cast.toString(args.URL);
            var response = await fetch(url);
            var s = await response.text();
            return "" + s;
        } catch(err) {
            console.log(err)
            return "{}"
        }
    }
    /**
     * json_stringfy
     */
    json_stringify(args) {
        try {
            var json = Cast.toString(args.JSON);
            var key = Cast.toString(args.KEY);
            var value = Cast.toString(args.VALUE);
            var j = JSON.parse(json);
            if (j.push && !key) {
                j.push(value);
            } else {
                j[key] = value;
            }
            //console.log("json_stringify:", j)
            var s = JSON.stringify(j);
            return "" + s;
        } catch(err) {
            console.log(err)
            return "{}";
        }
    }
    /**
     * json_parse
     */
    json_parse(args) {
        try {
            var json = Cast.toString(args.JSON);
            var key = Cast.toString(args.KEY);
            var j = JSON.parse(json);
            var val = j[key];
            if (typeof val === "object") {
                val = JSON.stringify(val);
            }
            //console.log("json_parse:", val)
            return "" + val;
        } catch(err) {
            console.log(err)
            return "";
        }
    }

    /*
    doIt (args) {
        const func = new Function(`return (${Cast.toString(args.SCRIPT)})`);
        const result = func.call(this);
        console.log(result);
        return result;
    }
    */

    /**
     * @returns {object} metadata for this extension and its blocks.
     */

    //  TCP
    //  command listen(servername, port)  サーバーの接続待ち
    //  command connect(servername, port) クライアントからサーバーへ接続
    //  UDP
    //  command bind(port)
    //  IP
    //  command send()  全員へ（サーバーへ）
    //  event   recv()  誰かから

    getInfo () {
      setupTranslations();
      return {
        id: ExtensionBlocks.EXTENSION_ID,
        name: ExtensionBlocks.EXTENSION_NAME,
        extensionURL: ExtensionBlocks.extensionURL,
        blockIconURI: blockIcon,
        showStatusButton: false,
        blocks: [
            {
                // 送受信ポート
                // socket bind
                opcode: "websockBind",
                text: formatMessage({
                    id: "websock.bind",
                    default: "送受信 ポート [PORT]",
                    description: "サーバーとして受信を待機します"
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    PORT: {
                        type: ArgumentType.STRING,
                        defaultValue: "7"
                    }
                }
            },
            {
                // 自分のアドレス
                opcode: "websockname",
                text: formatMessage({
                    id: "websock.setname",
                    default: "自分のアドレスを [TEXT] にする",
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "アドレス"
                    }
                }
            },
            {
                // 切断
                opcode: "websockclose",
                text: formatMessage({
                    id: "websock.close",
                    default: "切断",
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                }
            },
            {
                // 送信
                opcode: "websockSend",
                text: formatMessage({
                    id: "websock.send",
                    default: "[TEXT] を送信",
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "hello"
                    }
                }
            },
            {
                // アドレスに送信
                opcode: "websockSendTo",
                text: formatMessage({
                    id: "websock.sendto",
                    default: "[SENDTO] に [TEXT] を送信",
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    SENDTO: {
                        type: ArgumentType.STRING,
                        defaultValue: "アドレス"
                    },
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "hello"
                    }
                }
            },
            {
                // 受信した時（イベント）
                opcode: "websockWhenRecv",
                text: formatMessage({
                    id: "websock.whenrecv",
                    default: "受信したとき",
                }),
                blockType: BlockType.HAT,
                arguments: {},
                isEdgeActivated: true
            },
            {
                // 受信データ
                opcode: "websockRecv",
                text: formatMessage({
                    id: "websock.recv",
                    default: "受信データ",
                }),
                blockType: BlockType.REPORTER
            },
            {
                // 差出人アドレス
                opcode: "websockFrom",
                text: formatMessage({
                    id: "websock.from",
                    default: "差出人アドレス",
                }),
                blockType: BlockType.REPORTER
            },
            {
                // 準備状態
                opcode: "websockReadyState",
                text: formatMessage({
                    id: "websock.state",
                    default: "準備状態",
                }),
                blockType: BlockType.REPORTER
            },
            {
                // 受信データ数
                opcode: "websockNumrecv",
                text: formatMessage({
                    id: "websock.numrecv",
                    default: "受信データ数",
                }),
                blockType: BlockType.REPORTER
            },
            {
                // 次の受信データ
                opcode: "websockNextrecv",
                text: formatMessage({
                    id: "websock.nextrecv",
                    default: "次の受信データ",
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                }
            },
            {
                // Web API call
                opcode: "webapi_call",
                text: formatMessage({
                    id: "webapi_call",
                    default: "Web API 呼出 [URL]",
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    URL: {
                        type: ArgumentType.STRING,
                        defaultValue: "https://api.aoikujira.com/tenki/week.php?fmt=json"
                    }
                }
            },
            {
                // json_parse
                opcode: "json_parse",
                text: formatMessage({
                    id: "json_parse",
                    default: "JSON取出 [JSON] [KEY]",
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    JSON: {
                        type: ArgumentType.STRING,
                        defaultValue: '{}'
                    },
                    KEY: {
                        type: ArgumentType.STRING,
                        defaultValue: 'key'
                    },
                }
            },
            {
                // json_stringify
                opcode: "json_stringify",
                text: formatMessage({
                    id: "json_stringify",
                    default: "JSON追加 [JSON] [KEY] [VALUE]",
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    JSON: {
                        type: ArgumentType.STRING,
                        defaultValue: '{}'
                    },
                    KEY: {
                        type: ArgumentType.STRING,
                        defaultValue: 'key'
                    },
                    VALUE: {
                        type: ArgumentType.STRING,
                        defaultValue: 'value'
                    }
                }
            },
        ],
        menus: {
        }
      };
    }
}

export {
    ExtensionBlocks as default,
    ExtensionBlocks as blockClass
};
