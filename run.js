const { exec } = require('child_process');
const axios = require('axios');

const mainFile = '';
const restartInterval = 2 * 60 * 60 * 1000;
const restartDelay = 5000;
const webhookUrl = '';

let childProcess = null;
let restarting = false;
let actualRestartInterval = restartInterval;

async function sendWebhookEmbed(title, description, colorHex) {
    const embed = {
        title: title,
        description: description,
        color: colorHex,
        timestamp: new Date().toISOString(),
    };

    try {
        await axios.post(webhookUrl, {
            embeds: [embed],
        });
        console.log('Webhook embed sent successfully.');
    } catch (error) {
        console.error('Failed to send webhook embed:', error.message);
    }
}

async function startMainFile() {
    if (childProcess) {
        console.log('Stopping the previous instance...');
        childProcess.kill();
        await new Promise(resolve => childProcess.on('exit', resolve));
    }

    const startTime = Date.now();

    console.log('Starting the main file...');
    if (restarting) {
        const nextRestartTime = Math.floor((Date.now() + actualRestartInterval) / 1000);
        await sendWebhookEmbed(
            "NexBL Restart Complete",
            `All NexBL clients have restarted successfully.\nNext restart in: <t:${nextRestartTime}:R>`,
            0x00FF00
        );
        restarting = false;
    }

    childProcess = exec(`node ${mainFile}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing main file: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });

    childProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    childProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    const elapsedTime = Date.now() - startTime + restartDelay;
    actualRestartInterval = restartInterval - elapsedTime;
    if (actualRestartInterval < 0) actualRestartInterval = 0;
}

async function restartMainFile() {
    console.log('Restarting main file...');
    await sendWebhookEmbed(
        "NexBL is Restarting",
        "⚠️ All NexBL clients are restarting! This will take around 3 seconds to complete.",
        0xFFFF00
    );
    restarting = true;
    setTimeout(() => {
        startMainFile();
    }, restartDelay);
}

startMainFile();
setInterval(restartMainFile, restartInterval + restartDelay);
