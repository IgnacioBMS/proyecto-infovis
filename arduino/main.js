import Arduino from './js/arduino.js';

Arduino.start();

export function controlarServo(velocidad) {
    Arduino.contServoWrite({ pin: 6, value: velocidad });
}
