export function beautifulTry(callback: Function) {
    try {
        callback();
    } catch (e) {
        console.error(e.name + ': ' + e.message);
        if (beautifulTry.helpMessage) {
            console.error(beautifulTry.helpMessage);
        }

        process.exit(1);
    }
}

beautifulTry.helpMessage = '';
