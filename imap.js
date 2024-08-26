const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const client = new ImapFlow({
    host: process.env.HOST,
    port: process.env.PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    logger: {
        info: () => { },
        debug: () => { },
        error: console.error
    }
});

const main = async () => {
    await client.connect();

    let lock = await client.getMailboxLock('INBOX');
    try {
        let emails = [];
        for await (let msg of client.fetch(
            {
                seen: false,
                from: process.env.FROM
            },
            {
                flags: true,
                envelope: true,
                source: true,
                bodyParts: true,
                bodyStructure: true,
                uid: true,
            }
        )) {
            emails.push(msg);
        }

        for (const mail of emails) {
            console.log("-----------------------------------------------------");
            console.log(`Subject: ${mail.envelope.subject}`);
            console.log(`From: ${mail.envelope.from[0].address}`);
            console.log(`Date: ${mail.envelope.date}`);
            const parsed = await simpleParser(mail.source);
            console.log(`Content:\n${parsed.html}`);
            console.log("-----------------------------------------------------");
        }
    } finally {
        lock.release();
    }

    await client.logout();
};

main().catch(err => console.error(err));