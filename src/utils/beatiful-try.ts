import { ansi } from '@silva97/ansi';
export function beautifulTry(callback: Function) {
    try {
        callback();
    } catch (e) {
        console.error(ansi`%{f.red;bold}${e.name}%{normal}: ${e.message}`);
        if (beautifulTry.helpMessage) {
            console.error(ansi`%{bold}${beautifulTry.helpMessage}`);
        }

        process.exit(1);
    }
}

beautifulTry.helpMessage = '';
