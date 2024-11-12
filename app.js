const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const consoleClear = require('console-clear');
const figlet = require('figlet');
const colors = require('colors');

const intro = 'QUERY ID Tool';
const accountsData = path.join(__dirname, 'accounts.json');
const sessionsDir = path.join(__dirname, 'sessions');

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

function displayBanner() {
    consoleClear();
    console.log(
        colors.blue(
            figlet.textSync(intro, {
                horizontalLayout: 'default',
                verticalLayout: 'default'
            })
        )
    );
    console.log(colors.blue('Telegram MiniApp QueryId'));
}

function loadAccounts() {
    if (!fs.existsSync(accountsData)) {
        console.error(colors.red('accounts.json file not found.'));
        process.exit(1);
    }

    const data = fs.readFileSync(accountsData, 'utf8');
    let account;
    try {
        accountsJSON = JSON.parse(data);
    } catch (error) {
        console.error(colors.red('Error parsing accounts.json:'), error.message);
        process.exit(1);
    }

    return accountsJSON;
}

function promptInput(promptText) {
    return readlineSync.question(colors.magenta(promptText));
}

async function loginWithPhoneNumber(account) {
    const { id, api_id, api_hash, phone_number } = account;
    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, parseInt(api_id), api_hash, { connectionRetries: 5 });

    console.log(colors.yellow(`Logging in account ID: ${id}, Phone: ${phone_number}`));

    try {
        await client.start({
            phoneNumber: async () => phone_number,
            phoneCode: async () => promptInput('Enter the code you received: '),
            password: async () => promptInput('Enter your password (if required): '),
            onError: (err) => console.error(colors.red('Login Error:'), err)
        });

        console.log(colors.green(`Logged in successfully for account ID: ${id}`));

        const sessionString = client.session.save();
        const sessionFile = path.join(sessionsDir, `${id}_session`);

        fs.writeFileSync(sessionFile, sessionString, 'utf8');
        console.log(colors.green(`Session saved to ${sessionFile}`));

        return { client, id, phone_number };
    } catch (error) {
        console.error(colors.red(`Failed to login for account ID: ${id}`), error.message);
        return null;
    }
}

async function loginWithSessionFile(account) {
    const { id, api_id, api_hash, phone_number } = account;
    const sessionFile = path.join(sessionsDir, `${id}_session`);

    if (!fs.existsSync(sessionFile)) {
        console.log(colors.yellow(`Session file not found for account ID: ${id}. Initiating login with phone number.`));
        return await loginWithPhoneNumber(account);
    }

    const sessionData = fs.readFileSync(sessionFile, 'utf8').trim();

    if (!sessionData) {
        console.log(colors.yellow(`Session file is empty for account ID: ${id}. Initiating login with phone number.`));
        return await loginWithPhoneNumber(account);
    }

    const stringSession = new StringSession(sessionData);
    const client = new TelegramClient(stringSession, parseInt(api_id), api_hash, { connectionRetries: 5 });

    console.log(colors.yellow(`Logging in using session for account ID: ${id}, Phone: ${phone_number}`));

    try {
        await client.start();
        console.log(colors.green(`Logged in successfully using session for account ID: ${id}`));
        return { client, id, phone_number };
    } catch (error) {
        console.error(colors.red(`Failed to login using session for account ID: ${id}`), error.message);
        console.log(colors.yellow(`Attempting login with phone number for account ID: ${id}.`));
        return await loginWithPhoneNumber(account);
    }
}

async function requestWebViewForClient(client, botPeer, webViewURL) {
    try {
        const result = await client.invoke(
            new Api.messages.RequestWebView({
                peer: botPeer,
                bot: botPeer,
                fromBotMenu: false,
                url: webViewURL,
                platform: 'android'
            })
        );

        if (!result || !result.url) {
            throw new Error('No URL returned from RequestWebView.');
        }

        const urlFragment = result.url.split('#')[1];
        if (!urlFragment) {
            throw new Error('URL does not contain a fragment.');
        }

        const params = new URLSearchParams(urlFragment);
        const tgWebAppDataEncoded = params.get('tgWebAppData');

        if (!tgWebAppDataEncoded) {
            throw new Error('tgWebAppData not found in URL fragment.');
        }

        return [result.url, tgWebAppDataEncoded];
    } catch (error) {
        console.error(colors.red('Error requesting WebView:'), error.message);
        return null;
    }
}

async function handleRequestWebView() {
    const accountsData = loadAccounts();
    const loggedInAccounts = [];

    for (const account of accountsData) {
        const accountInfo = await loginWithSessionFile(account);
        if (accountInfo) {
            loggedInAccounts.push(accountInfo);
        }
    }

    if (loggedInAccounts.length === 0) {
        console.error(colors.red('No accounts are logged in. Returning to main menu.'));
        return;
    }

    console.log('');
    console.log('1. Bums');
    console.log('2. Blum');
    console.log('3. Major');
    console.log('4. Cats');
    console.log('5. TapSwap');
    console.log('6. DragonzLand');
    console.log('7. Coub');
    console.log('8. Seed');
    console.log('0. Exit');

    const choice = readlineSync.question('Please select a game: ').trim();
    console.log('');

    var botPeer = '';
    var webViewURL = '';

    if (choice === '1') {
        var botPeer = 'bums_ton_bot';
        var webViewURL = 'https://app.bums.bot/';
    } else if (choice === '2') {
        var botPeer = 'BlumCryptoBot';
        var webViewURL = 'https://telegram.blum.codes/';
    } else if (choice === '3') {
        var botPeer = 'major';
        var webViewURL = 'https://major.bot/';
    } else if (choice === '4') {
        var botPeer = 'catsgang_bot';
        var webViewURL = 'https://api.catshouse.club/';
    } else if (choice === '5') {
        var botPeer = 'tapswap_mirror_1_bot';
        var webViewURL = 'https://app.tapswap.club/';
    } else if (choice === '6') {
        var botPeer = 'dragonz_land_bot';
        var webViewURL = 'https://bot.dragonz.land/';
    } else if (choice === '7') {
        var botPeer = 'coub';
        var webViewURL = 'https://coub.com/';
    } else if (choice === '8') {
        var botPeer = 'seed_coin_bot';
        var webViewURL = 'https://cf.seeddao.org/';
    } else if (choice === '0') {
        console.log(colors.green('Exiting the application. Goodbye!'));
        process.exit(0);
    } else {
        console.log(colors.red('Invalid game select option. Please try again.\n'));
        promptInput('Press Enter to continue...');
    }

    const dataList = [];

    for (const account of loggedInAccounts) {
        console.log(colors.blue(`\nProcessing account ID: ${account.id}, Phone: ${account.phone_number}`));
        const tgWebAppData = await requestWebViewForClient(account.client, botPeer, webViewURL);

        if (tgWebAppData) {
            dataList.push({
                id: account.id,
                url: tgWebAppData[0],
                query_id: tgWebAppData[1]
            });
            console.log(colors.green(`✅ QueryId successfully requested & saved for Account ID: ${account.id} - Phone: ${account.phone_number}`));
        } else {
            console.log(colors.red(`Failed to extract tgWebAppData for account ID: ${account.id}`));
        }
    }

    if (dataList.length === 0) {
        console.error(colors.red('No queryIds were extracted. Returning to main menu.'));
        return;
    }

    const sanitizedBotPeer = botPeer.replace('@', '');
    let outputFileName = '';
    let dataToSave = null;

    dataToSave = dataList;
    outputFileName = `${sanitizedBotPeer}_queryIds.json`;

    const outputPath = path.join(__dirname, outputFileName);

    try {
        fs.writeFileSync(outputPath, JSON.stringify(dataToSave, null, 4), 'utf8');
        console.log(colors.green(`\nQueryIds have been saved to ${outputFileName}\n`));
    } catch (error) {
        console.error(colors.red('Error writing to output file:'), error.message);
    }

    for (const account of loggedInAccounts) {
        try {
            await account.client.disconnect();
            console.log(colors.yellow(`Disconnected account ID: ${account.id}`));
        } catch (error) {
            console.error(colors.red(`Error disconnecting account ID: ${account.id}`), error.message);
        }
    }

    console.log(colors.green('All operations completed successfully.\n'));
}

async function main() {
    while (true) {
        displayBanner();

        console.log('1. Request QueryId');
        console.log('0. Exit');

        const choice = readlineSync.question('Please select an option: ').trim();
        console.log('');

        if (choice === '1') {
            await handleRequestWebView();
            promptInput('Press Enter to return to the main menu...');
        } else if (choice === '0') {
            console.log(colors.green('Exiting the application. Goodbye!'));
            process.exit(0);
        } else {
            console.log(colors.red('Invalid option. Please try again.\n'));
            promptInput('Press Enter to continue...');
        }
    }
}

main();